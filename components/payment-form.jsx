"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Shield, CheckCircle, XCircle } from 'lucide-react'
import { paymentAPI } from '@/lib/api'

export default function PaymentForm({ course, onPaymentSuccess, onPaymentError, onCancel }) {
  const [gateways, setGateways] = useState([])
  const [selectedGateway, setSelectedGateway] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState('')
  const [paymentUrl, setPaymentUrl] = useState('')
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    loadPaymentGateways()
  }, [])

  const loadPaymentGateways = async () => {
    try {
      setIsLoading(true)
      const result = await paymentAPI.getPaymentGateways()
      
      if (result.success) {
        setGateways(result.data.gateways)
        // Set default gateway
        const defaultGateway = result.data.gateways.find(g => g.is_default) || result.data.gateways[0]
        if (defaultGateway) {
          setSelectedGateway(defaultGateway.name)
        }
      } else {
        setError('Failed to load payment gateways')
      }
    } catch (err) {
      setError('Failed to load payment gateways')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitializePayment = async () => {
    if (!selectedGateway) {
      setError('Please select a payment gateway')
      return
    }

    try {
      setIsInitializing(true)
      setError('')

      const result = await paymentAPI.initializePayment(course.id, selectedGateway)
      
      if (result.success) {
        setPaymentUrl(result.data.payment_url)
        setPaymentReference(result.data.reference)
        
        // Redirect to payment gateway
        if (result.data.payment_url) {
          // Store payment reference for verification
          localStorage.setItem('pending_payment_reference', result.data.reference)
          localStorage.setItem('pending_payment_course_id', course.id)
          
          // Redirect to payment gateway
          window.location.href = result.data.payment_url
        }
      } else {
        setError(result.error?.message || 'Failed to initialize payment')
        onPaymentError?.(result.error)
      }
    } catch (err) {
      setError('Failed to initialize payment')
      onPaymentError?.({ message: 'Network error occurred' })
    } finally {
      setIsInitializing(false)
    }
  }

  const handleVerifyPayment = async () => {
    if (!paymentReference) return

    try {
      setIsLoading(true)
      const result = await paymentAPI.verifyPayment(paymentReference)
      
      if (result.success) {
        onPaymentSuccess?.(result.data)
      } else {
        setError(result.error?.message || 'Payment verification failed')
        onPaymentError?.(result.error)
      }
    } catch (err) {
      setError('Failed to verify payment')
      onPaymentError?.({ message: 'Network error occurred' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount, currency = 'NGN') => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    })
    return formatter.format(amount)
  }

  const getGatewayIcon = (gatewayName) => {
    switch (gatewayName.toLowerCase()) {
      case 'paystack':
        return '💳'
      case 'flutterwave':
        return '🌊'
      case 'stripe':
        return '💳'
      default:
        return '💳'
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading payment options...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method to enroll in this course
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Course Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Course Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Course:</span>
                <span className="font-medium">{course.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(course.price, course.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={selectedGateway} onValueChange={setSelectedGateway}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {gateways.map((gateway) => (
                  <SelectItem key={gateway.name} value={gateway.name}>
                    <div className="flex items-center gap-2">
                      <span>{getGatewayIcon(gateway.name)}</span>
                      <span>{gateway.display_name}</span>
                      {gateway.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gateway Information */}
          {selectedGateway && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">
                    {gateways.find(g => g.name === selectedGateway)?.display_name}
                  </p>
                  <p className="text-blue-700">
                    Secure payment processing with bank-level encryption
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isInitializing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInitializePayment}
              disabled={!selectedGateway || isInitializing}
              className="flex-1"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(course.price, course.currency)}
                </>
              )}
            </Button>
          </div>

          {/* Payment Verification */}
          {paymentReference && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">
                  Payment Reference: {paymentReference}
                </span>
              </div>
              <p className="text-xs text-yellow-700 mb-2">
                If you were redirected back without completing payment, click below to verify:
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyPayment}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Verifying...
                  </>
                ) : (
                  'Verify Payment'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Secure Payment</p>
              <p>
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
