"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import * as api from "@/lib/api"

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token")
      if (token) {
        try {
          const result = await api.getUserProfile()
          if (result.success) {
            setUser(result.data)
          } else {
            // Token might be invalid, clear it
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      const result = await api.login(credentials)
      if (result.success) {
        // Set user data from login response (includes role)
        setUser(result.data.user)
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
        return { success: true, user: result.data.user } // Return user data for redirection logic
      } else {
        return { success: false, error: result.error, requires2FA: result.requires2FA }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: { message: "An unexpected error occurred." } }
    }
  }

  const register = async (userData) => {
    try {
      const result = await api.register(userData)
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
        })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: { message: "An unexpected error occurred." } }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
      setUser(null)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Still clear user state even if API call fails
      setUser(null)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      router.push("/")
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const result = await api.updateProfile(profileData)
      if (result.success) {
        setUser(result.data)
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        })
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error("Profile update error:", error)
      return { success: false, error: { message: "An unexpected error occurred." } }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
