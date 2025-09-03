"use client"

// IMPORTANT: Ensure this URL points to your running backend API.
// If your backend is deployed, update NEXT_PUBLIC_API_BASE_URL in your Vercel project settings
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const INSTRUCTOR_API_BASE_URL = `${API_BASE_URL}/api/admin`
const STUDENT_API_BASE_URL = `${API_BASE_URL}/api/courses`

// Nigerian Bank and Payment Configuration
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
const VIDEO_STREAMING_URL = process.env.NEXT_PUBLIC_VIDEO_STREAMING_URL || `${API_BASE_URL}/media/videos`;

// Helper function to handle API responses
async function handleResponse(response) {
  const contentType = response.headers.get("content-type")
  let data = {}
  
  try {
    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }
    
    console.log("Response data:", data)
    console.log("Response status:", response.status)
    
  } catch (error) {
    console.error("Error parsing response:", error)
    // Return a safe default response
    return {
      success: false,
      error: {
        message: "Invalid response format from server",
        status: response.status,
        details: "Server returned invalid JSON or text"
      }
    }
  }

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred."
    let isRateLimited = false
    let isLocked = false
    let requires2FA = false
    let requiresEmailVerification = false

    if (response.status === 429) {
      isRateLimited = true
      errorMessage = data.detail || "Too many requests. Please try again later."
    } else if (response.status === 423) {
      isLocked = true
      errorMessage = data.detail || "Account is temporarily locked due to multiple failed login attempts."
    } else if (response.status === 400 && data.requires_2fa) {
      requires2FA = true
      errorMessage = data.detail || "2FA token or backup code required."
    } else if (response.status === 400 && data.detail && data.detail.includes("verify your email")) {
      requiresEmailVerification = true
      errorMessage = data.detail
    } else if (data.detail) {
      errorMessage = data.detail
    } else if (typeof data === "string") {
      errorMessage = data
    } else if (data.errors && Object.keys(data.errors).length > 0) {
      errorMessage = Object.values(data.errors).flat().join(" ")
    }

    return {
      success: false,
      error: {
        message: errorMessage,
        status: response.status,
        isRateLimited,
        isLocked,
        requires2FA,
        requiresEmailVerification,
      },
      requires2FA,
      requiresEmailVerification,
    }
  }
  
  // Store tokens if they exist in the response (for login and refresh)
  console.log("Storing tokens from response:", { access_token: data.access_token, token: data.token, refresh_token: data.refresh_token })
  
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token)
    console.log("Stored access_token")
  }
  if (data.token) {
    localStorage.setItem("access_token", data.token)  // Store as access_token for consistency
    console.log("Stored token as access_token")
  }
  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token)
    console.log("Stored refresh_token")
  }
  
  // Store user data if provided in login response
  if (data.user) {
    localStorage.setItem("user_data", JSON.stringify(data.user))
    console.log("Stored user data")
  }
  
  return { success: true, data }
}

// Generic API request function with token handling and automatic refresh
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("access_token")
  console.log("API Request - Token from localStorage:", token ? "EXISTS" : "MISSING")
  
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  }
  
  console.log("API Request - Final headers:", headers)

  // If body is JSON, set Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    // If token is expired (401), try to refresh it
    if (response.status === 401 && token) {
      const refreshResult = await refreshToken()
      if (refreshResult.success) {
        // Retry the original request with new token
        const newToken = localStorage.getItem("access_token")
        const newHeaders = {
          ...options.headers,
          ...(newToken && { Authorization: `Bearer ${newToken}` }),
        }
        
        if (options.body && !(options.body instanceof FormData) && !newHeaders["Content-Type"]) {
          newHeaders["Content-Type"] = "application/json"
        }

        const retryResponse = await fetch(`${API_BASE_URL}${url}`, {
          ...options,
          headers: newHeaders,
        });
        
        return handleResponse(retryResponse)
      } else {
        // Refresh failed, clear tokens and return error
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user_data")
        return { 
          success: false, 
          error: { 
            message: "Session expired. Please login again.",
            status: 401,
            requiresReauth: true
          } 
        }
      }
    }

    return handleResponse(response)
  } catch (error) {
    console.error("Network or unexpected error:", error)
    return { success: false, error: { message: "Network error or unexpected issue." } }
  }
}

// --- AUTHENTICATION ENDPOINTS ---

