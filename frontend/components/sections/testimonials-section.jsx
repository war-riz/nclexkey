import { Star, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      name: "Aisha M.",
      location: "Lagos, Nigeria",
      quote:
        "NCLEX Prep was instrumental in my success! The pre-recorded videos were clear and concise, and the practice questions truly prepared me for the exam. Highly recommend!",
      rating: 5,
    },
    {
      id: 2,
      name: "Chidi O.",
      location: "Accra, Ghana",
      quote:
        "The tutors are incredibly knowledgeable and supportive. I loved the flexibility of learning at my own pace. Passed my NCLEX on the first attempt thanks to this platform!",
      rating: 5,
    },
    {
      id: 3,
      name: "Fatima A.",
      location: "Abuja, Nigeria",
      quote:
        "I struggled with pharmacology, but the masterclass here made it so much easier to understand. The detailed explanations and examples were a game-changer.",
      rating: 4,
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12 animate-fade-in-up">What Our Students Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="p-6 flex flex-col items-center text-center rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 animate-fade-in-up"
            >
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center mb-4 border-2 border-[#4F46E5]/20">
                <User className="h-10 w-10 text-gray-500" />
              </div>
              <CardContent className="flex-grow p-0">
                <p className="text-base italic text-gray-700 mb-4">"{testimonial.quote}"</p>
                <div className="flex justify-center mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="font-semibold text-gray-800 text-lg">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
