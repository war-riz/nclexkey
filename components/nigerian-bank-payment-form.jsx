"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Info
} from 'lucide-react'
import { nigerianBankAPI, paymentAPI, paymentConfig } from '@/lib/api'

export default function NigerianBankPaymentForm({ 
  course, 
  amount, 
  currency = 'NGN',
  onSuccess, 
  onError,
  className = "",
  paymentType = 'course_enrollment',
  userData = null
}) {
  const [selectedMethod, setSelectedMethod] = useState('card')
  const [banks, setBanks] = useState([])
  const [paymentChannels, setPaymentChannels] = useState([])
  const [ussdCodes, setUssdCodes] = useState({})
  const [mobileMoneyProviders, setMobileMoneyProviders] = useState({})
  const [selectedBank, setSelectedBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [transferInstructions, setTransferInstructions] = useState(null)

  useEffect(() => {
    loadPaymentData()
  }, [])

  const loadPaymentData = async () => {
    try {
      console.log('Loading payment data...')
      
      // Load banks
      const banksResult = await nigerianBankAPI.getBanks()
      console.log('Banks result:', banksResult)
      if (banksResult.success) {
        setBanks(banksResult.data.banks || [])
        console.log('Banks loaded:', banksResult.data.banks)
      } else {
        console.error('Failed to load banks:', banksResult.error)
      }

      // Load payment channels
      const channelsResult = await nigerianBankAPI.getPaymentChannels()
      console.log('Channels result:', channelsResult)
      if (channelsResult.success) {
        setPaymentChannels(channelsResult.data.channels || [])
        console.log('Channels loaded:', channelsResult.data.channels)
      } else {
        console.error('Failed to load channels:', channelsResult.error)
      }

      // Load USSD codes
      const ussdResult = await nigerianBankAPI.getUssdCodes()
      console.log('USSD result:', ussdResult)
      if (ussdResult.success) {
        setUssdCodes(ussdResult.data.ussd_codes || {})
        console.log('USSD codes loaded:', ussdResult.data.ussd_codes)
      } else {
        console.error('Failed to load USSD codes:', ussdResult.error)
      }

      // Load mobile money providers
      const mobileResult = await nigerianBankAPI.getMobileMoneyProviders()
      console.log('Mobile result:', mobileResult)
      if (mobileResult.success) {
        setMobileMoneyProviders(mobileResult.data.mobile_money || {})
        console.log('Mobile money loaded:', mobileResult.data.mobile_money)
      } else {
        console.error('Failed to load mobile money:', mobileResult.error)
      }
    } catch (error) {
      console.error('Failed to load payment data:', error)
      setError('Failed to load payment options')
    }
  }

  const verifyBankAccount = async () => {
    if (!selectedBank || !accountNumber) {
      setError('Please select a bank and enter account number')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const result = await nigerianBankAPI.verifyBankAccount(accountNumber, selectedBank)
      
      if (result.success) {
        setAccountName(result.data.account_name)
        setSuccess('Account verified successfully')
      } else {
        setError(result.error?.message || 'Failed to verify account')
      }
    } catch (error) {
      setError('Failed to verify account')
    } finally {
      setIsVerifying(false)
    }
  }

  const getTransferInstructions = async () => {
    if (!selectedBank) {
      setError('Please select a bank first')
      return
    }

    try {
      const result = await nigerianBankAPI.getTransferInstructions(selectedBank, amount)
      
      if (result.success) {
        setTransferInstructions(result.data.instructions)
      } else {
        setError(result.error?.message || 'Failed to get transfer instructions')
      }
    } catch (error) {
      setError('Failed to get transfer instructions')
    }
  }

  const handleCardPayment = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // For student registration, use a special course ID
      const courseId = paymentType === 'student_registration' ? 'student-registration' : course.id
      
      const result = await paymentAPI.initializePayment(
        courseId, 
        'paystack', 
        paymentType, 
        userData, 
        amount, 
        currency
      )
      
      if (result.success) {
        // Redirect to Paystack payment page
        if (result.data.payment_url) {
          // Store payment reference for verification
          localStorage.setItem('pending_payment_reference', result.data.reference)
          if (paymentType === 'course_enrollment') {
            localStorage.setItem('pending_payment_course_id', course.id)
          } else {
            localStorage.setItem('pending_payment_type', 'student_registration')
          }
          
          // Redirect to payment gateway
          window.location.href = result.data.payment_url
        }
      } else {
        setError(result.error?.message || 'Failed to initialize payment')
      }
    } catch (error) {
      console.error('Payment initialization error:', error)
      setError('Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBankTransfer = async () => {
    if (!selectedBank || !accountNumber || !accountName) {
      setError('Please complete bank transfer details')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await paymentAPI.initializePayment(course.id, 'paystack', paymentType, userData)
      
      if (result.success) {
        setSuccess('Bank transfer initiated. Please complete the transfer using the provided instructions.')
        // Show transfer instructions
        await getTransferInstructions()
      } else {
        setError(result.error?.message || 'Failed to initiate bank transfer')
      }
    } catch (error) {
      setError('Failed to process bank transfer')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUSSD = async () => {
    if (!selectedBank) {
      setError('Please select a bank for USSD payment')
      return
    }

    const ussdCode = ussdCodes[selectedBank]
    if (!ussdCode) {
      setError('USSD code not available for selected bank')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const result = await paymentAPI.initializePayment(course.id, 'paystack', paymentType, userData)
      
      if (result.success) {
        setSuccess(`USSD payment initiated. Dial ${ussdCode} to complete payment.`)
      } else {
        setError(result.error?.message || 'Failed to initiate USSD payment')
      }
    } catch (error) {
      setError('Failed to process USSD payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />
      case 'bank': return <Building2 className="h-4 w-4" />
      case 'ussd': return <Smartphone className="h-4 w-4" />
      case 'mobile_money': return <Banknote className="h-4 w-4" />
      case 'qr': return <QrCode className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Nigerian Payment Methods
        </CardTitle>
        <CardDescription>
          Choose your preferred payment method to enroll in {course.title}
        </CardDescription>
      </CardHeader>
      
      {/* Debug Info */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Debug Info:</strong> Banks: {banks.length}, Channels: {paymentChannels.length}, USSD: {Object.keys(ussdCodes).length}
        </p>
      </div>

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
              {formatCurrency(amount)}
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
        <Tabs value={selectedMethod} onValueChange={setSelectedMethod}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank Transfer
            </TabsTrigger>
            <TabsTrigger value="ussd" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              USSD
            </TabsTrigger>
          </TabsList>

          {/* Card Payment */}
          <TabsContent value="card" className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Pay securely with your debit or credit card
              </p>
              <Button 
                onClick={handleCardPayment}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(amount)} with Card
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Bank Transfer */}
          <TabsContent value="bank" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="bank">Select Bank</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    maxLength={10}
                  />
                  <Button
                    onClick={verifyBankAccount}
                    disabled={!selectedBank || !accountNumber || isVerifying}
                    variant="outline"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </div>

              {accountName && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Account Name:</strong> {accountName}
                  </p>
                </div>
              )}

              <Button 
                onClick={handleBankTransfer}
                disabled={!selectedBank || !accountNumber || !accountName || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Initiate Bank Transfer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Transfer Instructions */}
            {transferInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Transfer Instructions for {transferInstructions.bank_name}
                </h4>
                <div className="space-y-2">
                  {transferInstructions.steps.map((step, index) => (
                    <p key={index} className="text-sm text-blue-800">
                      {step}
                    </p>
                  ))}
                </div>
                <p className="text-sm text-blue-600 mt-3 font-medium">
                  {transferInstructions.note}
                </p>
              </div>
            )}
          </TabsContent>

          {/* USSD Payment */}
          <TabsContent value="ussd" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ussdBank">Select Bank for USSD</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBank && ussdCodes[selectedBank] && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">USSD Code</span>
                  </div>
                  <p className="text-lg font-mono text-yellow-900">
                    {ussdCodes[selectedBank]}
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Dial this code on your phone to complete payment
                  </p>
                </div>
              )}

              <Button 
                onClick={handleUSSD}
                disabled={!selectedBank || isProcessing}
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
          </TabsContent>
        </Tabs>

        {/* Additional Payment Methods */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Other Payment Options</h4>
          <div className="grid grid-cols-2 gap-2">
            {paymentChannels
              .filter(channel => !['card', 'bank', 'ussd'].includes(channel.name))
              .map((channel) => (
                <Button
                  key={channel.name}
                  variant="outline"
                  className="justify-start"
                  onClick={() => setSelectedMethod(channel.name)}
                >
                  <span className="mr-2">{channel.icon}</span>
                  {channel.label}
                </Button>
              ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium">Secure Payment</p>
              <p>All payments are processed securely through Paystack. Your card details are never stored on our servers.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
