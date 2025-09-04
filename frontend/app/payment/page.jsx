"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import PaymentForm from "@/components/payment-form"
import { useRouter } from "next/navigation"

export default function PaymentPage({ searchParams }) {
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get selected program from localStorage
    const storedProgram = localStorage.getItem('selectedCourse')
    
    if (storedProgram) {
      try {
        const program = JSON.parse(storedProgram)
        setSelectedProgram(program)
      } catch (error) {
        console.error('Error parsing stored program:', error)
      }
    }
    
    setLoading(false)
  }, [])

  // If no program selected, redirect to home
  useEffect(() => {
    if (!loading && !selectedProgram) {
      router.push('/')
    }
  }, [loading, selectedProgram, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] to-[#e0e8ff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading program details...</p>
        </div>
      </div>
    )
  }

  if (!selectedProgram) {
    return null // Will redirect to home
  }

  const formatPrice = (price, currency) => {
    if (currency === "NGN") {
      return `₦${price.toLocaleString()}`
    } else if (currency === "USD") {
      return `$${price}`
    } else if (currency === "GBP") {
      return `£${price}`
    }
    return `${price} ${currency}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f4ff] to-[#e0e8ff] py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-lg p-8">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">
            Complete Your Enrollment
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            {selectedProgram.region} - {selectedProgram.category}
            {selectedProgram.subCategory && ` (${selectedProgram.subCategory.split("WITH ")[1]})`}
          </CardDescription>
        </CardHeader>
        
        {/* Program Summary */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Selected Program</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">{selectedProgram.region}</p>
              <p className="text-sm text-gray-600">{selectedProgram.category}</p>
              {selectedProgram.subCategory && (
                <p className="text-sm text-gray-600">{selectedProgram.subCategory.split("WITH ")[1]}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-800">
                {formatPrice(selectedProgram.price, selectedProgram.currency)}
              </p>
              <p className="text-sm text-gray-600">{selectedProgram.per}</p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-6">
          <PaymentForm 
            selectedProgram={selectedProgram}
            onPaymentSuccess={(paymentReference) => {
              // Redirect to registration with payment reference and program details
              router.push(`/register?payment_ref=${paymentReference}&program_id=${selectedProgram.id}`)
            }}
          />
          
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              After payment, you'll be redirected to complete your registration.
            </p>
            <Link 
              href="/" 
              className="text-[#4F46E5] hover:underline text-sm"
            >
              ← Back to Programs
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
