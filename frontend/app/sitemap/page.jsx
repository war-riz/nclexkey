import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"

export default function SitemapPage() {
  const mainPages = [
    { name: "Home", url: "/" },
    { name: "About", url: "/about" },
    { name: "Programs", url: "/programs" },
    { name: "Services", url: "/services" },
    { name: "Contact", url: "/contact" },
  ]

  const authPages = [
    { name: "Login", url: "/login" },
    { name: "Register", url: "/register" },
    { name: "Forgot Password", url: "/forgot-password" },
    { name: "Verify Email", url: "/verify-email" },
    { name: "Resend Verification", url: "/resend-verification" },
  ]

  const dashboardPages = [
    { name: "Dashboard", url: "/dashboard" },
    { name: "Progress", url: "/dashboard/progress" },
    { name: "Messages", url: "/dashboard/messages" },
    { name: "Payments", url: "/dashboard/payments" },
    { name: "Settings", url: "/dashboard/settings" },
    { name: "Exam", url: "/dashboard/exam" },
  ]

  const legalPages = [
    { name: "FAQ", url: "/faq" },
    { name: "Privacy Policy", url: "/privacy-policy" },
    { name: "Terms of Service", url: "/terms-of-service" },
    { name: "Sitemap", url: "/sitemap" },
  ]

  const coursePages = [
    { name: "All Courses", url: "/courses" },
    { name: "Course Details", url: "/courses/[courseId]" },
    { name: "Course Enrollment", url: "/courses/[courseId]/enroll" },
    { name: "Course View", url: "/courses/[courseId]/view" },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Sitemap
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Find all pages and sections of our website
            </p>
          </div>
        </section>

        {/* Sitemap Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Main Pages */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Main Pages</h2>
                <ul className="space-y-2">
                  {mainPages.map((page, index) => (
                    <li key={index}>
                      <Link 
                        href={page.url} 
                        className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                      >
                        {page.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Authentication Pages */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication</h2>
                <ul className="space-y-2">
                  {authPages.map((page, index) => (
                    <li key={index}>
                      <Link 
                        href={page.url} 
                        className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                      >
                        {page.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dashboard Pages */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard</h2>
                <ul className="space-y-2">
                  {dashboardPages.map((page, index) => (
                    <li key={index}>
                      <Link 
                        href={page.url} 
                        className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                      >
                        {page.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Course Pages */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Courses</h2>
                <ul className="space-y-2">
                  {coursePages.map((page, index) => (
                    <li key={index}>
                      <Link 
                        href={page.url} 
                        className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                      >
                        {page.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Pages */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Legal & Support</h2>
                <ul className="space-y-2">
                  {legalPages.map((page, index) => (
                    <li key={index}>
                      <Link 
                        href={page.url} 
                        className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                      >
                        {page.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional Pages */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Additional</h2>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/admin" 
                      className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/payment" 
                      className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                    >
                      Payment
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/payment-status" 
                      className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                    >
                      Payment Status
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/test" 
                      className="text-[#4F46E5] hover:text-[#3b34b0] transition-colors"
                    >
                      Test Page
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Search Information */}
            <div className="mt-12 bg-gray-50 p-8 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Can't find what you're looking for?
              </h2>
              <p className="text-gray-600 mb-6">
                Use our search functionality or contact our support team for assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-[#4F46E5] text-white px-8 py-3 rounded-lg hover:bg-[#3b34b0] transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/faq"
                  className="border border-[#4F46E5] text-[#4F46E5] px-8 py-3 rounded-lg hover:bg-[#4F46E5] hover:text-white transition-colors"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
