"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext" // Import useAuth
import RateLimitMessage from "@/components/RateLimitMessage" // Import RateLimitMessage
import { useRouter } from "next/navigation" // Import useRouter
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react" // Import icons

export default function ClientLoginPage() {
  const router = useRouter()
  const { login, user } = useAuth() // Use login and user from AuthContext
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState("")
  const [rateLimitError, setRateLimitError] = useState(null)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState("")
  const [backupCode, setBackupCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsPending(true)
    setMessage("")
    setRateLimitError(null)
    setRequires2FA(false)

    const result = await login({ email, password, twoFactorToken, backupCode })

    if (result.success) {
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      })
      // Redirect based on user role from the login result
      if (result.user?.role === "super_admin") {
        router.push("/superadmin") // Superadmin dashboard
      } else if (result.user?.role === "instructor") {
        router.push("/admin") // Instructor dashboard
      } else {
        // Default for student or other roles
        router.push("/dashboard")
      }
    } else if (result.requires2FA) {
      setRequires2FA(true)
      setMessage("Two-factor authentication required. Please enter your 2FA token or backup code.")
      toast({
        title: "2FA Required",
        description: "Please enter your 2FA token or backup code.",
        variant: "default",
      })
    } else if (result.error?.isRateLimited) {
      setRateLimitError(result.error)
      toast({
        title: "Rate Limit Exceeded",
        description: result.error.message,
        variant: "destructive",
      })
    } else if (result.error?.isLocked) {
      setMessage(result.error.message)
      toast({
        title: "Account Locked",
        description: result.error.message,
        variant: "destructive",
      })
    } else {
      setMessage(result.error?.message || "Login failed. Please check your credentials.")
      toast({
        title: "Login Failed",
        description: result.error?.message || "Invalid email or password.",
        variant: "destructive",
      })
    }
    setIsPending(false)
  }

  const handleRetry = () => {
    setRateLimitError(null)
    // Optionally re-enable form fields or trigger login attempt again
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">Access your NCLEX Prep account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    disabled={isPending || requires2FA}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="********"
                    required
                    disabled={isPending || requires2FA}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {requires2FA && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorToken">2FA Token</Label>
                    <Input
                      id="twoFactorToken"
                      type="text"
                      name="twoFactorToken"
                      placeholder="Enter 2FA code"
                      required
                      disabled={isPending}
                      value={twoFactorToken}
                      onChange={(e) => setTwoFactorToken(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupCode">Backup Code (Optional)</Label>
                    <Input
                      id="backupCode"
                      type="text"
                      name="backupCode"
                      placeholder="Enter backup code"
                      disabled={isPending}
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full h-11" disabled={isPending || rateLimitError}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            {message && (
              <p
                className={`mt-4 text-center text-sm ${message.includes("failed") || message.includes("Locked") ? "text-red-500" : "text-green-500"}`}
              >
                {message}
              </p>
            )}
            {rateLimitError && <RateLimitMessage error={rateLimitError} onRetry={handleRetry} />}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register Now
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              <Link href="/forgot-password" className="text-primary hover:underline font-medium">
                Forgot Password?
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
