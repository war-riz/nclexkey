"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Mail, Phone, Lock, Eye, EyeOff, GraduationCap, CreditCard, CheckCircle } from "lucide-react"
import RateLimitMessage from "@/components/RateLimitMessage"
import PaystackPaymentForm from "@/components/paystack-payment-form"

export default function RegisterClientPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentData, setPaymentData] = useState(null)
  const router = useRouter()
  const { register } = useAuth()
  const { toast } = useToast()

  // Student registration fee - will be overridden by selected program
  const [registrationFee, setRegistrationFee] = useState(30000) // Default: 30,000 NGN
  const [registrationCurrency, setRegistrationCurrency] = useState('NGN')

  // State for selected program
  const [selectedProgram, setSelectedProgram] = useState(null)

  // Check for selected program and payment reference in URL
  useEffect(() => {
    // Get selected program from localStorage
    const storedProgram = localStorage.getItem('selectedCourse')
    if (storedProgram) {
      try {
        const program = JSON.parse(storedProgram)
        setSelectedProgram(program)
        
        // Update registration fee based on selected program
        if (program.price) {
          setRegistrationFee(program.price)
          setRegistrationCurrency(program.currency)
        }
        
        console.log('Selected program loaded:', program)
      } catch (error) {
        console.error('Error parsing stored program:', error)
      }
    }
    
    // Check for payment reference in URL (when returning from payment status page)
    const urlParams = new URLSearchParams(window.location.search)
    const paymentRef = urlParams.get('payment_ref')
    
    if (paymentRef) {
      // User is returning from payment status page with a payment reference
      setPaymentReference(paymentRef)
      setPaymentSuccess(true)
      setPaymentData({
        reference: paymentRef,
        amount: selectedProgram?.price || registrationFee,
        currency: selectedProgram?.currency || registrationCurrency,
        status: 'completed'
      })
      
      toast({
        title: "Payment Reference Found",
        description: "Payment reference detected. You can now complete your registration.",
        variant: "default",
      })
    }
  }, [])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePaymentSuccess = (reference, paymentInfo) => {
    setPaymentSuccess(true)
    setPaymentReference(reference)
    setPaymentData(paymentInfo)
    toast({
      title: "Payment Successful! 🎉",
      description: "Your payment has been processed. Now creating your account...",
      variant: "default",
    })
  }

  const handlePaymentError = (error) => {
    toast({
      title: "Payment Failed",
      description: error.message || "Payment could not be processed. Please try again.",
      variant: "destructive",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Debug: Log the current state
    console.log('Registration attempt - Current state:', {
      paymentSuccess,
      paymentReference,
      selectedProgram,
      formData: { email: formData.email, fullName: formData.fullName }
    })

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError({ message: "Passwords do not match." })
      setLoading(false)
      toast({
        title: "Registration Failed",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    // Check if payment is completed
    if (!paymentSuccess || !paymentReference) {
      const errorMsg = !paymentSuccess 
        ? "Please complete payment before registration." 
        : "Payment reference is missing. Please complete payment first."
      
      setError({ message: errorMsg })
      setLoading(false)
      
      toast({
        title: "Payment Required",
        description: errorMsg,
        variant: "destructive",
      })
      
      // Debug: Show what's missing
      console.log('Payment validation failed:', {
        paymentSuccess,
        paymentReference: paymentReference || 'MISSING',
        selectedProgram: selectedProgram?.id || 'NOT SELECTED'
      })
      
      return
    }

    // Add payment reference to registration data
    const registrationData = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      role: "student", // Always student
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      paymentReference: paymentReference,
      paymentData: paymentData
    }

    console.log('Sending registration data:', registrationData)

    try {
      const result = await register(registrationData)

      if (result.success) {
        toast({
          title: "Registration Successful! 🎉",
          description: "Your account has been created and payment confirmed. You can now login to access your dashboard.",
          variant: "default",
        })
        router.push("/login")
      } else {
        if (result.error?.isRateLimited) {
          setError(result.error)
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many registration attempts. Please try again later.",
            variant: "destructive",
          })
        } else {
          setError(result.error)
          toast({
            title: "Registration Failed",
            description: result.error?.message || "Registration failed. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      setError({ message: "An unexpected error occurred. Please try again." })
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
    
    setLoading(false)
  }

  const handleRetry = () => {
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Student Registration
          </CardTitle>
          <CardDescription>
            {selectedProgram 
              ? `Join NCLEX Keys - ${selectedProgram.region} Program` 
              : 'Join NCLEX Keys and get access to all courses with one payment'
            }
          </CardDescription>
          
          {!selectedProgram && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> Select a program from the home page to see specific pricing and features.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Payment Status Indicator */}
          <div className="mb-6 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">Payment Status</h4>
                <p className="text-sm text-gray-600">
                  {paymentSuccess 
                    ? `Payment completed (${paymentReference})` 
                    : 'Payment required before registration'
                  }
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                paymentSuccess 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {paymentSuccess ? '✅ Paid' : '⚠️ Pending'}
              </div>
            </div>
            
            {selectedProgram && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected Program:</strong> {selectedProgram.region} - {selectedProgram.category}
                  {selectedProgram.subCategory && ` (${selectedProgram.subCategory.split("WITH ")[1]})`}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Amount:</strong> {selectedProgram.currency === 'NGN' ? '₦' : selectedProgram.currency === 'USD' ? '$' : selectedProgram.currency === 'GBP' ? '£' : ''}
                  {selectedProgram.price.toLocaleString()} {selectedProgram.currency} {selectedProgram.per}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  {selectedProgram ? `${selectedProgram.region} Program Payment` : 'Platform Access Payment'}
                </h3>
              </div>
              
              {selectedProgram && (
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-800 mb-2">Selected Program:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Region:</strong> {selectedProgram.region}</p>
                    <p><strong>Category:</strong> {selectedProgram.category}</p>
                    {selectedProgram.subCategory && (
                      <p><strong>Type:</strong> {selectedProgram.subCategory.split("WITH ")[1]}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mb-4 p-3 bg-white rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-2">
                  What you get:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  <li>✅ Access to ALL NCLEX preparation courses</li>
                  <li>✅ Comprehensive study materials</li>
                  <li>✅ Practice exams and assessments</li>
                  <li>✅ Progress tracking and analytics</li>
                  <li>✅ Certificate upon completion</li>
                  <li>✅ Lifetime platform access</li>
                </ul>
                <p className="text-lg font-bold text-blue-600">
                  {selectedProgram?.currency === 'NGN' ? '₦' : selectedProgram?.currency === 'USD' ? '$' : selectedProgram?.currency === 'GBP' ? '£' : ''}
                  {selectedProgram?.price || registrationFee.toLocaleString()} {selectedProgram?.currency || registrationCurrency}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedProgram ? `${selectedProgram.per} for full platform access` : 'One-time payment for full platform access'}
                </p>
              </div>
              
              {!paymentSuccess ? (
                <div>
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ Payment Required: You must complete payment before creating your account.
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Complete this one-time payment to access the entire NCLEX Keys platform.
                  </p>
                  
                  <div className="space-y-4">
                    <PaystackPaymentForm
                      course={{
                        id: selectedProgram?.id || 'student-registration',
                        title: selectedProgram ? `${selectedProgram.region} Program` : 'NCLEX Keys Platform Access',
                        price: selectedProgram?.price || registrationFee
                      }}
                      amount={selectedProgram?.price || registrationFee}
                      currency={selectedProgram?.currency || registrationCurrency}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      className="mb-4"
                      paymentType="student_registration"
                      userData={{
                        email: formData.email,
                        full_name: formData.fullName,
                        phone_number: formData.phoneNumber
                      }}
                      selectedProgram={selectedProgram}
                    />
                  </div>
                </div>
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Payment successful! Reference: {paymentReference}
                    </AlertDescription>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    You can now create your account below.
                  </p>
                </Alert>
              )}
            </div>

            {error && <RateLimitMessage error={error} />}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !paymentSuccess}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : !paymentSuccess ? (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Complete Payment First
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