// 1. User Registration
export async function register({ email, fullName, phoneNumber, role, password, confirmPassword }) {
  return apiRequest(`/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      email,
      full_name: fullName,
      phone_number: phoneNumber,
      role,
      password,
      confirm_password: confirmPassword,
    }),
  })
}

// 2. User Login
export async function login({ email, password, twoFactorToken = "", backupCode = "" }) {
  const payload = { email, password }
  
  if (twoFactorToken) {
    payload.two_factor_token = twoFactorToken
  }
  if (backupCode) {
    payload.backup_code = backupCode
  }
  
  return apiRequest(`/api/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// 3. Token Refresh
export async function refreshToken() {
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) {
    return { success: false, error: { message: "No refresh token available" } }
  }
  
  return apiRequest(`/api/auth/refresh`, {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

// 4. Logout
export async function logout() {
  const refreshToken = localStorage.getItem("refresh_token")
  const result = await apiRequest(`/api/auth/logout`, {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  
  if (result.success) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
  } else {
    console.error("Logout failed on server, but clearing local tokens.", result.error)
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
  }
  return result
}

// 5. Logout All Devices
export async function logoutAllDevices() {
  const result = await apiRequest(`/api/auth/logout-all`, { method: "POST" })
  if (result.success) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
  }
  return result
}

// 6. Verify Email
export async function verifyEmail(token) {
  return apiRequest(`/api/auth/verify-email`, {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

export async function resendVerification(email) {
  return apiRequest(`/api/auth/resend-verification`, {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

// 8. Forgot Password
export async function forgotPassword(email) {
  return apiRequest(`/api/auth/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

// 9. Reset Password Confirmation
export async function resetPassword(token, newPassword, confirmNewPassword) {
  return apiRequest(`/api/auth/reset-password/confirm`, {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    }),
  })
}

// 10. Change Password (Authenticated)
export async function changePassword(currentPassword, newPassword, confirmNewPassword) {
  return apiRequest(`/api/auth/change-password`, {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    }),
  })
}

// 11. Get 2FA Status
export async function get2FAStatus() {
  return apiRequest(`/api/auth/2fa/status`, { method: "GET" })
}

// 12. Enable 2FA - Step 1
export async function enable2FA() {
  return apiRequest(`/api/auth/2fa/enable`, { method: "POST" })
}

// 13. Enable 2FA - Step 2 (Confirmation)
export async function confirm2FA(token) {
  return apiRequest(`/api/auth/2fa/confirm`, {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

// 14. Disable 2FA
export async function disable2FA(password, token) {
  return apiRequest(`/api/auth/2fa/disable`, {
    method: "POST",
    body: JSON.stringify({ password, token }),
  })
}

// 15. Generate Backup Codes
export async function generateBackupCodes() {
  return apiRequest(`/api/auth/2fa/backup-codes`, { method: "POST" })
}

// 16. Regenerate Backup Codes
export async function regenerateBackupCodes(token) {
  return apiRequest(`/api/auth/2fa/regenerate-backup-codes`, {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

// 17. Emergency 2FA Disable
export async function emergency2FADisable(email, password) {
  return apiRequest(`/api/auth/2fa/emergency-disable`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// 18. Get User Profile
export async function getUserProfile() {
  return apiRequest(`/api/auth/users/me`, { method: "GET" })
}

export async function updateUserProfile(profileData) {
  return apiRequest(`/api/auth/users/me/update`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  })
}

// 19. Update User Profile
export async function updateProfile(profileData) {
  return apiRequest(`/api/auth/users/me/update`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  })
}

// 20. Upload Profile Picture
export async function uploadProfilePicture(imageFile) {
  const formData = new FormData()
  formData.append("profile_picture", imageFile)
  
  return apiRequest(`/api/auth/profile/picture`, {
    method: "POST",
    headers: {}, // Remove Content-Type to let browser set it for FormData
    body: formData,
  })
}

// 21. Delete Profile Picture
export async function deleteProfilePicture() {
  return apiRequest(`/api/auth/profile/picture/delete`, { method: "DELETE" })
}

// 22. Get User Sessions
export async function getUserSessions() {
  return apiRequest(`/api/auth/sessions`, { method: "GET" })
}

export async function deleteUserSession(sessionId) {
  return apiRequest(`/api/auth/sessions/${sessionId}`, { method: "DELETE" })
}

// 23. Request Account Deletion
export async function requestAccountDeletion(password) {
  return apiRequest(`/api/auth/delete-account`, {
    method: "POST",
    body: JSON.stringify({ password, confirm_deletion: true }),
  })
}

// 24. Cancel Account Deletion
export async function cancelAccountDeletion(password) {
  return apiRequest(`/api/auth/cancel-deletion`, {
    method: "POST",
    body: JSON.stringify({ password }),
  })
}

// 25. Delete Account Immediately
export async function deleteAccountImmediate(password) {
  return apiRequest(`/api/auth/delete-account-immediate`, {
    method: "POST",
    body: JSON.stringify({ password, confirm_deletion: true }),
  })
}



// --- STUDENT API ENDPOINTS ---

// Course Discovery (Public)
export async function listAllCourses(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  return apiRequest(`/api/courses/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
}

export async function getCourseDetailsPublic(courseId) {
  return apiRequest(`/api/courses/${courseId}/`, { method: "GET" })
}

export async function getFeaturedCourses() {
  return apiRequest(`/api/courses/featured/`, { method: "GET" })
}

export async function getCourseCategoriesPublic() {
  return apiRequest(`/api/courses/categories/`, { method: "GET" })
}

export async function searchCoursesPublic(query, params = {}) {
  const queryString = new URLSearchParams({ q: query, ...params }).toString()
  return apiRequest(`${STUDENT_API_BASE_URL}/search/?${queryString}`, { method: "GET" })
}

// Course Enrollment & Payment (Authenticated)
export async function enrollInCourse(courseId, paymentData = {}) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/enroll/`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  })
}

export async function verifyPayment(reference) {
  return apiRequest(`${STUDENT_API_BASE_URL}/verify-payment/`, {
    method: "POST",
    body: JSON.stringify({ reference }),
  })
}

export async function checkPaymentStatus(reference) {
  return apiRequest(`${STUDENT_API_BASE_URL}/payment-status/${reference}/`, { method: "GET" })
}

// --- PAYMENT API ENDPOINTS ---
export const paymentAPI = {
  // Initialize payment for a course or student registration
  initializePayment: async (courseId, gateway = 'paystack', paymentType = 'course_enrollment', userData = null, amount = null, currency = 'NGN') => {
    const payload = { 
      gateway,
      payment_type: paymentType
    }
    
    if (paymentType === 'course_enrollment') {
      payload.course_id = courseId
      if (amount) {
        payload.amount = amount
        payload.currency = currency
      }
    } else if (paymentType === 'student_registration' && userData) {
      payload.email = userData.email
      payload.full_name = userData.full_name
      payload.phone_number = userData.phone_number
      payload.amount = amount || 5000 // Student registration fee
      payload.currency = currency || 'NGN'
    }
    
    console.log('Initializing payment with payload:', payload)
    
    return apiRequest(`/api/payments/initialize`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  // Verify payment status
  verifyPayment: async (paymentId) => {
    return apiRequest(`/api/payments/verify/${paymentId}`, {
      method: "POST",
    })
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/api/payments/history${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    return apiRequest(`/api/payments/transactions/${paymentId}`, { method: "GET" })
  },

  // Cancel payment
  cancelPayment: async (paymentId) => {
    return apiRequest(`/api/payments/cancel/${paymentId}`, {
      method: "POST",
    })
  },

  // Get available payment gateways
  getPaymentGateways: async () => {
    return apiRequest(`/api/payments/gateways`, { method: "GET" })
  },

  // Instructor payment history
  getInstructorPaymentHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/api/payments/instructor/history${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Admin payment overview
  getAdminPaymentOverview: async () => {
    return apiRequest(`/api/payments/admin/overview`, { method: "GET" })
  },
}

// --- MESSAGING/CHAT API ENDPOINTS ---
export const chatAPI = {
  // Conversations
  getConversations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/api/conversations/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getConversation: async (conversationId) => {
    return apiRequest(`/api/conversations/${conversationId}/`, { method: "GET" })
  },

  createConversation: async (conversationData) => {
    return apiRequest(`/api/conversations/`, {
      method: "POST",
      body: JSON.stringify(conversationData),
    })
  },

  updateConversation: async (conversationId, updateData) => {
    return apiRequest(`/api/conversations/${conversationId}/`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    })
  },

  deleteConversation: async (conversationId) => {
    return apiRequest(`/api/conversations/${conversationId}/`, {
      method: "DELETE",
    })
  },

  // Messages
  getMessages: async (conversationId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/api/conversations/${conversationId}/messages/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  sendMessage: async (conversationId, messageData) => {
    return apiRequest(`/api/conversations/${conversationId}/messages/`, {
      method: "POST",
      body: JSON.stringify(messageData),
    })
  },

  updateMessage: async (messageId, messageData) => {
    return apiRequest(`/api/messages/${messageId}/`, {
      method: "PUT",
      body: JSON.stringify(messageData),
    })
  },

  deleteMessage: async (messageId) => {
    return apiRequest(`/api/messages/${messageId}/`, {
      method: "DELETE",
    })
  },

  // Message actions
  markMessageRead: async (messageId) => {
    return apiRequest(`/api/messages/${messageId}/read/`, {
      method: "POST",
    })
  },

  markConversationRead: async (conversationId) => {
    return apiRequest(`/api/conversations/${conversationId}/read/`, {
      method: "POST",
    })
  },

  // User status
  getUserStatus: async () => {
    return apiRequest(`/api/user/status/`, { method: "GET" })
  },

  updateUserStatus: async (statusData) => {
    return apiRequest(`/api/user/status/`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    })
  },

  setTypingStatus: async (conversationId, isTyping) => {
    return apiRequest(`/api/conversations/${conversationId}/typing/`, {
      method: "POST",
      body: JSON.stringify({ is_typing: isTyping }),
    })
  },

  getOnlineUsers: async (conversationId) => {
    return apiRequest(`/api/conversations/${conversationId}/online-users/`, { method: "GET" })
  },

  // Conversation invitations
  getInvitations: async () => {
    return apiRequest(`/api/invitations/`, { method: "GET" })
  },

  createInvitation: async (invitationData) => {
    return apiRequest(`/api/invitations/`, {
      method: "POST",
      body: JSON.stringify(invitationData),
    })
  },

  respondToInvitation: async (invitationId, action) => {
    return apiRequest(`/api/invitations/${invitationId}/respond/`, {
      method: "POST",
      body: JSON.stringify({ action }),
    })
  },

  // Utility endpoints
  getUnreadCount: async () => {
    return apiRequest(`/api/unread-count/`, { method: "GET" })
  },

  searchConversations: async (query, params = {}) => {
    const queryString = new URLSearchParams({ q: query, ...params }).toString()
    return apiRequest(`/api/conversations/search/?${queryString}`, { method: "GET" })
  },

  // Special conversation creation
  createStudentInstructorConversation: async (courseId, subject = '') => {
    return apiRequest(`/api/conversations/student-instructor/`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, subject }),
    })
  },

  createSupportConversation: async (conversationType, subject = '') => {
    return apiRequest(`/api/conversations/support/`, {
      method: "POST",
      body: JSON.stringify({ conversation_type: conversationType, subject }),
    })
  },
}

// Course Content Access (Authenticated)
export async function getCourseContentStructure(courseId) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/content/`, { method: "GET" })
}

export async function getLessonDetails(courseId, sectionId, lessonId) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/sections/${sectionId}/lessons/${lessonId}/`, {
    method: "GET",
  })
}

export async function updateLessonProgress(courseId, sectionId, lessonId, progressData) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/sections/${sectionId}/lessons/${lessonId}/progress/`, {
    method: "PUT",
    body: JSON.stringify(progressData),
  })
}

export async function manageLessonBookmarks(lessonId, method, bookmarkData = {}) {
  const url = `${API_BASE_URL}/lessons/${lessonId}/bookmarks/`
  const options = { method }
  if (method === "POST") {
    options.body = JSON.stringify(bookmarkData)
  } else if (method === "DELETE") {
    options.body = JSON.stringify(bookmarkData) // Expects { index: 0 }
  }
  return apiRequest(url, options)
}

export async function manageLessonNotes(lessonId, method, notesData = {}) {
  const url = `${API_BASE_URL}/lessons/${lessonId}/notes/`
  const options = { method }
  if (method === "PUT") {
    options.body = JSON.stringify(notesData)
  }
  return apiRequest(url, options)
}

// Progress Tracking (Authenticated)
export async function getMyCourses(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  return apiRequest(`${STUDENT_API_BASE_URL}/my-courses/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
}

export async function getCourseProgress(courseId) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/progress/`, { method: "GET" })
}

export async function updateCourseProgress(courseId, progressData) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/progress/`, {
    method: "PUT",
    body: JSON.stringify(progressData),
  })
}

export async function getMyOverallProgress() {
  return apiRequest(`${STUDENT_API_BASE_URL}/progress/`, { method: "GET" })
}

// Reviews & Feedback (Authenticated)
export async function getCourseReviews(courseId, params = {}) {
  const queryString = new URLSearchParams(params).toString()
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/reviews/${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
  })
}

export async function addCourseReview(courseId, reviewData) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/reviews/`, {
    method: "POST",
    body: JSON.stringify(reviewData),
  })
}

// Exams & Assessments (Authenticated)
export async function getCourseExams(courseId) {
  return apiRequest(`${STUDENT_API_BASE_URL}/${courseId}/exams/`, { method: "GET" })
}

export async function startExam(examId) {
  return apiRequest(`${API_BASE_URL}/exams/${examId}/start/`, { method: "POST" })
}

export async function getExamQuestions(attemptId) {
  return apiRequest(`${API_BASE_URL}/exam-attempts/${attemptId}/questions/`, { method: "GET" })
}

export async function submitExamAnswer(attemptId, questionId, answerData) {
  return apiRequest(`${API_BASE_URL}/exam-attempts/${attemptId}/submit-answer/`, {
    method: "POST",
    body: JSON.stringify({ question_id: questionId, answer_data: answerData }),
  })
}

export async function completeExam(attemptId) {
  return apiRequest(`${API_BASE_URL}/exam-attempts/${attemptId}/complete/`, { method: "POST" })
}

export async function getExamResults(attemptId) {
  return apiRequest(`${API_BASE_URL}/exam-attempts/${attemptId}/results/`, { method: "GET" })
}

// User Dashboard (Authenticated)
export async function getCourseRecommendations() {
  return apiRequest(`${STUDENT_API_BASE_URL}/recommendations/`, { method: "GET" })
}

export async function getUserDashboard() {
  return apiRequest(`${STUDENT_API_BASE_URL}/dashboard/`, { method: "GET" })
}

// --- INSTRUCTOR API ENDPOINTS (from previous turn) ---
export const instructorAPI = {
  // Video Management
  uploadVideo: async (videoFile) => {
    const formData = new FormData()
    formData.append("video_file", videoFile)
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/videos/upload/`, {
      method: "POST",
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    })
  },

  uploadLessonVideo: async (videoFile, lessonData) => {
    const formData = new FormData()
    formData.append("video_file", videoFile)
    if (lessonData) {
      Object.keys(lessonData).forEach((key) => {
        formData.append(key, lessonData[key])
      })
    }
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/lessons/upload-video/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  // Course Management
  createCourse: async (courseData) => {
    const formData = new FormData()
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== null && courseData[key] !== undefined) {
        if (Array.isArray(courseData[key])) {
          formData.append(key, JSON.stringify(courseData[key]))
        } else {
          formData.append(key, courseData[key])
        }
      }
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  getCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getCourseDetails: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/`, { method: "GET" })
  },

  updateCourse: async (courseId, courseData) => {
    const formData = new FormData()
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== null && courseData[key] !== undefined) {
        if (Array.isArray(courseData[key])) {
          formData.append(key, JSON.stringify(courseData[key]))
        } else {
          formData.append(key, courseData[key])
        }
      }
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/update/`, {
      method: "PUT",
      headers: {},
      body: formData,
    })
  },

  deleteCourse: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/`, {
      method: "DELETE",
    })
  },

  bulkCourseActions: async (actionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/bulk-actions/`, {
      method: "POST",
      body: JSON.stringify(actionData),
    })
  },

  getCourseStructure: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/structure/`, { method: "GET" })
  },

  // Course Section Management
  getCourseSections: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/`, { method: "GET" })
  },

  createCourseSection: async (courseId, sectionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/`, {
      method: "POST",
      body: JSON.stringify(sectionData),
    })
  },

  getCourseSection: async (courseId, sectionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/`, { method: "GET" })
  },

  updateCourseSection: async (courseId, sectionId, sectionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/`, {
      method: "PUT",
      body: JSON.stringify(sectionData),
    })
  },

  deleteCourseSection: async (courseId, sectionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/`, {
      method: "DELETE",
    })
  },

  reorderSections: async (courseId, sectionOrders) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/reorder/`, {
      method: "POST",
      body: JSON.stringify({ section_orders: sectionOrders }),
    })
  },

  // Course Lesson Management
  getSectionLessons: async (courseId, sectionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/`, {
      method: "GET",
    })
  },

  createLesson: async (courseId, sectionId, lessonData) => {
    const formData = new FormData()
    Object.keys(lessonData).forEach((key) => {
      if (lessonData[key] !== null && lessonData[key] !== undefined) {
        formData.append(key, lessonData[key])
      }
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  getLesson: async (courseId, sectionId, lessonId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/`, {
      method: "GET",
    })
  },

  updateLesson: async (courseId, sectionId, lessonId, lessonData) => {
    const formData = new FormData()
    Object.keys(lessonData).forEach((key) => {
      if (lessonData[key] !== null && lessonData[key] !== undefined) {
        formData.append(key, lessonData[key])
      }
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/`, {
      method: "PUT",
      headers: {},
      body: formData,
    })
  },

  deleteLesson: async (courseId, sectionId, lessonId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/`, {
      method: "DELETE",
    })
  },

  bulkLessonActions: async (courseId, sectionId, actionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/bulk-actions/`, {
      method: "POST",
      body: JSON.stringify(actionData),
    })
  },

  getLessonProgressAnalytics: async (courseId, sectionId, lessonId) => {
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/analytics/`,
      { method: "GET" },
    )
  },

  // Course Categories
  getCategories: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/course-categories/`, { method: "GET" })
  },

  createCategory: async (categoryData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/course-categories/`, {
      method: "POST",
      body: JSON.stringify(categoryData),
    })
  },

  updateCategory: async (categoryId, categoryData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/course-categories/${categoryId}/`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    })
  },

  deleteCategory: async (categoryId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/course-categories/${categoryId}/`, {
      method: "DELETE",
    })
  },

  // Course Enrollment and Progress
  getCourseEnrollments: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/enrollments/${queryString ? `?${queryString}` : ""}`,
      {
        method: "GET",
      },
    )
  },

  getUserCourseProgress: async (userId, courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/users/${userId}/courses/${courseId}/progress/`, { method: "GET" })
  },

  manualEnrollment: async (enrollmentData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/enrollments/manual/`, {
      method: "POST",
      body: JSON.stringify(enrollmentData),
    })
  },

  // Course Analytics
  getCourseStatistics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/statistics/`, { method: "GET" })
  },

  getPaymentAnalytics: async (days = 30) => {
    const queryString = new URLSearchParams({ days }).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/payments/analytics/?${queryString}`, { method: "GET" })
  },

  getCourseRevenueReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/revenue-report/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Course Appeals
  getSuspendedCourses: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/suspended/`, { method: "GET" })
  },

  submitCourseAppeal: async (courseId, appealData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/appeal/`, {
      method: "POST",
      body: JSON.stringify(appealData),
    })
  },

  getMyAppeals: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/appeals/`, { method: "GET" })
  },

  // Exam Management
  getCourseExams: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/`, { method: "GET" })
  },

  createExam: async (courseId, examData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/`, {
      method: "POST",
      body: JSON.stringify(examData),
    })
  },

  getExamDetails: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/`, { method: "GET" })
  },

  updateExam: async (courseId, examId, examData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/`, {
      method: "PUT",
      body: JSON.stringify(examData),
    })
  },

  deleteExam: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/`, {
      method: "DELETE",
    })
  },

  getExamAttempts: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/attempts/`, { method: "GET" })
  },

  getExamStatistics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/exams/statistics/`, { method: "GET" })
  },

  getStudents: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/students/`, { method: "GET" })
  },

  getExamPerformanceTrends: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/performance-trends/`, {
      method: "GET",
    })
  },

  // Exam Question Management
  getExamQuestions: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/`, { method: "GET" })
  },

  createExamQuestion: async (courseId, examId, questionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/`, {
      method: "POST",
      body: JSON.stringify(questionData),
    })
  },

  getExamQuestion: async (courseId, examId, questionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/`, {
      method: "GET",
    })
  },

  updateExamQuestion: async (courseId, examId, questionId, questionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/`, {
      method: "PUT",
      body: JSON.stringify(questionData),
    })
  },

  deleteExamQuestion: async (courseId, examId, questionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/`, {
      method: "DELETE",
    })
  },

  getExamQuestionAnalytics: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/analytics/`, {
      method: "GET",
    })
  },

  getQuestionDetailAnalytics: async (courseId, examId, questionId) => {
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/analytics/`,
      { method: "GET" },
    )
  },

  // Enhanced Video Management
  getVideoAnalytics: async (videoId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/videos/${videoId}/analytics/`, { method: "GET" })
  },

  deleteVideo: async (videoId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/videos/${videoId}/`, { method: "DELETE" })
  },

  // Enhanced Course Analytics
  getCourseEnrollmentAnalytics: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/enrollment-analytics/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  getCourseCompletionAnalytics: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/completion-analytics/`, { method: "GET" })
  },

  getCourseRevenueAnalytics: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/revenue-analytics/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Enhanced Lesson Analytics
  getLessonEngagementAnalytics: async (courseId, sectionId, lessonId) => {
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/engagement/`,
      { method: "GET" }
    )
  },

  getLessonDropOffAnalytics: async (courseId, sectionId, lessonId) => {
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/dropoff/`,
      { method: "GET" }
    )
  },

  // Payment Management
  getPaymentHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/payments/history/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getPaymentDetails: async (paymentId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/payments/${paymentId}/`, { method: "GET" })
  },

  // User Management
  getCourseStudents: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/students/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  getStudentDetails: async (courseId, studentId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/students/${studentId}/`, { method: "GET" })
  },

  // Content Management
  uploadCourseThumbnail: async (courseId, thumbnailFile) => {
    const formData = new FormData()
    formData.append("thumbnail", thumbnailFile)
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/thumbnail/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  uploadLessonAttachment: async (courseId, sectionId, lessonId, attachmentFile) => {
    const formData = new FormData()
    formData.append("attachment", attachmentFile)
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/attachments/`,
      {
        method: "POST",
        headers: {},
        body: formData,
      }
    )
  },

  deleteLessonAttachment: async (courseId, sectionId, lessonId, attachmentId) => {
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/attachments/${attachmentId}/`,
      { method: "DELETE" }
    )
  },

  // Course Settings
  updateCourseSettings: async (courseId, settingsData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/settings/`, {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  },

  getCourseSettings: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/settings/`, { method: "GET" })
  },

  // Course Prerequisites
  addCoursePrerequisite: async (courseId, prerequisiteCourseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/prerequisites/`, {
      method: "POST",
      body: JSON.stringify({ prerequisite_course_id: prerequisiteCourseId }),
    })
  },

  removeCoursePrerequisite: async (courseId, prerequisiteCourseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/prerequisites/${prerequisiteCourseId}/`, {
      method: "DELETE",
    })
  },

  getCoursePrerequisites: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/prerequisites/`, { method: "GET" })
  },

  // Course Discounts
  applyCourseDiscount: async (courseId, discountData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/discounts/`, {
      method: "POST",
      body: JSON.stringify(discountData),
    })
  },

  updateCourseDiscount: async (courseId, discountId, discountData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/discounts/${discountId}/`, {
      method: "PUT",
      body: JSON.stringify(discountData),
    })
  },

  removeCourseDiscount: async (courseId, discountId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/discounts/${discountId}/`, {
      method: "DELETE",
    })
  },

  getCourseDiscounts: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/discounts/`, { method: "GET" })
  },

  // Course Certificates
  generateCourseCertificate: async (courseId, studentId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/certificates/${studentId}/`, {
      method: "POST",
    })
  },

  getCourseCertificates: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/certificates/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Course Announcements
  createCourseAnnouncement: async (courseId, announcementData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/announcements/`, {
      method: "POST",
      body: JSON.stringify(announcementData),
    })
  },

  getCourseAnnouncements: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/announcements/`, { method: "GET" })
  },

  updateCourseAnnouncement: async (courseId, announcementId, announcementData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/announcements/${announcementId}/`, {
      method: "PUT",
      body: JSON.stringify(announcementData),
    })
  },

  deleteCourseAnnouncement: async (courseId, announcementId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/announcements/${announcementId}/`, {
      method: "DELETE",
    })
  },

  // Course Feedback
  getCourseFeedback: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/feedback/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  respondToFeedback: async (courseId, feedbackId, responseData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/feedback/${feedbackId}/respond/`, {
      method: "POST",
      body: JSON.stringify(responseData),
    })
  },

  // Course Reports
  generateCourseReport: async (courseId, reportType, params = {}) => {
    const queryString = new URLSearchParams({ report_type: reportType, ...params }).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/reports/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  exportCourseData: async (courseId, exportType, params = {}) => {
    const queryString = new URLSearchParams({ export_type: exportType, ...params }).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/export/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Instructor Dashboard
  getInstructorDashboard: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/dashboard/`, { method: "GET" })
  },

  getInstructorStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/stats/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Course Templates
  createCourseTemplate: async (templateData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/course-templates/`, {
      method: "POST",
      body: JSON.stringify(templateData),
    })
  },

  getCourseTemplates: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/course-templates/`, { method: "GET" })
  },

  useCourseTemplate: async (templateId, courseData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/course-templates/${templateId}/use/`, {
      method: "POST",
      body: JSON.stringify(courseData),
    })
  },

  // Course Import/Export
  exportCourse: async (courseId, format = 'json') => {
    const queryString = new URLSearchParams({ format }).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/export/${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    })
  },

  importCourse: async (importData) => {
    const formData = new FormData()
    Object.keys(importData).forEach((key) => {
      formData.append(key, importData[key])
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/import/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  // Course Collaboration
  inviteCoInstructor: async (courseId, inviteData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/co-instructors/`, {
      method: "POST",
      body: JSON.stringify(inviteData),
    })
  },

  getCoInstructors: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/co-instructors/`, { method: "GET" })
  },

  removeCoInstructor: async (courseId, instructorId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/co-instructors/${instructorId}/`, {
      method: "DELETE",
    })
  },

  // Course Scheduling
  scheduleCourse: async (courseId, scheduleData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/schedule/`, {
      method: "POST",
      body: JSON.stringify(scheduleData),
    })
  },

  getCourseSchedule: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/schedule/`, { method: "GET" })
  },

  updateCourseSchedule: async (courseId, scheduleId, scheduleData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/schedule/${scheduleId}/`, {
      method: "PUT",
      body: JSON.stringify(scheduleData),
    })
  },

  deleteCourseSchedule: async (courseId, scheduleId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/schedule/${scheduleId}/`, {
      method: "DELETE",
    })
  },

  // Course Notifications
  sendCourseNotification: async (courseId, notificationData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/notifications/`, {
      method: "POST",
      body: JSON.stringify(notificationData),
    })
  },

  getCourseNotifications: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/notifications/`, { method: "GET" })
  },

  // Course Resources
  uploadCourseResource: async (courseId, resourceFile, resourceData = {}) => {
    const formData = new FormData()
    formData.append("resource_file", resourceFile)
    Object.keys(resourceData).forEach((key) => {
      formData.append(key, resourceData[key])
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/resources/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  getCourseResources: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/resources/`, { method: "GET" })
  },

  deleteCourseResource: async (courseId, resourceId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/resources/${resourceId}/`, {
      method: "DELETE",
    })
  },

  // Course Comments/Reviews Management
  moderateCourseReview: async (courseId, reviewId, action, reason = "") => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/reviews/${reviewId}/moderate/`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    })
  },

  getCourseReviews: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/reviews/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  respondToReview: async (courseId, reviewId, responseData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/reviews/${reviewId}/respond/`, {
      method: "POST",
      body: JSON.stringify(responseData),
    })
  },

  // Course Analytics - Advanced
  getCourseEngagementMetrics: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/engagement-metrics/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  getCourseRetentionAnalytics: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/retention-analytics/`, { method: "GET" })
  },

  getCoursePerformanceTrends: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/performance-trends/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Student Progress Tracking
  getStudentProgressReport: async (courseId, studentId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/students/${studentId}/progress-report/`, {
      method: "GET",
    })
  },

  getBulkStudentProgress: async (courseId, studentIds) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/bulk-progress/`, {
      method: "POST",
      body: JSON.stringify({ student_ids: studentIds }),
    })
  },

  // Course Quality Metrics
  getCourseQualityScore: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/quality-score/`, { method: "GET" })
  },

  getCourseImprovementSuggestions: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/improvement-suggestions/`, { method: "GET" })
  },

  // Course Backup and Restore
  createCourseBackup: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/backup/`, { method: "POST" })
  },

  getCourseBackups: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/backups/`, { method: "GET" })
  },

  restoreCourseBackup: async (courseId, backupId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/backups/${backupId}/restore/`, {
      method: "POST",
    })
  },

  // Course Versioning
  createCourseVersion: async (courseId, versionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/versions/`, {
      method: "POST",
      body: JSON.stringify(versionData),
    })
  },

  getCourseVersions: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/versions/`, { method: "GET" })
  },

  switchCourseVersion: async (courseId, versionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/versions/${versionId}/switch/`, {
      method: "POST",
    })
  },

  // Course Publishing Workflow
  submitCourseForReview: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/submit-for-review/`, { method: "POST" })
  },

  getCourseReviewStatus: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/review-status/`, { method: "GET" })
  },

  // Course SEO and Marketing
  updateCourseSEO: async (courseId, seoData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/seo/`, {
      method: "PUT",
      body: JSON.stringify(seoData),
    })
  },

  getCourseSEO: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/seo/`, { method: "GET" })
  },

  // Course Affiliate Management
  createAffiliateLink: async (courseId, affiliateData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/affiliate-links/`, {
      method: "POST",
      body: JSON.stringify(affiliateData),
    })
  },

  getAffiliateLinks: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/affiliate-links/`, { method: "GET" })
  },

  getAffiliateAnalytics: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/affiliate-analytics/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Enhanced Exam Management
  getCourseExamsList: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  createCourseExam: async (courseId, examData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/`, {
      method: "POST",
      body: JSON.stringify(examData),
    })
  },

  getExamDetails: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/`, { method: "GET" })
  },

  updateExam: async (courseId, examId, examData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/`, {
      method: "PUT",
      body: JSON.stringify(examData),
    })
  },

  deleteExam: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/delete/`, {
      method: "DELETE",
    })
  },

  // Exam Question Management
  getExamQuestions: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/`, { method: "GET" })
  },

  createExamQuestion: async (courseId, examId, questionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/`, {
      method: "POST",
      body: JSON.stringify(questionData),
    })
  },

  getExamQuestion: async (courseId, examId, questionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/`, {
      method: "GET",
    })
  },

  updateExamQuestion: async (courseId, examId, questionId, questionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/`, {
      method: "PUT",
      body: JSON.stringify(questionData),
    })
  },

  deleteExamQuestion: async (courseId, examId, questionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/`, {
      method: "DELETE",
    })
  },

  // Exam Analytics & Reporting
  getExamAttempts: async (courseId, examId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/attempts/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  getExamQuestionAnalytics: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/analytics/`, {
      method: "GET",
    })
  },

  getQuestionDetailAnalytics: async (courseId, examId, questionId) => {
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/questions/${questionId}/analytics/`,
      { method: "GET" }
    )
  },

  getExamPerformanceTrends: async (courseId, examId, days = 30) => {
    const queryString = new URLSearchParams({ days }).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/performance-trends/?${queryString}`,
      { method: "GET" }
    )
  },

  getExamStatistics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/exams/statistics/`, { method: "GET" })
  },

  // Course Structure Management
  getCourseStructure: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/structure/`, { method: "GET" })
  },

  // Course Pricing Management
  updateCoursePricing: async (courseId, pricingData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/pricing/`, {
      method: "POST",
      body: JSON.stringify(pricingData),
    })
  },

  // Course Appeals & Moderation
  getSuspendedCourses: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/suspended/`, { method: "GET" })
  },

  submitCourseAppeal: async (courseId, appealData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/appeal/`, {
      method: "POST",
      body: JSON.stringify(appealData),
    })
  },

  getMyAppeals: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/appeals/`, { method: "GET" })
  },

  // Specialized Video Endpoints
  uploadLessonVideo: async (videoFile, lessonData = {}) => {
    const formData = new FormData()
    formData.append("video_file", videoFile)
    Object.keys(lessonData).forEach((key) => {
      formData.append(key, lessonData[key])
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/lessons/upload-video/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  // Enhanced Exam Management with Bulk Operations
  bulkExamActions: async (courseId, actionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/bulk-actions/`, {
      method: "POST",
      body: JSON.stringify(actionData),
    })
  },

  // Exam Settings Management
  updateExamSettings: async (courseId, examId, settingsData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/settings/`, {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  },

  getExamSettings: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/settings/`, { method: "GET" })
  },

  // Exam Publishing Workflow
  publishExam: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/publish/`, { method: "POST" })
  },

  unpublishExam: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/unpublish/`, { method: "POST" })
  },

  // Exam Question Bank Management
  createQuestionBank: async (courseId, bankData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/question-banks/`, {
      method: "POST",
      body: JSON.stringify(bankData),
    })
  },

  getQuestionBanks: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/question-banks/`, { method: "GET" })
  },

  addQuestionsToBank: async (courseId, bankId, questionIds) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/question-banks/${bankId}/questions/`, {
      method: "POST",
      body: JSON.stringify({ question_ids: questionIds }),
    })
  },

  // Exam Import/Export
  exportExam: async (courseId, examId, format = 'json') => {
    const queryString = new URLSearchParams({ format }).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/export/?${queryString}`,
      { method: "GET" }
    )
  },

  importExam: async (courseId, importData) => {
    const formData = new FormData()
    Object.keys(importData).forEach((key) => {
      formData.append(key, importData[key])
    })
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/import/`, {
      method: "POST",
      headers: {},
      body: formData,
    })
  },

  // Exam Templates
  createExamTemplate: async (templateData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/exam-templates/`, {
      method: "POST",
      body: JSON.stringify(templateData),
    })
  },

  getExamTemplates: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/exam-templates/`, { method: "GET" })
  },

  useExamTemplate: async (templateId, courseId, examData = {}) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/exam-templates/${templateId}/use/`, {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, ...examData }),
    })
  },

  // Exam Scheduling
  scheduleExam: async (courseId, examId, scheduleData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/schedule/`, {
      method: "POST",
      body: JSON.stringify(scheduleData),
    })
  },

  getExamSchedule: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/schedule/`, { method: "GET" })
  },

  updateExamSchedule: async (courseId, examId, scheduleId, scheduleData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/schedule/${scheduleId}/`, {
      method: "PUT",
      body: JSON.stringify(scheduleData),
    })
  },

  deleteExamSchedule: async (courseId, examId, scheduleId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/schedule/${scheduleId}/`, {
      method: "DELETE",
    })
  },

  // Exam Notifications
  sendExamNotification: async (courseId, examId, notificationData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/notifications/`, {
      method: "POST",
      body: JSON.stringify(notificationData),
    })
  },

  getExamNotifications: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/notifications/`, { method: "GET" })
  },

  // Exam Results Management
  getExamResults: async (courseId, examId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/results/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  exportExamResults: async (courseId, examId, format = 'csv') => {
    const queryString = new URLSearchParams({ format }).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/results/export/?${queryString}`,
      { method: "GET" }
    )
  },

  // Exam Certificates
  generateExamCertificate: async (courseId, examId, studentId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/certificates/${studentId}/`, {
      method: "POST",
    })
  },

  getExamCertificates: async (courseId, examId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/certificates/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Exam Proctoring
  enableExamProctoring: async (courseId, examId, proctoringData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/proctoring/`, {
      method: "POST",
      body: JSON.stringify(proctoringData),
    })
  },

  getExamProctoringSettings: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/proctoring/`, { method: "GET" })
  },

  // Exam Time Tracking
  getExamTimeAnalytics: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/time-analytics/`, { method: "GET" })
  },

  // Exam Difficulty Analysis
  getExamDifficultyAnalysis: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/difficulty-analysis/`, { method: "GET" })
  },

  // Exam Question Pool Management
  createQuestionPool: async (courseId, examId, poolData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/question-pools/`, {
      method: "POST",
      body: JSON.stringify(poolData),
    })
  },

  getQuestionPools: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/question-pools/`, { method: "GET" })
  },

  // Exam Backup and Restore
  createExamBackup: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/backup/`, { method: "POST" })
  },

  getExamBackups: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/backups/`, { method: "GET" })
  },

  restoreExamBackup: async (courseId, examId, backupId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/backups/${backupId}/restore/`, {
      method: "POST",
    })
  },

  // Exam Versioning
  createExamVersion: async (courseId, examId, versionData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/versions/`, {
      method: "POST",
      body: JSON.stringify(versionData),
    })
  },

  getExamVersions: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/versions/`, { method: "GET" })
  },

  switchExamVersion: async (courseId, examId, versionId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/versions/${versionId}/switch/`, {
      method: "POST",
    })
  },

  // Exam Review and Feedback
  getExamReviewRequests: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/review-requests/`, { method: "GET" })
  },

  respondToExamReview: async (courseId, examId, reviewId, responseData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/review-requests/${reviewId}/respond/`, {
      method: "POST",
      body: JSON.stringify(responseData),
    })
  },

  // Exam Statistics Dashboard
  getExamDashboard: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/dashboard/`, { method: "GET" })
  },

  // Exam Comparison Analytics
  compareExams: async (courseId, examIds) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/compare/`, {
      method: "POST",
      body: JSON.stringify({ exam_ids: examIds }),
    })
  },

  // Exam Question Randomization
  randomizeExamQuestions: async (courseId, examId, randomizationData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/randomize/`, {
      method: "POST",
      body: JSON.stringify(randomizationData),
    })
  },

  // Exam Accessibility Features
  updateExamAccessibility: async (courseId, examId, accessibilityData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/accessibility/`, {
      method: "PUT",
      body: JSON.stringify(accessibilityData),
    })
  },

  getExamAccessibilitySettings: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/accessibility/`, { method: "GET" })
  },

  // Exam Integration Features
  integrateWithLMS: async (courseId, examId, lmsData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/lms-integration/`, {
      method: "POST",
      body: JSON.stringify(lmsData),
    })
  },

  getLMSIntegrationStatus: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/lms-integration/`, { method: "GET" })
  },

  // Exam Webhook Management
  createExamWebhook: async (courseId, examId, webhookData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/webhooks/`, {
      method: "POST",
      body: JSON.stringify(webhookData),
    })
  },

  getExamWebhooks: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/webhooks/`, { method: "GET" })
  },

  deleteExamWebhook: async (courseId, examId, webhookId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/webhooks/${webhookId}/`, {
      method: "DELETE",
    })
  },

  // Exam Audit Log
  getExamAuditLog: async (courseId, examId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(
      `${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/audit-log/${queryString ? `?${queryString}` : ""}`,
      { method: "GET" }
    )
  },

  // Exam Compliance
  getExamComplianceReport: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/compliance/`, { method: "GET" })
  },

  // Exam Security
  getExamSecurityReport: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/security/`, { method: "GET" })
  },

  // Exam Performance Optimization
  optimizeExamPerformance: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/optimize/`, { method: "POST" })
  },

  getExamPerformanceMetrics: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/performance-metrics/`, { method: "GET" })
  },

  // Instructor Dashboard & Analytics
  getInstructorDashboard: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/dashboard`, { method: "GET" })
  },

  getCourseStatistics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/statistics`, { method: "GET" })
  },

  getPaymentAnalytics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/payments/analytics`, { method: "GET" })
  },

  getExamStatistics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/exams/statistics`, { method: "GET" })
  },

  getStudentAnalytics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/students/analytics`, { method: "GET" })
  },

  getRevenueOverview: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/revenue/overview/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getMonthlyEarnings: async (year, month) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/earnings/monthly/${year}/${month}`, { method: "GET" })
  },

  getPayoutHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/payouts/history/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Course Performance Analytics
  getCoursePerformance: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/performance/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getLessonAnalytics: async (courseId, lessonId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/analytics`, { method: "GET" })
  },

  getStudentProgress: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/students/progress/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Student Management
  getEnrolledStudents: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/students/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getStudentDetails: async (courseId, studentId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/students/${studentId}`, { method: "GET" })
  },

  sendStudentMessage: async (courseId, studentId, messageData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/students/${studentId}/message`, {
      method: "POST",
      body: JSON.stringify(messageData),
    })
  },

  // Course Reviews & Feedback
  getCourseReviews: async (courseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/reviews/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  respondToReview: async (courseId, reviewId, responseData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/reviews/${reviewId}/respond`, {
      method: "POST",
      body: JSON.stringify(responseData),
    })
  },

  // Exam Management
  getExamResults: async (courseId, examId, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/results/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getExamAnalytics: async (courseId, examId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/exams/${examId}/analytics`, { method: "GET" })
  },

  // Course Marketing & SEO
  updateCourseSEO: async (courseId, seoData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/seo`, {
      method: "PUT",
      body: JSON.stringify(seoData),
    })
  },

  getCourseMarketingData: async (courseId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/${courseId}/marketing`, { method: "GET" })
  },

  // Notifications & Communication
  getNotifications: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/notifications/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  markNotificationRead: async (notificationId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/notifications/${notificationId}/read`, {
      method: "POST",
    })
  },

  // Settings & Preferences
  getInstructorSettings: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/settings`, { method: "GET" })
  },

  updateInstructorSettings: async (settingsData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/settings`, {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  },

  // Bank Account Management
  getBankAccounts: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/bank-accounts`, { method: "GET" })
  },

  addBankAccount: async (bankData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/bank-accounts`, {
      method: "POST",
      body: JSON.stringify(bankData),
    })
  },

  updateBankAccount: async (accountId, bankData) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/bank-accounts/${accountId}`, {
      method: "PUT",
      body: JSON.stringify(bankData),
    })
  },

  deleteBankAccount: async (accountId) => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/bank-accounts/${accountId}`, {
      method: "DELETE",
    })
  },
}

// --- NIGERIAN BANK API ENDPOINTS ---
export const nigerianBankAPI = {
  // Get Nigerian banks
  getBanks: async () => {
    return apiRequest(`/api/payments/banks/`, { method: "GET" })
  },
  
  // Verify bank account
  verifyBankAccount: async (accountNumber, bankCode) => {
    return apiRequest(`/api/payments/verify-account/`, {
      method: "POST",
      body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
    })
  },
  
  // Get payment channels
  getPaymentChannels: async () => {
    return apiRequest(`/api/payments/channels/`, { method: "GET" })
  },
  
  // Get USSD codes
  getUssdCodes: async () => {
    return apiRequest(`/api/payments/ussd-codes/`, { method: "GET" })
  },
  
  // Get mobile money providers
  getMobileMoneyProviders: async () => {
    return apiRequest(`/api/payments/mobile-money/`, { method: "GET" })
  },
  
  // Get transfer instructions
  getTransferInstructions: async (bankCode, amount) => {
    return apiRequest(`/api/payments/transfer-instructions/`, {
      method: "POST",
      body: JSON.stringify({ bank_code: bankCode, amount }),
    })
  },
}

// --- VIDEO STREAMING API ENDPOINTS ---
export const videoAPI = {
  // Get video stream URL
  getVideoStream: (videoId, quality = '720p') => {
    return `${VIDEO_STREAMING_URL}/${videoId}/${videoId}.m3u8`
  },
  
  // Get video manifest URL (DASH)
  getVideoManifest: (videoId) => {
    return `${VIDEO_STREAMING_URL}/${videoId}/${videoId}.mpd`
  },
  
  // Get video thumbnail
  getVideoThumbnail: (videoId) => {
    return `${VIDEO_STREAMING_URL}/${videoId}/${videoId}_thumb.jpg`
  },
  
  // Get video segments
  getVideoSegments: (videoId, segmentNumber) => {
    return `${VIDEO_STREAMING_URL}/${videoId}/${videoId}_${segmentNumber.toString().padStart(3, '0')}.ts`
  },
}

// --- PAYMENT GATEWAY CONFIGURATION ---
export const paymentConfig = {
  paystack: {
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
    country: 'NG',
  },
  flutterwave: {
    publicKey: FLUTTERWAVE_PUBLIC_KEY,
    currency: 'NGN',
    country: 'NG',
  },
}

export default {
  // Authentication APIs
  login,
  register,
  logout,
  logoutAllDevices,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getUserProfile,
  updateUserProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getUserSessions,
  deleteUserSession,
  requestAccountDeletion,
  cancelAccountDeletion,
  deleteAccountImmediate,
  // 2FA APIs
  get2FAStatus,
  enable2FA,
  confirm2FA,
  disable2FA,
  generateBackupCodes,
  regenerateBackupCodes,
  emergency2FADisable,
  // Student APIs
  listAllCourses,
  getCourseDetailsPublic,
  getFeaturedCourses,
  getCourseCategoriesPublic,
  searchCoursesPublic,
  enrollInCourse,
  verifyPayment,
  checkPaymentStatus,
  getCourseContentStructure,
  getLessonDetails,
  updateLessonProgress,
  manageLessonBookmarks,
  manageLessonNotes,
  getMyCourses,
  getCourseProgress,
  updateCourseProgress,
  getMyOverallProgress,
  getCourseReviews,
  addCourseReview,
  getCourseExams,
  startExam,
  getExamQuestions,
  submitExamAnswer,
  completeExam,
  getExamResults,
  getCourseRecommendations,
  getUserDashboard,
  // Instructor APIs
  instructorAPI,
  // Payment APIs
  paymentAPI,
  // Chat/Messaging APIs
  chatAPI,
  // Nigerian Bank APIs
  nigerianBankAPI,
  // Video Streaming APIs
  videoAPI,
  // Payment Configuration
  paymentConfig,
}
