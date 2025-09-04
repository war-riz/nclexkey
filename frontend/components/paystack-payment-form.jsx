"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  CheckCircle, 
  XCircle,
  Loader2,
  ArrowRight,
  Info,
  Shield
} from 'lucide-react'
import { paymentAPI } from '@/lib/api'

export default function PaystackPaymentForm({ 
  course, 
  amount, 
  currency = 'NGN',
  onSuccess, 
  onError,
  className = "",
  paymentType = 'student_registration',
  userData = null,
  selectedProgram = null, // Add selectedProgram prop
  onPaymentSuccess = null // Add onPaymentSuccess callback
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const formatCurrency = (amount) => {
    const currencySymbols = {
      'NGN': '₦',
      'USD': '$',
      'GBP': '£',
      'EUR': '€'
    }
    
    const symbol = currencySymbols[currency] || currency
    return `${symbol}${amount.toLocaleString()}`
  }

  const handlePaystackPayment = async () => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Initiating Paystack payment:', {
        courseId: course.id,
        amount,
        currency,
        paymentType,
        userData
      })

      // Check if we're in test mode (for development)
      const isTestMode = false // Disabled for live payments

      if (isTestMode && paymentType === 'student_registration') {
        // Test mode: simulate successful payment
        console.log('🧪 Test mode: Simulating successful payment')
        
        // Simulate payment processing
        setTimeout(() => {
          const testReference = `TEST-${Date.now()}`
          const testPaymentData = {
            reference: testReference,
            amount: amount,
            currency: currency,
            status: 'completed'
          }
          
          setSuccess('Payment successful! (Test Mode)')
          onSuccess(testReference, testPaymentData)
          
          // Call onPaymentSuccess callback if provided (for redirect to registration)
          if (onPaymentSuccess) {
            onPaymentSuccess(testReference)
          }
        }, 2000)
        
        return
      }

      // Initialize payment with backend
      const paymentResponse = await paymentAPI.initializePayment({
        gateway: 'paystack',
        payment_type: paymentType,
        course_id: course.id,
        amount: amount,
        currency: currency,
        user_data: userData
      })

      if (paymentResponse.success) {
        // Store payment reference for later verification
        localStorage.setItem('pending_payment_reference', paymentResponse.data.reference)
        localStorage.setItem('pending_payment_type', paymentType)
        
        // Redirect to Paystack payment page
        if (paymentResponse.data.payment_url) {
          window.location.href = paymentResponse.data.payment_url
        } else {
          throw new Error('Payment URL not received')
        }
      } else {
        throw new Error(paymentResponse.error?.message || 'Payment initiation failed')
      }

    } catch (error) {
      console.error('Payment error:', error)
      setError(error.message || 'Payment failed. Please try again.')
      onError(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBankTransfer = async () => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Initiating bank transfer payment:', {
        courseId: course.id,
        amount,
        currency,
        paymentType,
        userData
      })

      // Check if we're in test mode (for development)
      const isTestMode = false // Disabled for live payments

      if (isTestMode && paymentType === 'student_registration') {
        // Test mode: simulate successful payment
        console.log('🧪 Test mode: Simulating successful bank transfer')
        
        // Simulate payment processing
        setTimeout(() => {
          const testReference = `TEST-BANK-${Date.now()}`
          const testPaymentData = {
            reference: testReference,
            amount: amount,
            currency: currency,
            status: 'completed',
            method: 'bank_transfer'
          }
          
          setSuccess('Bank transfer successful! (Test Mode)')
          onSuccess(testReference, testPaymentData)
          
          // Call onPaymentSuccess callback if provided (for redirect to registration)
          if (onPaymentSuccess) {
            onPaymentSuccess(testReference)
          }
        }, 2000)
        
        return
      }

      // For bank transfer, we'll use Paystack's bank transfer option
      // Initialize payment with backend
      const paymentResponse = await paymentAPI.initializePayment({
        gateway: 'paystack',
        payment_type: paymentType,
        course_id: course.id,
        amount: amount,
        currency: currency,
        user_data: userData,
        payment_method: 'bank_transfer'
      })

      if (paymentResponse.success) {
        // Store payment reference for later verification
        localStorage.setItem('pending_payment_reference', paymentResponse.data.reference)
        localStorage.setItem('pending_payment_type', paymentType)
        
        // Redirect to Paystack payment page (will show bank transfer options)
        if (paymentResponse.data.payment_url) {
          window.location.href = paymentResponse.data.payment_url
        } else {
          throw new Error('Payment URL not received')
        }
      } else {
        throw new Error(paymentResponse.error?.message || 'Payment initiation failed')
      }

    } catch (error) {
      console.error('Bank transfer error:', error)
      setError(error.message || 'Bank transfer failed. Please try again.')
      onError(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTestPayment = async () => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('🧪 Test mode: Creating test payment for student registration')
      
      const response = await fetch('http://localhost:8000/api/payments/test-student-registration/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Test payment successful! Reference: ${data.reference}`)
        onSuccess?.(data.reference, {
          reference: data.reference,
          amount: data.amount,
          currency: data.currency,
          status: data.status
        })
        
        // Call onPaymentSuccess callback if provided (for redirect to registration)
        if (onPaymentSuccess) {
          onPaymentSuccess(data.reference)
        }
      } else {
        throw new Error(data.error?.message || 'Test payment failed')
      }
    } catch (error) {
      console.error('Test payment error:', error)
      setError(error.message || 'Test payment failed')
      onError?.(error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment Options
        </CardTitle>
        <CardDescription>
          Choose your preferred payment method to complete your registration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Registration:</span>
            <span>{course.title}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="font-medium">Amount:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(amount)} {currency}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            One-time payment for full platform access
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Payment Methods */}
        <div className="space-y-4">
          {/* Paystack Payment */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Paystack Payment</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Pay with credit/debit cards, USSD, or mobile money through Paystack
            </p>
            <Button 
              onClick={handlePaystackPayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay with Paystack
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Bank Transfer */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Bank Transfer</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Transfer directly from your bank account to our account
            </p>
            <Button 
              onClick={handleBankTransfer}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Pay with Bank Transfer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Test Payment */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Info className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold">Test Payment</h3>
              <Badge variant="secondary" className="text-xs">Development Only</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Use this for testing the payment flow without actual charges
            </p>
            <Button 
              onClick={handleTestPayment}
              disabled={isProcessing}
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Test Payment...
                </>
              ) : (
                <>
                  Test Payment ({formatCurrency(amount)})
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>All payments are processed securely. Your payment details are never stored on our servers.</p>
            </div>
          </div>
        </div>

        {/* Supported Payment Methods */}
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Supported Payment Methods:</p>
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Verve</span>
            <span>Bank Transfer</span>
            <span>USSD</span>
            <span>Mobile Money</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
