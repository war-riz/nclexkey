import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  const faqs = [
    {
      question: "What is NCLEX and why do I need preparation?",
      answer: "The NCLEX (National Council Licensure Examination) is a standardized exam that nursing graduates must pass to obtain their nursing license. Our preparation program helps you understand the exam format, practice with realistic questions, and build confidence for success."
    },
    {
      question: "How long does the NCLEX preparation program take?",
      answer: "Our programs are designed to be flexible. The standard program is 12 weeks, but you can complete it at your own pace. We also offer intensive 6-week programs for those with limited time."
    },
    {
      question: "What study materials are included?",
      answer: "You'll have access to comprehensive study guides, practice tests, video lectures, interactive quizzes, flashcards, and one-on-one tutoring sessions. All materials are updated regularly to reflect the latest NCLEX format."
    },
    {
      question: "Do you offer one-on-one tutoring?",
      answer: "Yes! We provide personalized one-on-one tutoring sessions with experienced nursing educators. These sessions can be scheduled based on your availability and specific learning needs."
    },
    {
      question: "What is your success rate?",
      answer: "Our students have a 95% first-time pass rate on the NCLEX exam. We're proud of our track record and continuously work to improve our programs based on student feedback and exam updates."
    },
    {
      question: "Can I access the program on mobile devices?",
      answer: "Absolutely! Our platform is fully responsive and works on all devices - desktop, tablet, and mobile. You can study anywhere, anytime with our mobile-friendly interface."
    },
    {
      question: "What if I don't pass on my first attempt?",
      answer: "If you don't pass on your first attempt, we offer free retake support including additional practice materials and tutoring sessions to help you succeed on your next attempt."
    },
    {
      question: "How much does the program cost?",
      answer: "Our programs start at $299 for the basic package. We offer various pricing tiers to fit different budgets and needs. Contact us for detailed pricing information and any current promotions."
    },
    {
      question: "Do you offer payment plans?",
      answer: "Yes, we offer flexible payment plans to make our programs accessible. You can pay in monthly installments or choose from our various payment options."
    },
    {
      question: "How do I get started?",
      answer: "Getting started is easy! Simply register for an account, choose your program, and begin your NCLEX preparation journey. Our team is here to support you every step of the way."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Find answers to common questions about our NCLEX preparation programs
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our support team is here to help. Contact us for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-[#4F46E5] text-white px-8 py-3 rounded-lg hover:bg-[#3b34b0] transition-colors"
              >
                Contact Us
              </a>
              <a
                href="tel:+2347037367480"
                className="border border-[#4F46E5] text-[#4F46E5] px-8 py-3 rounded-lg hover:bg-[#4F46E5] hover:text-white transition-colors"
              >
                Call Us: +234 703 736 7480
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
