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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, Mail, Phone, UserCheck, Lock, Eye, EyeOff, GraduationCap, BookOpen, CreditCard, Bank, Smartphone } from "lucide-react"
import RateLimitMessage from "@/components/RateLimitMessage"
import PaystackPaymentForm from "@/components/paystack-payment-form"

export default function RegisterClientPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentReference, setPaymentReference] = useState("")
  const router = useRouter()
  const { register } = useAuth()
  const { toast } = useToast()

  // Get selected course from localStorage or use default
  const [selectedCourse, setSelectedCourse] = useState(null)
  
  useEffect(() => {
    const storedCourse = localStorage.getItem('selectedCourse')
    if (storedCourse) {
      try {
        setSelectedCourse(JSON.parse(storedCourse))
      } catch (error) {
        console.error('Error parsing stored course:', error)
      }
    }
  }, [])

  // Student registration fee based on selected course
  const getRegistrationFee = () => {
    if (selectedCourse) {
      return selectedCourse.price
    }
    // Default fee if no course selected
    return 30000 // 30,000 NGN for Nigeria
  }

  const getRegistrationCurrency = () => {
    if (selectedCourse) {
      return selectedCourse.currency
    }
    return 'NGN'
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    
    // Show payment section when student role is selected
    if (field === 'role' && value === 'student') {
      setShowPayment(true)
    } else if (field === 'role' && value !== 'student') {
      setShowPayment(false)
      setPaymentSuccess(false)
      setPaymentReference("")
    }
  }

  const handlePaymentSuccess = (reference) => {
    setPaymentSuccess(true)
    setPaymentReference(reference)
    toast({
      title: "Payment Successful!",
      description: "Your payment has been processed. Creating your account...",
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

    if (!formData.role) {
      setError({ message: "Please select a role." })
      setLoading(false)
      toast({
        title: "Registration Failed",
        description: "Please select a role.",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 8) {
      setError({ message: "Password must be at least 8 characters long." })
      setLoading(false)
      toast({
        title: "Registration Failed",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    // For students, require payment before registration
    if (formData.role === 'student' && !paymentSuccess) {
      setError({ message: "Please complete payment before registration." })
      setLoading(false)
      toast({
        title: "Payment Required",
        description: "Please complete payment before registration.",
        variant: "destructive",
      })
      return
    }

    // Add payment reference to registration data for students
    const registrationData = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      role: formData.role,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    }

    // Add payment reference for students
    if (formData.role === 'student' && paymentReference) {
      registrationData.paymentReference = paymentReference
    }

    const result = await register(registrationData)

    if (result.success) {
      toast({
        title: "Registration Successful!",
        description: formData.role === 'student' 
          ? "Your account has been created and payment confirmed. Please check your email to verify your account."
          : "Please check your email to verify your account.",
        variant: "default",
      })
      router.push("/login")
    } else {
      if (result.error.isRateLimited) {
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
          description: result.error.message || "Registration failed. Please try again.",
          variant: "destructive",
        })
      }
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
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Your Account
          </CardTitle>
          <CardDescription>
            Join NCLEX Keys and start your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  I want to join as
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Student - Learn NCLEX
                      </div>
                    </SelectItem>
                    <SelectItem value="instructor">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Instructor - Teach NCLEX
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Create a strong password"
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
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
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

            {/* Payment Section for Students */}
            {showPayment && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Course Enrollment Payment</h3>
                </div>
                
                {selectedCourse && (
                  <div className="mb-4 p-3 bg-white rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Selected Program: {selectedCourse.region} - {selectedCourse.category}
                      {selectedCourse.subCategory && ` (${selectedCourse.subCategory.split("WITH ")[1]})`}
                    </h4>
                    <p className="text-lg font-bold text-blue-600">
                      {getRegistrationCurrency() === 'NGN' ? '₦' : getRegistrationCurrency() === 'USD' ? '$' : '£'}
                      {getRegistrationFee().toLocaleString()} {getRegistrationCurrency()} {selectedCourse.per}
                    </p>
                  </div>
                )}
                
                {!paymentSuccess ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Course enrollment requires a one-time payment of{' '}
                      <strong>
                        {getRegistrationCurrency() === 'NGN' ? '₦' : getRegistrationCurrency() === 'USD' ? '$' : '£'}
                        {getRegistrationFee().toLocaleString()} {getRegistrationCurrency()}
                      </strong>{' '}
                      to access all course materials and features.
                    </p>
                    
                                        <div className="space-y-4">
                      <PaystackPaymentForm
                        course={{
                          id: selectedCourse?.id || 'student-registration',
                          title: selectedCourse ? `${selectedCourse.region} - ${selectedCourse.category}` : 'Student Registration',
                          price: getRegistrationFee()
                        }}
                        amount={getRegistrationFee()}
                        currency={getRegistrationCurrency()}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        className="mb-4"
                        paymentType="course_enrollment"
                        userData={{
                          email: formData.email,
                          full_name: formData.fullName,
                          phone_number: formData.phoneNumber
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      ✅ Payment successful! Reference: {paymentReference}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Instructor Notice */}
            {formData.role === 'instructor' && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <strong>Instructor Registration:</strong> Your account will be reviewed by our team. 
                  You'll receive an email once approved. No payment required.
                </AlertDescription>
              </Alert>
            )}

            {error && <RateLimitMessage error={error} />}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (formData.role === 'student' && !paymentSuccess)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {formData.role === 'student' ? 'Processing Payment...' : 'Creating Account...'}
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
