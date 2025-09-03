"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, Users, BookOpen, Settings, LogOut, Edit, Trash2, X, Loader2, Plus, Eye, BarChart3, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, FileText, Video, MessageSquare, Award, RefreshCw, Lock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { 
  apiRequest, 
  logout, 
  instructorAPI 
} from "@/lib/api"


export default function AdminDashboardClientPage() {
  const { user, loading: loadingAuth } = useAuth()
  const router = useRouter()
  const [isInstructor, setIsInstructor] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Course management state
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDescription, setCourseDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  // Data state
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [loadingData, setLoadingData] = useState(true)

  // Loading states
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [isDeletingCourse, setIsDeletingCourse] = useState(false)
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false)

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (loadingAuth) return

      if (user && (user.role === "instructor" || user.role === "admin")) {
        setIsInstructor(true)
        setLoadingData(true)
        try {
          // Fetch instructor dashboard data using comprehensive API endpoints
          const [
            dashboardResponse,
            coursesResponse, 
            analyticsResponse,
            paymentAnalyticsResponse,
            examStatsResponse,
            studentsResponse
          ] = await Promise.all([
            instructorAPI.getInstructorDashboard(),
            instructorAPI.getCourses(),
            instructorAPI.getCourseStatistics(),
            instructorAPI.getPaymentAnalytics(),
            instructorAPI.getExamStatistics(),
            instructorAPI.getStudents()
          ])

          // Handle each response safely
          if (dashboardResponse && dashboardResponse.success) {
            console.log("Dashboard data loaded successfully")
          } else {
            console.warn("Dashboard response issue:", dashboardResponse?.error || "No response")
          }

          if (coursesResponse.success) {
            console.log("Courses fetched successfully:", coursesResponse.data)
            setCourses(coursesResponse.data || [])
          } else {
            console.warn("Failed to fetch courses:", coursesResponse.error)
            console.log("Full courses response:", coursesResponse)
          }

          if (studentsResponse.success) {
            setStudents(studentsResponse.data || [])
          } else {
            console.warn("Failed to fetch students:", studentsResponse.error)
          }

          if (analyticsResponse.success) {
            setAnalytics(analyticsResponse.data || {})
          } else {
            console.warn("Failed to fetch analytics:", analyticsResponse.error)
          }

        } catch (error) {
          console.error("Failed to fetch instructor data:", error)
          toast({
            title: "Error",
            description: `Failed to load instructor data: ${error.message}`,
            variant: "destructive",
          })
        } finally {
          setLoadingData(false)
        }
      } else if (user && user.role !== "instructor" && user.role !== "admin") {
        setIsInstructor(false)
        toast({
          title: "Access Denied",
          description: "You are not authorized to view this page.",
          variant: "destructive",
        })
      } else if (!user && !loadingAuth) {
        setIsInstructor(false)
        toast({
          title: "Access Denied",
          description: "Please log in to view this page.",
          variant: "destructive",
        })
      }
    }

    fetchInstructorData()
  }, [user, loadingAuth])

  // Refresh courses when component mounts or user changes
  useEffect(() => {
    if (isInstructor && !loadingData) {
      refreshCourses()
    }
  }, [isInstructor, loadingData])

  const resetForm = () => {
    setCourseTitle("")
    setCourseDescription("")
    setVideoUrl("")
    setEditingCourseId(null)
    setSelectedFile(null)
  }

  const refreshCourses = async () => {
    try {
      console.log("Refreshing courses...")
      const response = await instructorAPI.getCourses()
      if (response.success) {
        console.log("Courses refreshed:", response.data)
        setCourses(response.data || [])
      } else {
        console.warn("Failed to refresh courses:", response.error)
      }
    } catch (error) {
      console.error("Error refreshing courses:", error)
    }
  }

  const handleCourseFormSubmit = async (e) => {
    e.preventDefault()

    if (!courseTitle || !courseDescription || (!videoUrl && !selectedFile)) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    if (editingCourseId) {
      setIsUpdatingCourse(true)
      try {
        const response = await apiRequest(`/api/admin/courses/${editingCourseId}/update/`, {
          method: "PUT",
          body: JSON.stringify({ title: courseTitle, description: courseDescription, video_url: videoUrl }),
        })
        
        if (!response.success) {
          throw new Error(response.error.message || "Failed to update course.")
        }

        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course.id === editingCourseId
              ? { ...course, title: response.data.title, description: response.data.description, video_url: response.data.video_url }
              : course,
          ),
        )
        toast({ title: "Course Updated", description: "Course updated successfully!" })
      } catch (error) {
        console.error("Update course API call failed:", error)
        toast({ title: "Error", description: `Failed to update course: ${error.message}`, variant: "destructive" })
      } finally {
        setIsUpdatingCourse(false)
        resetForm()
      }
    } else {
      setIsAddingCourse(true)
      try {
        const formData = new FormData()
        formData.append("title", courseTitle)
        formData.append("description", courseDescription)
        
        // Set video source and file/URL
        if (selectedFile) {
          formData.append("video_source", "upload")
          formData.append("video_file", selectedFile)
        } else if (videoUrl) {
          formData.append("video_source", "url")
          formData.append("video_url", videoUrl)
        }
        
        // Set required default values
        formData.append("course_type", "free")
        formData.append("price", "0.00")
        formData.append("currency", "NGN")
        formData.append("duration_minutes", "60")
        formData.append("difficulty_level", "beginner")
        formData.append("is_active", "false")
        formData.append("is_featured", "false")
        formData.append("category", "all")  // Default category
        
        // Add missing fields that serializer expects
        formData.append("has_discount", "false")
        formData.append("discount_percentage", "0")
        formData.append("estimated_duration_hours", "1.0")
        formData.append("requirements", "[]")  // Empty array
        formData.append("what_you_will_learn", "[]")  // Empty array

        const response = await apiRequest("/api/admin/courses/create/", {
          method: "POST",
          body: formData,
        })
        
        if (!response.success) {
          throw new Error(response.error.message || "Failed to add course.")
        }

        // Refresh courses to get updated data
        await refreshCourses()
        toast({ title: "Course Uploaded", description: "Course added successfully!" })
      } catch (error) {
        console.error("Add course API call failed:", error)
        toast({ title: "Error", description: `Failed to add course: ${error.message}`, variant: "destructive" })
      } finally {
        setIsAddingCourse(false)
        resetForm()
      }
    }
  }

  const handleDeleteCourseClick = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setIsDeletingCourse(true)
      try {
        const response = await apiRequest(`/api/admin/courses/${courseId}/delete/`, {
          method: "DELETE",
        })

        if (response.success) {
          // Refresh courses to get updated data
          await refreshCourses()
          toast({ title: "Course Deleted", description: "Course deleted successfully!" })
        } else {
          throw new Error(response.error.message || "Failed to delete course.")
        }
      } catch (error) {
        console.error("Delete course API call failed:", error)
        toast({ title: "Error", description: `Failed to delete course: ${error.message}`, variant: "destructive" })
      } finally {
        setIsDeletingCourse(false)
      }
    }
  }

  const handleEditCourseClick = (course) => {
    setEditingCourseId(course.id)
    setCourseTitle(course.title)
    setCourseDescription(course.description)
    setVideoUrl(course.video_url)
    setSelectedFile(null)
  }

  const handleLogout = async () => {
    try {
      console.log("Logout button clicked")
      await logout()
      console.log("Logout successful, redirecting...")
      // Use router for navigation
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Even if logout fails, clear tokens and redirect
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user_data")
      router.push("/")
    }
  }

  if (loadingAuth || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading instructor dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isInstructor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p className="text-lg text-red-600">Access Denied: You are not authorized to view this page.</p>
        </div>
      </div>
    )
  }

  const totalStudents = students.length
  const totalCourses = courses.length
  const activeCourses = courses.filter(c => c.is_active).length
  const pendingCourses = courses.filter(c => !c.is_active).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-6 px-6 border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Instructor Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your courses and track student progress</p>
          </div>
        <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-indigo-600"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-5 w-5 mr-2" /> Settings
            </Button>
            <Button onClick={handleLogout} className="bg-indigo-600 text-white hover:bg-indigo-700">
            <LogOut className="h-5 w-5 mr-2" /> Logout
          </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8 bg-white rounded-lg shadow-sm">
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "overview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 className="h-5 w-5 mr-2" /> Overview
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "courses" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("courses")}
          >
            <BookOpen className="h-5 w-5 mr-2" /> My Courses
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "students" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("students")}
          >
            <Users className="h-5 w-5 mr-2" /> My Students
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "analytics" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("analytics")}
          >
            <TrendingUp className="h-5 w-5 mr-2" /> Analytics
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "settings" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="h-5 w-5 mr-2" /> Settings
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Courses</p>
                      <p className="text-2xl font-bold text-green-600">{activeCourses}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                      <p className="text-2xl font-bold text-orange-600">{pendingCourses}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-purple-600">{totalStudents}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Plus className="h-5 w-5 text-indigo-600" /> Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setActiveTab("courses")}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Upload New Course
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" /> View Messages
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <DollarSign className="h-4 w-4 mr-2" /> Revenue Report
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Award className="h-4 w-4 mr-2" /> Certificates
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Platform Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average Rating</span>
                      <span className="font-semibold text-indigo-600">
                        {analytics.average_rating ? `${analytics.average_rating}/5` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="font-semibold text-green-600">
                        ${analytics.total_revenue ? analytics.total_revenue.toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-semibold text-indigo-600">
                        {analytics.completion_rate ? `${analytics.completion_rate}%` : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Recent Course Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courses.length > 0 ? (
                      <div className="space-y-4">
                        {courses.slice(0, 5).map((course) => (
                          <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-indigo-600" />
                              <div>
                                <p className="font-medium text-gray-900">{course.title}</p>
                                <p className="text-sm text-gray-600">
                                  {course.is_active ? 'Active' : 'Pending Approval'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={course.is_active ? "default" : "secondary"}>
                                {course.is_active ? 'Active' : 'Pending'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCourseClick(course)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No courses yet. Start by uploading your first course!</p>
                        <Button onClick={() => setActiveTab("courses")} className="bg-indigo-600 hover:bg-indigo-700">
                          <Plus className="h-4 w-4 mr-2" /> Upload Course
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Upload/Edit Course */}
            <div className="lg:col-span-1 space-y-8">
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Upload className="h-6 w-6 text-indigo-600" /> 
                    {editingCourseId ? "Edit Course" : "Upload New Course"}
                </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCourseFormSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Course Title</Label>
                      <Input
                        id="courseTitle"
                        placeholder="e.g., NCLEX-RN Foundations"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        required
                        disabled={isAddingCourse || isUpdatingCourse || isUploadingFile}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseDescription">Description</Label>
                      <Textarea
                        id="courseDescription"
                        placeholder="Brief description of the course content."
                        value={courseDescription}
                        onChange={(e) => setCourseDescription(e.target.value)}
                        rows={3}
                        required
                        disabled={isAddingCourse || isUpdatingCourse || isUploadingFile}
                      />
                    </div>
                                         <div className="space-y-2">
                       <Label htmlFor="videoFile">Upload Video File (Cloudinary)</Label>
                       <Input
                         id="videoFile"
                         type="file"
                         accept="video/*"
                         onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                         disabled={isAddingCourse || isUpdatingCourse || isUploadingFile}
                       />
                       {selectedFile && <p className="text-sm text-gray-500 mt-1">Selected: {selectedFile.name}</p>}
                       <p className="text-sm text-gray-500 mt-1">OR provide Telegram group link:</p>
                       <Input
                         id="videoUrl"
                         type="url"
                         placeholder="https://t.me/your_organization_group"
                         value={videoUrl}
                         onChange={(e) => {
                           setVideoUrl(e.target.value)
                           setSelectedFile(null)
                         }}
                         disabled={isAddingCourse || isUpdatingCourse || isUploadingFile}
                       />
                       <p className="text-xs text-gray-400 mt-1">
                         • Upload video file for Cloudinary storage
                         • OR provide Telegram group link for course access
                       </p>
                     </div>
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                      disabled={isAddingCourse || isUpdatingCourse || isUploadingFile}
                    >
                      {isUploadingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading File...
                        </>
                      ) : editingCourseId ? (
                        isUpdatingCourse ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                          </>
                        ) : (
                          "Update Course"
                        )
                      ) : isAddingCourse ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        "Upload Course"
                      )}
                    </Button>
                    {editingCourseId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="w-full mt-2 text-gray-700 border-gray-300 hover:bg-gray-100 bg-transparent"
                        disabled={isAddingCourse || isUpdatingCourse || isUploadingFile}
                      >
                        <X className="h-4 w-4 mr-2" /> Cancel Edit
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Course Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-600" /> Total Students:
                    </span>
                    <span className="font-bold text-lg">{totalStudents}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-indigo-600" /> Total Courses:
                    </span>
                    <span className="font-bold text-lg">{totalCourses}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" /> Active Courses:
                    </span>
                    <span className="font-bold text-lg">{activeCourses}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" /> Pending Approval:
                    </span>
                    <span className="font-bold text-lg">{pendingCourses}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Course Management */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-indigo-600" /> Manage My Courses
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshCourses}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                                         <TableHeader>
                       <TableRow>
                         <TableHead>Title</TableHead>
                         <TableHead>Description</TableHead>
                         <TableHead>Content Link</TableHead>
                        <TableHead>Status</TableHead>
                         <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                              {course.description}
                            </TableCell>
                                                         <TableCell>
                               <a
                                 href={course.video_url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline text-sm"
                               >
                                 {course.video_url?.includes('t.me') ? 'Join Telegram Group' : 'View Video'}
                               </a>
                             </TableCell>
                            <TableCell>
                              <Badge variant={course.is_active ? "default" : "secondary"}>
                                {course.is_active ? 'Active' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-600 hover:text-blue-500"
                                onClick={() => handleEditCourseClick(course)}
                                disabled={isAddingCourse || isUpdatingCourse || isDeletingCourse || isUploadingFile}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-600 hover:text-red-500"
                                onClick={() => handleDeleteCourseClick(course.id)}
                                disabled={isDeletingCourse || isAddingCourse || isUpdatingCourse || isUploadingFile}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p>No courses found. Start by uploading your first course!</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">My Students</h2>
              <Badge variant="outline" className="text-sm">
                {totalStudents} Students
              </Badge>
            </div>

            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-6 w-6 text-indigo-600" /> Student Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                      <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      <TableHead>Courses Enrolled</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {students.length > 0 ? (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name || "N/A"}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.role}</Badge>
                          </TableCell>
                          <TableCell>{student.courses_enrolled_count || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={student.completion_rate || 0} 
                                className="w-16 h-2" 
                              />
                              <span className="text-sm">{student.completion_rate || 0}%</span>
                            </div>
                          </TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p>No students found.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={user?.full_name || ''} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ''} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      value={user?.role || ''} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Account Security</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    <Lock className="h-4 w-4 mr-2" /> Change Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" /> Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" /> Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Course Updates</p>
                    <p className="text-sm text-gray-600">Get notified about course changes</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Analytics & Insights</h2>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" /> Export Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        ${analytics.total_revenue ? analytics.total_revenue.toFixed(2) : '0.00'}
                      </p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">This Month</p>
                        <p className="font-semibold">${analytics.monthly_revenue ? analytics.monthly_revenue.toFixed(2) : '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Month</p>
                        <p className="font-semibold">${analytics.last_month_revenue ? analytics.last_month_revenue.toFixed(2) : '0.00'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Course Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-indigo-600">
                        {analytics.average_rating ? analytics.average_rating.toFixed(1) : '0.0'}
                      </p>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Completion Rate</p>
                        <p className="font-semibold">{analytics.completion_rate ? `${analytics.completion_rate}%` : '0%'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Enrollment Rate</p>
                        <p className="font-semibold">{analytics.enrollment_rate ? `${analytics.enrollment_rate}%` : '0%'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Student Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {analytics.active_students || 0}
                      </p>
                      <p className="text-sm text-gray-600">Active Students</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">New This Month</p>
                        <p className="font-semibold">{analytics.new_students_month || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Retention Rate</p>
                        <p className="font-semibold">{analytics.retention_rate ? `${analytics.retention_rate}%` : '0%'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recent_activity ? (
                    analytics.recent_activity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'enrollment' && <Users className="h-5 w-5 text-green-600" />}
                          {activity.type === 'completion' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                          {activity.type === 'review' && <FileText className="h-5 w-5 text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{activity.description}</p>
                          <p className="text-sm text-gray-600">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">No recent activity to display.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
