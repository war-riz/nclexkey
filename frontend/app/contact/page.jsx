import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ContactUsSection } from "@/components/sections/contact-us-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        {/* Hero Section for Contact */}
        <section className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Get in touch with our team for support, questions, or enrollment information
            </p>
          </div>
        </section>

        {/* Contact Information Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Email Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">support@nclexkeys.com</p>
                  <p className="text-sm text-gray-500 mt-2">We'll respond within 24 hours</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Call Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">+234-xxx-xxx-xxxx</p>
                  <p className="text-sm text-gray-500 mt-2">Mon-Fri 9AM-6PM WAT</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Visit Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Lagos, Nigeria</p>
                  <p className="text-sm text-gray-500 mt-2">Virtual consultations available</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle>Live Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Available 24/7</p>
                  <p className="text-sm text-gray-500 mt-2">Instant support</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <ContactUsSection />
      </main>
      <Footer />
    </div>
  )
}
