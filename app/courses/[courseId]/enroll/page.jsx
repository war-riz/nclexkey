"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import PaymentForm from '@/components/payment-form'
import { getCourseDetailsPublic, paymentAPI } from '@/lib/api'

export default function CourseEnrollmentPage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)

  useEffect(() => {
    if (params.courseId) {
      loadCourse()
    }
  }, [params.courseId])

  const loadCourse = async () => {
    try {
      setIsLoading(true)
      const result = await getCourseDetailsPublic(params.courseId)
      if (result.success) {
        setCourse(result.data.course)
      } else {
        console.error('Failed to load course:', result.error)
      }
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollClick = () => {
    setShowPayment(true)
  }

  const handlePaymentSuccess = (paymentData) => {
    setPaymentStatus('success')
    // Redirect to course dashboard after successful payment
    setTimeout(() => {
      router.push(`/dashboard/courses/${params.courseId}`)
    }, 2000)
  }

  const handlePaymentError = (error) => {
    setPaymentStatus('error')
    console.error('Payment failed:', error)
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
    setPaymentStatus(null)
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    })
    return formatter.format(amount)
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

  if (!course) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Course not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (paymentStatus === 'success') {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              You have successfully enrolled in "{course.title}"
            </p>
            <Button onClick={() => router.push(`/dashboard/courses/${params.courseId}`)}>
              Go to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentStatus === 'error') {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">
              There was an issue processing your payment. Please try again.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePaymentCancel}>
                Try Again
              </Button>
              <Button onClick={() => router.push(`/courses/${params.courseId}`)}>
                Back to Course
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${params.courseId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        
        <h1 className="text-3xl font-bold">Enroll in Course</h1>
        <p className="text-gray-600">Complete your enrollment by making payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Course Summary</CardTitle>
            <CardDescription>Review your course details before payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{course.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{course.category?.name}</Badge>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span>{course.total_duration || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lessons:</span>
                <span>{course.total_lessons || 0} lessons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instructor:</span>
                <span>{course.instructor?.full_name || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(course.price, course.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <div>
          {showPayment ? (
            <PaymentForm
              course={course}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ready to Enroll?</CardTitle>
                <CardDescription>
                  Click the button below to proceed with payment and complete your enrollment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleEnrollClick}
                  className="w-full"
                  size="lg"
                >
                  Enroll Now - {formatCurrency(course.price, course.currency)}
                </Button>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p>✓ Instant access after payment</p>
                  <p>✓ 30-day money-back guarantee</p>
                  <p>✓ Lifetime access to course content</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}





