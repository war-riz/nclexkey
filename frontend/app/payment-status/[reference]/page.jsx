"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/api'

export default function PaymentStatusPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reference = params.reference

  useEffect(() => {
    if (reference) {
      checkPaymentStatus()
    }
  }, [reference])

  const checkPaymentStatus = async () => {
    try {
      setLoading(true)
      
      // Check payment status from backend
      const response = await apiRequest(`/api/payments/verify/${reference}/`, {
        method: 'POST'
      })

      if (response.success) {
        setPaymentStatus('completed')
        toast({
          title: "Payment Successful! 🎉",
          description: "Your payment has been verified. You can now complete your registration.",
          variant: "default",
        })
      } else {
        setPaymentStatus('failed')
        setError(response.error?.message || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Payment status check error:', error)
      setPaymentStatus('failed')
      setError('Failed to verify payment status')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (paymentStatus === 'completed') {
      // Redirect to registration page with payment reference
      router.push(`/register?payment_ref=${reference}`)
    } else {
      // Redirect to courses page to try again
      router.push('/courses')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your payment status...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {paymentStatus === 'completed' ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold text-green-800">
                Payment Successful!
              </h3>
              <p className="text-gray-600">
                Your payment has been verified. You can now complete your registration and access all courses.
              </p>
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  Reference: {reference}
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue to Registration
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <h3 className="text-lg font-semibold text-red-800">
                Payment Failed
              </h3>
              <p className="text-gray-600">
                {error || 'Your payment could not be processed. Please try again.'}
              </p>
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  Reference: {reference}
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button 
                  onClick={handleContinue}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => router.push('/')}
                  variant="ghost"
                  className="w-full"
                >
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
