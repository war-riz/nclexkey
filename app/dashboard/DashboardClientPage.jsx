"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  PlayCircle, 
  BookOpen, 
  TrendingUp, 
  Settings, 
  LogOut, 
  MessageSquare, 
  ClipboardCheck, 
  Award, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Star,
  Eye,
  Download,
  Share2,
  Bell,
  BarChart3,
  FileText,
  Video,
  Headphones,
  Bookmark,
  Heart,
  Share,
  MoreHorizontal,
  Plus,
  Filter,
  Search
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest, logout } from "@/lib/api"

export default function DashboardClientPage() {
  const { user, loading: loadingAuth } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

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
                joined_date: user.date_joined,
                avatar: user.avatar || null
              },
              statistics: {
                total_courses: coursesData.length,
                completed_courses: progressData.filter(p => p.progress_percentage === 100).length,
                in_progress_courses: progressData.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).length,
                completion_rate: coursesData.length > 0 ? Math.round((progressData.filter(p => p.progress_percentage === 100).length / coursesData.length) * 100) : 0,
                total_spent: 0,
                certificates_earned: 0,
                study_hours: 0,
                average_score: 0
              },
              recent_activity: {
                course_progress: progressData.slice(0, 5),
                enrollments: [],
                exam_attempts: []
              },
              certificates: [],
              recommended_courses: coursesData.slice(0, 3),
              upcoming_deadlines: [],
              notifications: []
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

  const handleCourseAction = async (courseId, action) => {
    try {
      const response = await apiRequest(`/api/courses/${courseId}/${action}/`, {
        method: "POST"
      })
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Course ${action} successful!`,
        })
        // Refresh dashboard data
        window.location.reload()
      } else {
        throw new Error(response.error.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} course: ${error.message}`,
        variant: "destructive",
      })
    }
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
          <p className="text-lg text-red-600">Please log in to access your dashboard.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  const userInfo = dashboardData?.user_info || {}
  const stats = dashboardData?.statistics || {}
  const certificates = dashboardData?.certificates || []
  const recentActivity = dashboardData?.recent_activity || {}
  const recommendedCourses = dashboardData?.recommended_courses || []
  const notifications = dashboardData?.notifications || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-6 px-6 border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userInfo.avatar} alt={userInfo.name} />
              <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                {userInfo.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {userInfo.name || user.full_name || user.email}!
              </h1>
              <p className="text-gray-600 mt-1">
                Member since {userInfo.joined_date ? new Date(userInfo.joined_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-gray-600 hover:text-indigo-600 relative">
              <Link href="/dashboard/notifications">
                <Bell className="h-5 w-5 mr-2" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {notifications.length}
                  </Badge>
                )}
                Notifications
              </Link>
            </Button>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> My Courses
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Target className="h-4 w-4" /> Progress
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Award className="h-4 w-4" /> Certificates
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Exams
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Messages
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
                      <p className="text-sm font-medium text-gray-600">Study Hours</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.study_hours || 0}h</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Score</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.average_score || 0}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Progress Overview */}
              <div className="lg:col-span-2 space-y-6">
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

                {/* Recent Activity */}
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Clock className="h-6 w-6 text-indigo-600" /> Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.course_progress && recentActivity.course_progress.length > 0 ? (
                        recentActivity.course_progress.map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <PlayCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{activity.course_title}</p>
                              <p className="text-sm text-gray-600">
                                Progress: {activity.progress_percentage}% • {activity.last_accessed}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              Continue
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-center py-4">No recent activity to display.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Courses */}
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Star className="h-6 w-6 text-yellow-600" /> Recommended for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendedCourses.map((course, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{course.title}</h3>
                            <Badge variant="secondary">{course.difficulty}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              {course.duration}
                            </div>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                              Enroll
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
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

                {/* Certificates */}
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
                          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <Award className="h-5 w-5 text-yellow-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{cert.course_name}</p>
                              <p className="text-xs text-gray-600">{cert.issued_date}</p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Study Streak */}
                <Card className="bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Study Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 mb-2">7</div>
                      <p className="text-sm text-gray-600">Days in a row</p>
                      <Progress value={70} className="mt-3" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Courses</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="not-started">Not Started</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Course Cards */}
              {recentActivity.course_progress && recentActivity.course_progress.map((course, index) => (
                <Card key={index} className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">{course.course_title}</CardTitle>
                        <CardDescription className="mt-1">
                          Progress: {course.progress_percentage}%
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={course.progress_percentage === 100 ? "default" : 
                                course.progress_percentage > 0 ? "secondary" : "outline"}
                      >
                        {course.progress_percentage === 100 ? "Completed" : 
                         course.progress_percentage > 0 ? "In Progress" : "Not Started"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={course.progress_percentage} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last accessed: {course.last_accessed}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                          <PlayCircle className="h-4 w-4 mr-1" /> Continue
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Detailed Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.course_progress && recentActivity.course_progress.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{course.course_title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={course.progress_percentage} className="w-20 h-2" />
                            <span className="text-sm">{course.progress_percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{course.last_accessed}</TableCell>
                        <TableCell>
                          <Badge variant={course.progress_percentage >= 80 ? "default" : 
                                         course.progress_percentage >= 60 ? "secondary" : "destructive"}>
                            {course.progress_percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">My Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert, index) => (
                      <Card key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                        <CardContent className="p-6 text-center">
                          <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                          <h3 className="font-semibold text-gray-900 mb-2">{cert.course_name}</h3>
                          <p className="text-sm text-gray-600 mb-4">Issued: {cert.issued_date}</p>
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share2 className="h-4 w-4 mr-1" /> Share
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No certificates yet. Complete courses to earn certificates!</p>
                    <Button asChild>
                      <Link href="/courses">Browse Courses</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams" className="space-y-6">
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Practice Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">NCLEX-RN Practice</h3>
                      <p className="text-sm text-gray-600 mb-4">75 questions • 2 hours</p>
                      <Button className="w-full">Start Exam</Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">NCLEX-PN Practice</h3>
                      <p className="text-sm text-gray-600 mb-4">85 questions • 2.5 hours</p>
                      <Button className="w-full">Start Exam</Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-dashed border-gray-300 hover:border-indigo-400 transition-colors">
                    <CardContent className="p-6 text-center">
                      <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2">Quick Quiz</h3>
                      <p className="text-sm text-gray-600 mb-4">20 questions • 30 minutes</p>
                      <Button className="w-full">Start Quiz</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No messages yet. Connect with instructors and other students!</p>
                  <Button asChild>
                    <Link href="/dashboard/messages">View All Messages</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
