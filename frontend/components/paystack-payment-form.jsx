"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  XCircle,
  Loader2,
  Banknote,
  ArrowRight,
  Info,
  Shield,
  Calendar,
  Lock
} from 'lucide-react'
import { paymentAPI } from '@/lib/api'

export default function PaystackPaymentForm({ 
  course, 
  amount, 
  currency = 'NGN',
  onSuccess, 
  onError,
  className = "",
  paymentType = 'course_enrollment',
  userData = null
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [paymentUrl, setPaymentUrl] = useState(null)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardHolderName: ''
  })

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

  const handleCardInputChange = (field, value) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const handleCardPayment = async (e) => {
    e.preventDefault()
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Initiating card payment:', {
        courseId: course.id,
        amount,
        currency,
        paymentType,
        userData,
        cardData
      })

      const result = await paymentAPI.initializePayment(
        course.id,
        'paystack',
        paymentType,
        userData,
        amount,
        currency
      )

      if (result.success) {
        console.log('Payment initialization successful:', result.data)
        
        if (result.data.payment_url) {
          // Store payment reference for verification
          localStorage.setItem('pending_payment_reference', result.data.reference)
          localStorage.setItem('pending_payment_course_id', course.id)
          localStorage.setItem('pending_payment_amount', amount.toString())
          localStorage.setItem('pending_payment_currency', currency)
          
          // Redirect to Paystack payment page
          window.location.href = result.data.payment_url
        } else {
          setError('Payment URL not received from server')
        }
      } else {
        console.error('Payment initialization failed:', result.error)
        setError(result.error?.message || 'Failed to initialize payment')
        onError?.(result.error)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Network error occurred. Please try again.')
      onError?.({ message: 'Network error occurred' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTestPayment = async () => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
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
        onSuccess?.(data.reference)
      } else {
        throw new Error(data.message || 'Test payment failed')
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
          Secure Payment with Paystack
        </CardTitle>
        <CardDescription>
          Complete your payment to enroll in {course.title}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Course:</span>
            <span>{course.title}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="font-medium">Amount:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(amount)} {currency}
            </span>
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
          {/* Card Payment Form */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Credit/Debit Card</h3>
            </div>
            
            <form onSubmit={handleCardPayment} className="space-y-4">
              {/* Card Number */}
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.cardNumber}
                    onChange={(e) => handleCardInputChange('cardNumber', formatCardNumber(e.target.value))}
                    maxLength="19"
                    required
                    className="pl-10"
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Card Holder Name */}
              <div>
                <Label htmlFor="cardHolderName">Card Holder Name</Label>
                <Input
                  id="cardHolderName"
                  type="text"
                  placeholder="John Doe"
                  value={cardData.cardHolderName}
                  onChange={(e) => handleCardInputChange('cardHolderName', e.target.value)}
                  required
                />
              </div>

              {/* Expiry Date and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryMonth">Expiry Month</Label>
                  <Input
                    id="expiryMonth"
                    type="text"
                    placeholder="MM"
                    value={cardData.expiryMonth}
                    onChange={(e) => handleCardInputChange('expiryMonth', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength="2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiryYear">Expiry Year</Label>
                  <Input
                    id="expiryYear"
                    type="text"
                    placeholder="YY"
                    value={cardData.expiryYear}
                    onChange={(e) => handleCardInputChange('expiryYear', e.target.value.replace(/\D/g, '').slice(0, 2))}
                    maxLength="2"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength="4"
                    required
                    className="pl-10"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(amount)} with Card
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Bank Transfer */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Bank Transfer</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Transfer directly from your bank account
            </p>
            <Button 
              onClick={handleCardPayment}
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

          {/* USSD */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Smartphone className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">USSD Payment</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Pay using USSD code on your mobile phone
            </p>
            <Button 
              onClick={handleCardPayment}
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
                  Pay with USSD
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
              <p>All payments are processed securely through Paystack. Your card details are never stored on our servers.</p>
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
