import { AboutSchoolSection } from "@/components/sections/about-school-section"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-dots-pattern"></div>
          </div>
          
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              About{" "}
              <span className="text-yellow-300">NCLEX Prep</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Your dedicated partner in achieving NCLEX success through personalized learning, 
              expert guidance, and proven strategies.
            </p>
          </div>
        </section>

        {/* Enhanced About Section */}
        <AboutSchoolSection />

        {/* Mission Statement */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Our Mission
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              To empower aspiring nurses with the knowledge, confidence, and skills needed to pass the NCLEX 
              examination and embark on successful nursing careers. We believe that every student deserves 
              personalized attention and the highest quality education to achieve their dreams.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
