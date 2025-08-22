"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, BookOpen, TrendingUp, Settings, LogOut, MessageSquare, ClipboardCheck, Award, Clock, Users, DollarSign, Calendar, Target, CheckCircle, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest, logout } from "@/lib/api"

export default function DashboardClientPage() {
  const { user, loading: loadingAuth } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (loadingAuth) return

      if (user) {
        setLoadingData(true)
        try {
          // Fetch comprehensive dashboard data
          const dashboardResponse = await apiRequest("/api/courses/dashboard/", { method: "GET" })
          if (!dashboardResponse.success) {
            throw new Error(dashboardResponse.error.message || "Failed to fetch dashboard data.")
          }
          setDashboardData(dashboardResponse.data)

          // Fallback: If dashboard endpoint fails, fetch basic data
          if (!dashboardResponse.data) {
            const [coursesResponse, progressResponse] = await Promise.all([
              apiRequest("/api/courses/", { method: "GET" }),
              apiRequest("/api/users/me/progress/", { method: "GET" })
            ])
            
            const coursesData = coursesResponse.success ? coursesResponse.data : []
            const progressData = progressResponse.success ? progressResponse.data : []
            
            setDashboardData({
              user_info: {
                name: user.full_name || user.email,
                email: user.email,
                joined_date: user.date_joined
              },
              statistics: {
                total_courses: coursesData.length,
                completed_courses: progressData.filter(p => p.progress_percentage === 100).length,
                in_progress_courses: progressData.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).length,
                completion_rate: coursesData.length > 0 ? Math.round((progressData.filter(p => p.progress_percentage === 100).length / coursesData.length) * 100) : 0,
                total_spent: 0,
                certificates_earned: 0
              },
              recent_activity: {
                course_progress: progressData.slice(0, 5),
                enrollments: [],
                exam_attempts: []
              },
              certificates: []
            })
          }
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error)
          toast({
            title: "Error",
            description: `Failed to load dashboard data: ${error.message}`,
            variant: "destructive",
          })
        } finally {
          setLoadingData(false)
        }
      } else if (!user && !loadingAuth) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access your dashboard.",
          variant: "destructive",
        })
      }
    }

    fetchDashboardData()
  }, [user, loadingAuth])

  const handleSignOut = () => {
    logout()
  }

  if (loadingAuth || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600 mb-4">Authentication required. Please log in.</p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/login">Go to Login</Link>
        </Button>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.statistics || {}
  const userInfo = dashboardData?.user_info || {}
  const recentActivity = dashboardData?.recent_activity || {}
  const certificates = dashboardData?.certificates || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-6 px-6 border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, {userInfo.name || user.full_name || user.email}!
            </h1>
            <p className="text-gray-600 mt-1">
              Member since {userInfo.joined_date ? new Date(userInfo.joined_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-gray-600 hover:text-indigo-600">
            <Link href="/dashboard/settings">
              <Settings className="h-5 w-5 mr-2" /> Settings
            </Link>
          </Button>
            <Button onClick={handleSignOut} className="bg-indigo-600 text-white hover:bg-indigo-700">
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
            <TrendingUp className="h-5 w-5 mr-2" /> Overview
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
            className={`rounded-none border-b-2 ${activeTab === "progress" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("progress")}
          >
            <Target className="h-5 w-5 mr-2" /> Progress
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "certificates" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("certificates")}
          >
            <Award className="h-5 w-5 mr-2" /> Certificates
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
                      <p className="text-2xl font-bold text-gray-900">{stats.total_courses || 0}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completed_courses || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.in_progress_courses || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-indigo-600">{stats.completion_rate || 0}%</p>
                    </div>
                    <Target className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-indigo-600" /> Overall Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
              <div className="flex items-center justify-between">
                        <span className="text-gray-700">Course Completion</span>
                        <span className="font-semibold text-indigo-600">
                          {stats.completed_courses || 0}/{stats.total_courses || 0}
                </span>
              </div>
                      <Progress value={stats.completion_rate || 0} className="h-3" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
              </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/courses">
                        <BookOpen className="h-4 w-4 mr-2" /> Browse Courses
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/dashboard/progress">
                        <Target className="h-4 w-4 mr-2" /> View Progress
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/dashboard/messages">
                        <MessageSquare className="h-4 w-4 mr-2" /> Messages
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/dashboard/exam">
                        <ClipboardCheck className="h-4 w-4 mr-2" /> Take Exam
                      </Link>
              </Button>
            </CardContent>
          </Card>

                {certificates.length > 0 && (
                  <Card className="bg-white shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" /> Recent Certificates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {certificates.slice(0, 3).map((cert, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{cert.exam_title}</p>
                              <p className="text-xs text-gray-600">{cert.course_title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.course_progress && recentActivity.course_progress.length > 0 && (
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.course_progress.slice(0, 5).map((progress, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-indigo-600" />
                          <div>
                            <p className="font-medium text-gray-900">{progress.course_title || 'Course'}</p>
                            <p className="text-sm text-gray-600">Last accessed: {progress.last_accessed ? new Date(progress.last_accessed).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                        <Badge variant={progress.progress_percentage === 100 ? "default" : "secondary"}>
                          {progress.progress_percentage || 0}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/courses">
                  <BookOpen className="h-4 w-4 mr-2" /> Browse All Courses
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {recentActivity.course_progress && recentActivity.course_progress.length > 0 ? (
                recentActivity.course_progress.map((course, index) => (
                  <Card key={index} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">{course.course_title || 'Course'}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {course.course_description || 'No description available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{course.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={course.progress_percentage || 0} className="h-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button asChild className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                          <Link href={`/courses/${course.course_id || '#'}`}>
                            <PlayCircle className="h-4 w-4 mr-2" /> Continue
                </Link>
              </Button>
                        <Button variant="outline" className="flex-1">
                          <Target className="h-4 w-4 mr-2" /> Progress
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No courses enrolled yet.</p>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">My Progress</h2>
              <Button asChild variant="outline">
                <Link href="/dashboard/progress">
                  <Target className="h-4 w-4 mr-2" /> Detailed Progress
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Learning Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.total_courses || 0}</p>
                      <p className="text-sm text-gray-600">Total Courses</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.completed_courses || 0}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{stats.in_progress_courses || 0}</p>
                      <p className="text-sm text-gray-600">In Progress</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{stats.certificates_earned || 0}</p>
                      <p className="text-sm text-gray-600">Certificates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Course Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.course_progress && recentActivity.course_progress.length > 0 ? (
                      recentActivity.course_progress.map((progress, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{progress.course_title || 'Course'}</span>
                            <span className="text-sm font-medium text-indigo-600">{progress.progress_percentage || 0}%</span>
                          </div>
                          <Progress value={progress.progress_percentage || 0} className="h-2" />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-center py-4">No progress data available.</p>
                    )}
                  </div>
            </CardContent>
          </Card>
        </div>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">My Certificates</h2>
              <Badge variant="outline" className="text-sm">
                {certificates.length} Earned
              </Badge>
            </div>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert, index) => (
                  <Card key={index} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                      <div className="flex items-center gap-3">
                        <Award className="h-8 w-8 text-yellow-600" />
                        <div>
                          <CardTitle className="text-lg font-semibold">{cert.exam_title}</CardTitle>
                          <CardDescription>{cert.course_title}</CardDescription>
                        </div>
                      </div>
                </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Issued:</span>
                          <span className="font-medium">{new Date(cert.issued_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Certificate #:</span>
                          <span className="font-medium">{cert.certificate_number}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1">
                          <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                            <Award className="h-4 w-4 mr-2" /> View
                    </a>
                  </Button>
                        <Button variant="outline" className="flex-1">
                          <Target className="h-4 w-4 mr-2" /> Download
                        </Button>
                      </div>
                </CardContent>
              </Card>
            ))}
              </div>
            ) : (
              <Card className="bg-white shadow-md">
                <CardContent className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Yet</h3>
                  <p className="text-gray-600 mb-4">Complete courses and pass exams to earn certificates.</p>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/courses">Start Learning</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
