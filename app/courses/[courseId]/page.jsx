"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Clock, 
  Users, 
  Star, 
  Play, 
  BookOpen, 
  Award,
  ArrowLeft,
  CheckCircle,
  XCircle
} from 'lucide-react'
import CourseEnrollmentButton from '@/components/course-enrollment-button'
import { getCourseDetailsPublic } from '@/lib/api'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (params.courseId) {
      loadCourse()
    }
  }, [params.courseId])

  const loadCourse = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await getCourseDetailsPublic(params.courseId)
      if (result.success) {
        setCourse(result.data.course)
      } else {
        setError(result.error?.message || 'Failed to load course')
      }
    } catch (error) {
      setError('Failed to load course details')
      console.error('Error loading course:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollmentSuccess = (paymentData) => {
    // Redirect to course dashboard after successful enrollment
    router.push(`/dashboard/courses/${params.courseId}`)
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    })
    return formatter.format(amount)
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading course details...</span>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Course not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/courses')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Header */}
          <div>
            <div className="flex items-start gap-4 mb-4">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.total_duration || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.total_lessons || 0} lessons</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.enrollment_count || 0} students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Badges */}
            <div className="flex items-center gap-2 mb-6">
              <Badge variant="secondary">{course.category?.name}</Badge>
              <Badge variant="outline">{course.level}</Badge>
              {course.is_featured && (
                <Badge variant="default" className="bg-yellow-500">
                  Featured
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Instructor Info */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={course.instructor?.profile_picture} />
                  <AvatarFallback>
                    {getInitials(course.instructor?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {course.instructor?.full_name || 'Unknown Instructor'}
                  </h3>
                  <p className="text-gray-600">
                    {course.instructor?.bio || 'Experienced instructor'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">
                        {course.instructor?.rating || '4.5'} ({course.instructor?.review_count || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle>What you'll learn</CardTitle>
            </CardHeader>
            <CardContent>
              {course.learning_objectives ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.learning_objectives.map((objective, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{objective}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">
                  This course will provide comprehensive knowledge and practical skills.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Course Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Course Description */}
          <Card>
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {course.long_description || course.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            {/* Enrollment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Enroll in this Course</CardTitle>
                <CardDescription>
                  Get lifetime access to all course content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(course.price, course.currency)}
                  </div>
                  {course.original_price && course.original_price > course.price && (
                    <div className="text-sm text-gray-500 line-through">
                      {formatCurrency(course.original_price, course.currency)}
                    </div>
                  )}
                </div>

                <CourseEnrollmentButton
                  course={course}
                  onSuccess={handleEnrollmentSuccess}
                />

                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>30-day money-back guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Mobile and TV access</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Students enrolled:</span>
                  <span className="font-semibold">{course.enrollment_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Course rating:</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{course.rating || '4.5'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last updated:</span>
                  <span className="font-semibold">
                    {course.updated_at ? new Date(course.updated_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}





