import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Please read these terms carefully before using our services.
            </p>
            <p className="text-sm opacity-90">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
              <p className="text-gray-600 mb-6">
                By accessing and using NCLEX Keys services, you accept and agree to be bound by the 
                terms and provision of this agreement.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Use License</h2>
              <p className="text-gray-600 mb-6">
                Permission is granted to temporarily download one copy of the materials on NCLEX Keys 
                for personal, non-commercial transitory viewing only. This is the grant of a license, 
                not a transfer of title.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts</h2>
              <p className="text-gray-600 mb-6">
                You are responsible for maintaining the confidentiality of your account and password. 
                You agree to accept responsibility for all activities that occur under your account.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Terms</h2>
              <p className="text-gray-600 mb-6">
                All fees are non-refundable unless otherwise stated. Payment is required before access 
                to course materials is granted. We reserve the right to change our pricing at any time.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-600 mb-6">
                All content, materials, and intellectual property on our platform are owned by NCLEX Keys 
                or our licensors. You may not reproduce, distribute, or create derivative works without permission.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Uses</h2>
              <p className="text-gray-600 mb-6">
                You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts. 
                You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
              <p className="text-gray-600 mb-6">
                The materials on NCLEX Keys are provided on an 'as is' basis. NCLEX Keys makes no warranties, 
                expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
                implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
                of intellectual property or other violation of rights.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitations</h2>
              <p className="text-gray-600 mb-6">
                In no event shall NCLEX Keys or its suppliers be liable for any damages (including, without limitation, 
                damages for loss of data or profit, or due to business interruption) arising out of the use or inability 
                to use the materials on NCLEX Keys.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-600 mb-6">
                These terms and conditions are governed by and construed in accordance with the laws of Nigeria 
                and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-600">
                  <strong>Email:</strong> legal@nclexkeys.com<br />
                  <strong>Address:</strong> NCLEX Keys, Ikorodu, Lagos, Nigeria<br />
                  <strong>Phone:</strong> +234 703 736 7480
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
