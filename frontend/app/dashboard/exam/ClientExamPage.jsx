"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  BookOpen, 
  Target, 
  Clock, 
  Users,
  Globe,
  ExternalLink,
  Star,
  TrendingUp
} from "lucide-react"

export default function ClientExamPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [verificationComplete, setVerificationComplete] = useState(false)

  // External NCLEX Resources
  const nclexResources = [
    {
      id: "speedexam",
      name: "SpeedExam NCLEX Practice",
      description: "Comprehensive NCLEX practice tests with real-time scoring",
      url: "https://candidate.speedexam.net/openquiz.aspx?quiz=68A6BFA31A094327AA1ABD93DD8250DF",
      difficulty: "All Levels",
      questions: "1000+",
      rating: 4.8,
      features: ["Real-time scoring", "Detailed explanations", "Progress tracking"]
    },
    {
      id: "uworld",
      name: "UWorld NCLEX-RN",
      description: "Premium NCLEX preparation with detailed rationales",
      url: "https://www.uworld.com/nclex-rn",
      difficulty: "Advanced",
      questions: "2000+",
      rating: 4.9,
      features: ["Detailed rationales", "Performance analytics", "Custom tests"]
    },
    {
      id: "kaplan",
      name: "Kaplan NCLEX Prep",
      description: "Structured NCLEX preparation with adaptive learning",
      url: "https://www.kaptest.com/nclex",
      difficulty: "Intermediate",
      questions: "1500+",
      rating: 4.7,
      features: ["Adaptive learning", "Video explanations", "Study plans"]
    },
    {
      id: "ncsbn",
      name: "NCSBN Learning Extension",
      description: "Official NCLEX practice from the National Council",
      url: "https://learningext.com/",
      difficulty: "Official",
      questions: "500+",
      rating: 4.9,
      features: ["Official questions", "NCLEX format", "Reliable content"]
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerifying(false)
      setVerificationComplete(true)
    }, 2000) // Reduced to 2 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleProceedToExam = (resource) => {
    window.open(resource.url, "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4ff] to-[#e0e8ff] py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            NCLEX Exam Preparation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access premium NCLEX practice tests, past questions, and comprehensive study materials 
            to prepare for your nursing licensure exam.
          </p>
        </div>

        {/* Verification Status */}
        {!verificationComplete && (
          <Card className="max-w-md mx-auto mb-8 shadow-lg">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Verifying Access</h3>
              <p className="text-gray-600">Preparing your exam resources...</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {verificationComplete && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="text-center p-4">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">5000+</div>
                <div className="text-sm text-gray-600">Practice Questions</div>
              </Card>
              <Card className="text-center p-4">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">24/7</div>
                <div className="text-sm text-gray-600">Access Available</div>
              </Card>
              <Card className="text-center p-4">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">10K+</div>
                <div className="text-sm text-gray-600">Students Passed</div>
              </Card>
              <Card className="text-center p-4">
                <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">95%</div>
                <div className="text-sm text-gray-600">Pass Rate</div>
              </Card>
            </div>

            {/* External Resources */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Premium NCLEX Practice Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nclexResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-800">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="text-gray-600 mt-1">
                            {resource.description}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {resource.difficulty}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Questions:</span>
                          <span className="font-medium">{resource.questions}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{resource.rating}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium text-gray-700">Features:</span>
                          <div className="flex flex-wrap gap-1">
                            {resource.features.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleProceedToExam(resource)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Access {resource.name}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Study Tips */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-green-600" />
                  NCLEX Study Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">Before the Exam</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Take at least 3-5 full-length practice tests</li>
                      <li>• Review rationales for all questions, especially wrong ones</li>
                      <li>• Focus on your weakest areas</li>
                      <li>• Practice time management</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">During the Exam</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Read questions carefully and completely</li>
                      <li>• Use the process of elimination</li>
                      <li>• Trust your nursing knowledge</li>
                      <li>• Take breaks when needed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="text-center">
              <Button asChild variant="outline" className="mr-4">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Link>
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/dashboard/progress">
                  <TrendingUp className="h-4 w-4 mr-2" /> View Progress
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
