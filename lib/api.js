"use client"

// IMPORTANT: Ensure this URL points to your running backend API.
// If your backend is deployed, update NEXT_PUBLIC_API_BASE_URL in your Vercel project settings
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const SUPERADMIN_API_BASE_URL = `${API_BASE_URL}/api/super-admin`
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
  if (contentType && contentType.includes("application/json")) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  if (!response.ok) {
    let errorMessage = "An unexpected error occurred."
    let isRateLimited = false
    let isLocked = false
    let requires2FA = false

    if (response.status === 429) {
      isRateLimited = true
      errorMessage = data.detail || "Too many requests. Please try again later."
    } else if (response.status === 403 && data.detail === "Account locked due to too many failed login attempts.") {
      isLocked = true
      errorMessage = data.detail
    } else if (response.status === 400 && data.detail === "Two-factor authentication required.") {
      requires2FA = true
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
      },
      requires2FA,
    }
  }
  
  // Store tokens if they exist in the response (for login)
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token)
  }
  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token)
  }
  
  return { success: true, data }
}

// Generic API request function with token handling
export async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("access_token")
  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  // If body is JSON, set Content-Type
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

   try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    return handleResponse(response)
  } catch (error) {
    console.error("Network or unexpected error:", error)
    return { success: false, error: { message: "Network error or unexpected issue." } }
  }
}

// --- AUTHENTICATION ENDPOINTS ---
export async function login({ email, password, twoFactorToken = "", backupCode = "" }) {
  return apiRequest(`/api/auth/login/`, {
    method: "POST",
    body: JSON.stringify({ email, password, two_factor_token: twoFactorToken, backup_code: backupCode }),
  })
}

export async function register({ fullName, email, phoneNumber, role, password, confirmPassword }) {
  return apiRequest(`/api/auth/register/`, {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      phone_number: phoneNumber,
      role,
      password,
      confirm_password: confirmPassword,
    }),
  })
}

export async function logout() {
  const result = await apiRequest(`/api/auth/logout/`, { method: "POST" })
  if (result.success) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  } else {
    console.error("Logout failed on server, but clearing local tokens.", result.error)
  }
  return result
}

export async function getUserProfile() {
  return apiRequest(`/api/auth/users/me/`, { method: "GET" })
}

export async function updateProfile(profileData) {
  return apiRequest(`/api/auth/users/me/update/`, {
    method: "PATCH",
    body: JSON.stringify(profileData),
  })
}

