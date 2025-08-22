"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle, CardDescription, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, BookOpen, DollarSign, Settings, LogOut, Loader2, BarChart3, Users, TrendingUp, Clock, AlertCircle, Eye, FileText, Shield, Award, MessageSquare } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { superadminAPI, logout } from "@/lib/api"

export default function SuperadminDashboardClientPage() {
  const { user, loading: loadingAuth } = useAuth()
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [pendingCourses, setPendingCourses] = useState([])
  const [pendingPayments, setPendingPayments] = useState([])
  const [platformStats, setPlatformStats] = useState({})
  const [loadingData, setLoadingData] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    const fetchSuperadminData = async () => {
      if (loadingAuth) return

      if (user && user.role === "super_admin") {
        setIsSuperadmin(true)
        setLoadingData(true)
        try {
          // Fetch platform overview
          const overviewResult = await superadminAPI.getPlatformOverview()
          if (overviewResult.success) {
            setPlatformStats(overviewResult.data || {})
          } else {
            console.warn("Failed to fetch platform overview:", overviewResult.error)
          }

          // Fetch pending courses
          const coursesResult = await superadminAPI.getPendingCourses()
          if (coursesResult.success) {
            setPendingCourses(coursesResult.data?.pending_courses || [])
          } else {
            console.warn("Failed to fetch pending courses:", coursesResult.error)
          }

          // Fetch pending payments (fallback to mock data if API not implemented)
          try {
          const paymentsResult = await superadminAPI.getPendingPayments()
          if (paymentsResult.success) {
              setPendingPayments(paymentsResult.data?.payments || [])
          } else {
              // Fallback to mock data
              setPendingPayments([
                {
                  id: "pay1",
                  transaction_id: "TXN12345",
                  user_name: "Alice Smith",
                  amount: 120.0,
                  date: "2024-07-28T10:00:00Z",
                  status: "pending"
                },
                {
                  id: "pay2",
                  transaction_id: "TXN67890",
                  user_name: "Bob Johnson",
                  amount: 85.5,
                  date: "2024-07-29T14:30:00Z",
                  status: "pending"
                },
              ])
            }
          } catch (error) {
            console.warn("Payment API not implemented, using mock data")
            setPendingPayments([
              {
                id: "pay1",
                transaction_id: "TXN12345",
                user_name: "Alice Smith",
                amount: 120.0,
                date: "2024-07-28T10:00:00Z",
                status: "pending"
              },
              {
                id: "pay2",
                transaction_id: "TXN67890",
                user_name: "Bob Johnson",
                amount: 85.5,
                date: "2024-07-29T14:30:00Z",
                status: "pending"
              },
            ])
          }
        } catch (error) {
          console.error("Failed to fetch superadmin data:", error)
          toast({
            title: "Error",
            description: `Failed to load superadmin data: ${error.message}`,
            variant: "destructive",
          })
        } finally {
          setLoadingData(false)
        }
      } else if (user && user.role !== "super_admin") {
        setIsSuperadmin(false)
        toast({
          title: "Access Denied",
          description: "You are not authorized to view this page.",
          variant: "destructive",
        })
      } else if (!user && !loadingAuth) {
        setIsSuperadmin(false)
        toast({
          title: "Access Denied",
          description: "Please log in to view this page.",
          variant: "destructive",
        })
      }
    }

    fetchSuperadminData()
  }, [user, loadingAuth])

  const handleApproveCourse = async (courseId) => {
    setProcessingId(courseId)
    try {
      const response = await superadminAPI.moderateCourse(courseId, "approve", "Approved by superadmin")
      if (!response.success) {
        throw new Error(response.error.message || "Failed to approve course.")
      }
      setPendingCourses((prev) => prev.filter((course) => course.id !== courseId))
      toast({ title: "Course Approved", description: "Course has been successfully approved." })
    } catch (error) {
      console.error("Approve course API call failed:", error)
      toast({ title: "Error", description: `Failed to approve course: ${error.message}`, variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectCourse = async (courseId) => {
    setProcessingId(courseId)
    try {
      const response = await superadminAPI.moderateCourse(courseId, "reject", "Rejected by superadmin")
      if (!response.success) {
        throw new Error(response.error.message || "Failed to reject course.")
      }
      setPendingCourses((prev) => prev.filter((course) => course.id !== courseId))
      toast({ title: "Course Rejected", description: "Course has been rejected." })
    } catch (error) {
      console.error("Reject course API call failed:", error)
      toast({ title: "Error", description: `Failed to reject course: ${error.message}`, variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprovePayment = async (paymentId) => {
    setProcessingId(paymentId)
    try {
      const response = await superadminAPI.approvePayment(paymentId)
      if (!response.success) {
        throw new Error(response.error.message || "Failed to approve payment.")
      }
      setPendingPayments((prev) => prev.filter((payment) => payment.id !== paymentId))
      toast({ title: "Payment Approved", description: "Payment has been successfully approved." })
    } catch (error) {
      console.error("Approve payment API call failed:", error)
      toast({ title: "Error", description: `Failed to approve payment: ${error.message}`, variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectPayment = async (paymentId) => {
    setProcessingId(paymentId)
    try {
      const response = await superadminAPI.rejectPayment(paymentId)
      if (!response.success) {
        throw new Error(response.error.message || "Failed to reject payment.")
      }
      setPendingPayments((prev) => prev.filter((payment) => payment.id !== paymentId))
      toast({ title: "Payment Rejected", description: "Payment has been rejected." })
    } catch (error) {
      console.error("Reject payment API call failed:", error)
      toast({ title: "Error", description: `Failed to reject payment: ${error.message}`, variant: "destructive" })
    } finally {
      setProcessingId(null)
    }
  }

  const handleLogout = () => {
    logout()
  }

  if (loadingAuth || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading Superadmin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isSuperadmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <p className="text-lg text-red-600">Access Denied: You are not authorized to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm py-6 px-6 border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Superadmin Dashboard</h1>
            <p className="text-gray-600 mt-1">Platform administration and moderation</p>
          </div>
        <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-gray-600 hover:text-indigo-600">
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
            className={`rounded-none border-b-2 ${activeTab === "pending-courses" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("pending-courses")}
          >
            <BookOpen className="h-5 w-5 mr-2" /> Pending Courses
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "pending-payments" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("pending-payments")}
          >
            <DollarSign className="h-5 w-5 mr-2" /> Pending Payments
          </Button>
          <Button
            variant="ghost"
            className={`rounded-none border-b-2 ${activeTab === "instructors" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}
            onClick={() => setActiveTab("instructors")}
          >
            <Users className="h-5 w-5 mr-2" /> Instructors
          </Button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Platform Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{platformStats.total_users || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-green-600">{platformStats.total_courses || 0}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Courses</p>
                      <p className="text-2xl font-bold text-orange-600">{pendingCourses.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ${platformStats.total_revenue ? platformStats.total_revenue.toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-indigo-600" /> Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">New Users (30 days)</span>
                      <span className="font-semibold text-indigo-600">{platformStats.new_users_30d || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Active Courses</span>
                      <span className="font-semibold text-green-600">{platformStats.active_courses || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Course Creators</span>
                      <span className="font-semibold text-purple-600">{platformStats.course_creators || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="h-6 w-6 text-indigo-600" /> Moderation Queue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Courses Pending</span>
                      <Badge variant="secondary">{pendingCourses.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Payments Pending</span>
                      <Badge variant="secondary">{pendingPayments.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Reviews Pending</span>
                      <Badge variant="secondary">{platformStats.pending_reviews || 0}</Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setActiveTab("pending-courses")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Eye className="h-4 w-4 mr-2" /> Review Pending Items
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Recent Platform Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformStats.recent_activity ? (
                    platformStats.recent_activity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'course_upload' && <BookOpen className="h-5 w-5 text-blue-600" />}
                          {activity.type === 'user_registration' && <Users className="h-5 w-5 text-green-600" />}
                          {activity.type === 'payment' && <DollarSign className="h-5 w-5 text-purple-600" />}
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

        {/* Pending Courses Tab */}
        {activeTab === "pending-courses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Courses Awaiting Approval</h2>
              <Badge variant="outline" className="text-sm">
                {pendingCourses.length} Pending
              </Badge>
            </div>

            <Card className="bg-white shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Instructor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCourses.length > 0 ? (
                    pendingCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                            {course.description}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{course.instructor_name || "N/A"}</p>
                              <p className="text-sm text-gray-600">{course.instructor_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.course_type || 'Standard'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{course.moderation_status}</Badge>
                          </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-green-500"
                            onClick={() => handleApproveCourse(course.id)}
                            disabled={processingId === course.id}
                          >
                            {processingId === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span className="sr-only">Approve</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-red-500"
                            onClick={() => handleRejectCourse(course.id)}
                            disabled={processingId === course.id}
                          >
                            {processingId === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="sr-only">Reject</span>
                          </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p>No pending courses found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Pending Payments Tab */}
        {activeTab === "pending-payments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Payments Awaiting Approval</h2>
              <Badge variant="outline" className="text-sm">
                {pendingPayments.length} Pending
              </Badge>
            </div>

            <Card className="bg-white shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.length > 0 ? (
                    pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.transaction_id}</TableCell>
                          <TableCell>{payment.user_name || "N/A"}</TableCell>
                          <TableCell className="font-semibold">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{payment.status}</Badge>
                          </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-green-500"
                            onClick={() => handleApprovePayment(payment.id)}
                            disabled={processingId === payment.id}
                          >
                            {processingId === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span className="sr-only">Approve</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-red-500"
                            onClick={() => handleRejectPayment(payment.id)}
                            disabled={processingId === payment.id}
                          >
                            {processingId === payment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="sr-only">Reject</span>
                          </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p>No pending payments found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Instructors Tab */}
        {activeTab === "instructors" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Instructor Management</h2>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" /> View All Instructors
              </Button>
            </div>

            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Top Performing Instructors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platformStats.top_instructors ? (
                    platformStats.top_instructors.map((instructor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{instructor.name}</p>
                            <p className="text-sm text-gray-600">{instructor.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-indigo-600">{instructor.total_courses} Courses</p>
                          <p className="text-sm text-gray-600">{instructor.total_enrollments} Students</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">No instructor data available.</p>
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
