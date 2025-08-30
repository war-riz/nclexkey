"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Clock, RefreshCw } from "lucide-react"

export default function RateLimitMessage({ error, onRetry }) {
  const [timeLeft, setTimeLeft] = useState(error?.retryAfter || 0)

  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex flex-col space-y-3">
        <div>
          <strong>Rate limit exceeded</strong>
          <p className="text-sm mt-1">{error?.message}</p>
        </div>

        {timeLeft > 0 ? (
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-3 w-3" />
            <span>Try again in: {formatTime(timeLeft)}</span>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={onRetry} className="self-start bg-transparent">
            <RefreshCw className="h-3 w-3 mr-1" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