export async function forgotPassword(email) {
  return apiRequest(`/api/auth/forgot-password/`, {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(uid, token, newPassword, confirmPassword) {
  return apiRequest(`/api/auth/reset-password/confirm/`, {
    method: "POST",
    body: JSON.stringify({ uid, token, new_password: newPassword, password_confirm: confirmPassword }),
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
  initializePayment: async (courseId, gateway = 'paystack', paymentType = 'course_enrollment', userData = null) => {
    const payload = { 
      gateway,
      payment_type: paymentType
    }
    
    if (paymentType === 'course_enrollment') {
      payload.course_id = courseId
    } else if (paymentType === 'student_registration' && userData) {
      payload.email = userData.email
      payload.full_name = userData.full_name
      payload.phone_number = userData.phone_number
    }
    
    return apiRequest(`/api/payments/initialize/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  // Verify payment status
  verifyPayment: async (paymentId) => {
    return apiRequest(`/api/payments/verify/${paymentId}/`, {
      method: "POST",
    })
  },

  // Get payment history
  getPaymentHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/api/payments/transactions/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    return apiRequest(`/api/payments/transactions/${paymentId}/`, { method: "GET" })
  },

  // Cancel payment
  cancelPayment: async (paymentId) => {
    return apiRequest(`/api/payments/cancel/${paymentId}/`, {
      method: "POST",
    })
  },

  // Get available payment gateways
  getPaymentGateways: async () => {
    return apiRequest(`/api/payments/gateways/`, { method: "GET" })
  },

  // Instructor payment history
  getInstructorPaymentHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`/api/payments/instructor/history/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Admin payment overview
  getAdminPaymentOverview: async () => {
    return apiRequest(`/api/payments/admin/overview/`, { method: "GET" })
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

  getPaymentAnalytics: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/payments/analytics/`, { method: "GET" })
  },

  getCourseRevenueReport: async () => {
    return apiRequest(`${INSTRUCTOR_API_BASE_URL}/courses/revenue-report/`, { method: "GET" })
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
}

// --- SUPERADMIN API ENDPOINTS ---
export const superadminAPI = {
  // Platform Overview
  getPlatformOverview: async () => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/overview/`, { method: "GET" })
  },

  // Instructor Management
  getAllInstructors: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/instructors/${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    })
  },

  manageInstructorStatus: async (instructorId, action, reason, restoreCourses = true) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/instructors/${instructorId}/manage/`, {
      method: "POST",
      body: JSON.stringify({ action, reason, restore_courses: restoreCourses }),
    })
  },

  previewCourseImpact: async (instructorId, action) => {
    const queryString = new URLSearchParams({ action }).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/instructors/${instructorId}/course-impact/?${queryString}`, {
      method: "GET",
    })
  },

  bulkInstructorActions: async (action, instructorIds, reason, restoreCourses = true) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/instructors/bulk-actions/`, {
      method: "POST",
      body: JSON.stringify({ action, instructor_ids: instructorIds, reason, restore_courses: restoreCourses }),
    })
  },

  // Course Management
  getPendingCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/pending/${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    })
  },

  getAllCourses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  getCompleteCourseDetails: async (courseId) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/${courseId}/complete/`, { method: "GET" })
  },

  getCourseDetailForReview: async (courseId) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/${courseId}/`, { method: "GET" })
  },

  moderateCourse: async (courseId, action, reason) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/${courseId}/moderate/`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    })
  },

  bulkCourseActions: async (action, courseIds, reason) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/bulk-actions/`, {
      method: "POST",
      body: JSON.stringify({ action, course_ids: courseIds, reason }),
    })
  },

  getCourseModerationStats: async () => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/moderation-stats/`, { method: "GET" })
  },

  // Review Management
  getPendingReviews: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/reviews/pending/${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    })
  },

  moderateReview: async (reviewId, action, adminNotes) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/reviews/${reviewId}/approve/`, {
      method: "POST",
      body: JSON.stringify({ action, admin_notes: adminNotes }),
    })
  },

  getAllReviews: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/reviews/${queryString ? `?${queryString}` : ""}`, { method: "GET" })
  },

  // Appeal Management
  getPendingAppeals: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/appeals/pending/${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    })
  },

  reviewCourseAppeal: async (appealId, decision, reviewNotes) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/appeals/${appealId}/review/`, {
      method: "POST",
      body: JSON.stringify({ decision, review_notes: reviewNotes }),
    })
  },

  bulkCourseStatusUpdate: async (action, itemIds, reason) => {
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/courses/bulk-status-update/`, {
      method: "POST",
      body: JSON.stringify({ action, item_ids: itemIds, reason }),
    })
  },

  // Analytics
  getRevenueAnalytics: async (days = 30) => {
    const queryString = new URLSearchParams({ days }).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/revenue-analytics/?${queryString}`, { method: "GET" })
  },

  // Hypothetical Superadmin Payment Endpoints (not explicitly in provided Superadmin API doc)
  getPendingPayments: async (params = {}) => {
    // This endpoint is hypothetical based on the request.
    // In a real scenario, you'd confirm the actual API endpoint with the backend team.
    const queryString = new URLSearchParams(params).toString()
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/payments/pending/${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    })
  },

  approvePayment: async (paymentId) => {
    // This endpoint is hypothetical.
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/payments/${paymentId}/approve/`, { method: "POST" })
  },

  rejectPayment: async (paymentId) => {
    // This endpoint is hypothetical.
    return apiRequest(`${SUPERADMIN_API_BASE_URL}/payments/${paymentId}/reject/`, { method: "POST" })
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
  login,
  register,
  logout,
  getUserProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
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
  // Superadmin APIs
  superadminAPI,
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
