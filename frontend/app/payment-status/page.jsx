"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Home, 
  BookOpen,
  ArrowLeft
} from 'lucide-react'
import { paymentAPI } from '@/lib/api'

export default function PaymentStatusPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('loading')
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    handlePaymentCallback()
  }, [])

  const handlePaymentCallback = async () => {
    const reference = searchParams.get('reference')
    const trxref = searchParams.get('trxref')
    const status = searchParams.get('status')
    const courseId = searchParams.get('course_id')

    if (!reference && !trxref) {
      setStatus('error')
      setError('No payment reference found')
      return
    }

    const paymentRef = reference || trxref

    try {
      // Verify payment with backend
      const result = await paymentAPI.verifyPayment(paymentRef)
      
      if (result.success) {
        setStatus('success')
        setPaymentData(result.data)
      } else {
        setStatus('error')
        setError(result.error?.message || 'Payment verification failed')
      }
    } catch (error) {
      setStatus('error')
      setError('Failed to verify payment')
      console.error('Payment verification error:', error)
    }
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    })
    return formatter.format(amount)
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
              <p className="text-gray-600">
                Please wait while we verify your payment...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
              <p className="text-gray-600 mb-6">
                {error || 'There was an issue processing your payment. Please try again.'}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/courses')}
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              
              {paymentData && (
                <div className="mb-6 text-left bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Payment Details:</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(paymentData.amount, paymentData.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-xs">{paymentData.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gateway:</span>
                      <span className="font-medium capitalize">{paymentData.gateway}</span>
                    </div>
                    {paymentData.course && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Course:</span>
                        <span className="font-medium">{paymentData.course.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-6">
                You have successfully enrolled in the course. You can now access all course content.
              </p>

              <div className="space-y-3">
                {paymentData?.course && (
                  <Button 
                    onClick={() => router.push(`/dashboard/courses/${paymentData.course.id}`)}
                    className="w-full"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Go to Course
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/courses')}
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Courses
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/courses')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Browse More Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
