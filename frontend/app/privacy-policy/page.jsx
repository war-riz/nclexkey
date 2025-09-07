import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            <p className="text-sm opacity-90">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              <p className="text-gray-600 mb-6">
                We collect information you provide directly to us, such as when you create an account, 
                enroll in courses, or contact us for support. This may include your name, email address, 
                phone number, payment information, and academic records.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 mb-6">
                We use the information we collect to provide, maintain, and improve our services, 
                process payments, communicate with you, and personalize your learning experience.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
              <p className="text-gray-600 mb-6">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy or as required by law.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-600 mb-6">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 mb-6">
                We use cookies and similar tracking technologies to enhance your experience on our platform, 
                analyze usage patterns, and provide personalized content.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-600 mb-6">
                You have the right to access, update, or delete your personal information. You may also 
                opt out of certain communications from us at any time.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 mb-6">
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the "Last updated" date.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-600">
                  <strong>Email:</strong> privacy@nclexkeys.com<br />
                  <strong>Address:</strong> NCLEX Keys, Lagos, Nigeria<br />
                  <strong>Phone:</strong> +234-xxx-xxx-xxxx
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
