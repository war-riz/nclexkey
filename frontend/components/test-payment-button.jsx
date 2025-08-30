"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function TestPaymentButton({ onSuccess, onError, amount = 30000, currency = 'NGN' }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleTestPayment = async () => {
    setLoading(true)
    
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
        toast({
          title: "Test Payment Successful!",
          description: `Reference: ${data.reference} - Amount: ${currency} ${amount.toLocaleString()}`,
          variant: "default",
        })
        
        if (onSuccess) {
          onSuccess(data.reference)
        }
      } else {
        throw new Error(data.message || 'Payment failed')
      }
    } catch (error) {
      console.error('Test payment error:', error)
      toast({
        title: "Test Payment Failed",
        description: error.message || "Payment could not be processed",
        variant: "destructive",
      })
      
      if (onError) {
        onError(error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleTestPayment}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      {loading ? "Processing Test Payment..." : "Test Payment (₦5,000)"}
    </Button>
  )
}





