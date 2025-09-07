import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { OurServicesSection } from "@/components/sections/our-services-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Users, BookOpen, Headphones, Clock, Award } from "lucide-react"

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        {/* Hero Section for Services */}
        <section className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Comprehensive support services to ensure your NCLEX success
            </p>
          </div>
        </section>

        {/* Services Content */}
        <OurServicesSection />

        {/* Additional Services */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Additional Support Services
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Beyond our core programs, we offer specialized services to support your journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Study Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Join peer study groups for collaborative learning and motivation
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Headphones className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>24/7 Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Round-the-clock academic and technical support when you need it
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Flexible Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Study at your own pace with flexible scheduling options
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Resource Library</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Access to extensive study materials, practice tests, and resources
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle>Certification Prep</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Specialized preparation for various nursing certifications
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle>Progress Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Detailed progress tracking and performance analytics
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
