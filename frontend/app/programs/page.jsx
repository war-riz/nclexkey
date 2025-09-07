import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { OurCoursesSection } from "@/components/sections/our-courses-section"
import { HeroSection } from "@/components/sections/hero-section"

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        {/* Hero Section for Programs */}
        <section className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our Programs
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Comprehensive NCLEX preparation programs designed to help you succeed
            </p>
          </div>
        </section>

        {/* Programs Content */}
        <OurCoursesSection />
      </main>
      <Footer />
    </div>
  )
}
