"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, CheckCircle } from 'lucide-react'
import PaymentForm from '@/components/payment-form'
import { paymentAPI } from '@/lib/api'

export default function CourseEnrollmentButton({ course, onSuccess, className = "" }) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)

  const handleEnrollClick = () => {
    setShowPaymentDialog(true)
    setPaymentStatus(null)
  }

  const handlePaymentSuccess = (paymentData) => {
    setPaymentStatus('success')
    setIsProcessing(false)
    
    // Close dialog after 2 seconds and call success callback
    setTimeout(() => {
      setShowPaymentDialog(false)
      setPaymentStatus(null)
      onSuccess?.(paymentData)
    }, 2000)
  }

  const handlePaymentError = (error) => {
    setPaymentStatus('error')
    setIsProcessing(false)
    console.error('Payment failed:', error)
  }

  const handleCloseDialog = () => {
    if (!isProcessing) {
      setShowPaymentDialog(false)
      setPaymentStatus(null)
    }
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    })
    return formatter.format(amount)
  }

  return (
    <>
      <Button
        onClick={handleEnrollClick}
        className={`w-full ${className}`}
        size="lg"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Enroll Now - {formatCurrency(course.price, course.currency)}
      </Button>

      <Dialog open={showPaymentDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Enrollment</DialogTitle>
          </DialogHeader>

          {paymentStatus === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600">
                You have successfully enrolled in "{course.title}"
              </p>
            </div>
          ) : paymentStatus === 'error' ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">✕</span>
              </div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Payment Failed
              </h3>
              <p className="text-gray-600 mb-4">
                There was an issue processing your payment. Please try again.
              </p>
              <Button
                onClick={() => {
                  setPaymentStatus(null)
                  setShowPaymentDialog(false)
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <PaymentForm
              course={course}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}




