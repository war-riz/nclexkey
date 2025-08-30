"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function OurCoursesSection() {
  const [selectedCourse, setSelectedCourse] = useState(null)

  const pricingData = [
    {
      id: "exclusive-nigeria",
      category: "EXCLUSIVE",
      region: "NIGERIA",
      price: 30000,
      currency: "NGN",
      per: "PER MONTH",
      features: [
        "Personalized Guidance and Support",
        "Exclusive Online Groups (WhatsApp & Telegram)",
        "Daily Learning and Q&A",
        "Live Teaching Sessions (9 Hours a Week)",
        "Customized Study Plans and Timetables",
        "Weekly Contact Hours (4 Hours) with Seasoned Tutors",
        "Daily UWorld Questions",
        "Unlimited Access to Tutors and Resources"
      ]
    },
    {
      id: "exclusive-african",
      category: "EXCLUSIVE",
      region: "AFRICAN",
      price: 35000,
      currency: "NGN",
      per: "PER MONTH",
      features: [
        "Personalized Guidance and Support",
        "Exclusive Online Groups (WhatsApp & Telegram)",
        "Daily Learning and Q&A",
        "Live Teaching Sessions (9 Hours a Week)",
        "Customized Study Plans and Timetables",
        "Weekly Contact Hours (4 Hours) with Seasoned Tutors",
        "Daily UWorld Questions",
        "Unlimited Access to Tutors and Resources"
      ]
    },
    {
      id: "exclusive-usa-canada",
      category: "EXCLUSIVE",
      region: "USA/CANADA",
      price: 60,
      currency: "USD",
      per: "PER MONTH",
      features: [
        "Personalized Guidance and Support",
        "Exclusive Online Groups (WhatsApp & Telegram)",
        "Daily Learning and Q&A",
        "Live Teaching Sessions (9 Hours a Week)",
        "Customized Study Plans and Timetables",
        "Weekly Contact Hours (4 Hours) with Seasoned Tutors",
        "Daily UWorld Questions",
        "Unlimited Access to Tutors and Resources"
      ]
    },
    {
      id: "exclusive-europe",
      category: "EXCLUSIVE",
      region: "EUROPE",
      price: 35,
      currency: "GBP",
      per: "PER MONTH",
      features: [
        "Personalized Guidance and Support",
        "Exclusive Online Groups (WhatsApp & Telegram)",
        "Daily Learning and Q&A",
        "Live Teaching Sessions (9 Hours a Week)",
        "Customized Study Plans and Timetables",
        "Weekly Contact Hours (4 Hours) with Seasoned Tutors",
        "Daily UWorld Questions",
        "Unlimited Access to Tutors and Resources"
      ]
    },
    {
      id: "exclusive-one-on-one-nigeria",
      category: "EXCLUSIVE",
      subCategory: "WITH ONE ON ONE PUSH",
      region: "NIGERIA",
      price: 60000,
      currency: "NGN",
      per: "PER MONTH",
      features: [
        "All Exclusive Features Plus:",
        "One-on-One Personal Tutoring",
        "Individual Study Plan Customization",
        "Priority Support and Guidance",
        "Extended Contact Hours",
        "Personal Progress Tracking",
        "Direct Access to Senior Tutors",
        "Customized Exam Preparation"
      ]
    },
    {
      id: "exclusive-one-on-one-african",
      category: "EXCLUSIVE",
      subCategory: "WITH ONE ON ONE PUSH",
      region: "AFRICAN",
      price: 65000,
      currency: "NGN",
      per: "PER MONTH",
      features: [
        "All Exclusive Features Plus:",
        "One-on-One Personal Tutoring",
        "Individual Study Plan Customization",
        "Priority Support and Guidance",
        "Extended Contact Hours",
        "Personal Progress Tracking",
        "Direct Access to Senior Tutors",
        "Customized Exam Preparation"
      ]
    },
    {
      id: "exclusive-one-on-one-usa-canada",
      category: "EXCLUSIVE",
      subCategory: "WITH ONE ON ONE PUSH",
      region: "USA/CANADA",
      price: 100,
      currency: "USD",
      per: "PER MONTH",
      features: [
        "All Exclusive Features Plus:",
        "One-on-One Personal Tutoring",
        "Individual Study Plan Customization",
        "Priority Support and Guidance",
        "Extended Contact Hours",
        "Personal Progress Tracking",
        "Direct Access to Senior Tutors",
        "Customized Exam Preparation"
      ]
    },
    {
      id: "exclusive-one-on-one-europe",
      category: "EXCLUSIVE",
      subCategory: "WITH ONE ON ONE PUSH",
      region: "EUROPE",
      price: 50,
      currency: "GBP",
      per: "PER MONTH",
      features: [
        "All Exclusive Features Plus:",
        "One-on-One Personal Tutoring",
        "Individual Study Plan Customization",
        "Priority Support and Guidance",
        "Extended Contact Hours",
        "Personal Progress Tracking",
        "Direct Access to Senior Tutors",
        "Customized Exam Preparation"
      ]
    }
  ]

  const formatPrice = (price, currency) => {
    if (currency === "NGN") {
      return `${price.toLocaleString()} NGN`
    } else if (currency === "USD") {
      return `${price} US DOLLARS`
    } else if (currency === "GBP") {
      return `${price} POUNDS`
    }
    return `${price} ${currency}`
  }

  const handleCourseSelection = (course) => {
    setSelectedCourse(course)
    // Store selected course in localStorage for registration page
    localStorage.setItem('selectedCourse', JSON.stringify(course))
  }

  return (
    <section id="our-courses" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-12 animate-fade-in-up">
          Our Comprehensive NCLEX Programs & Pricing
        </h2>
        
        {selectedCourse && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Selected Program: {selectedCourse.region} - {selectedCourse.category}
              {selectedCourse.subCategory && ` (${selectedCourse.subCategory.split("WITH ")[1]})`}
            </h3>
            <p className="text-2xl font-bold text-blue-800 mb-4">
              {formatPrice(selectedCourse.price, selectedCourse.currency)} {selectedCourse.per}
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => setSelectedCourse(null)}
                variant="outline"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Change Selection
              </Button>
              <Button 
                asChild
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link href="/register">Enroll Now</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {pricingData.map((item, index) => (
            <Card
              key={item.id}
              className={`flex flex-col overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 animate-fade-in-up p-6 text-center bg-white text-gray-800 cursor-pointer ${
                selectedCourse?.id === item.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => handleCourseSelection(item)}
            >
              <CardHeader className="flex-grow p-0 pb-4">
                <CardTitle className="text-xl font-bold mb-2 text-gray-900">{item.region}</CardTitle>
                <p className="text-sm font-semibold text-[#4F46E5]">
                  {item.category}
                  {item.subCategory && (
                    <span className="text-xs font-normal flex items-center justify-center gap-1 text-gray-600 mt-1">
                      {item.subCategory.split("WITH ")[1]} <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <span className="text-3xl font-bold text-[#4F46E5]">
                  {formatPrice(item.price, item.currency)}
                </span>
                <span className="text-base text-gray-600 block">{item.per}</span>
              </CardContent>
              <CardFooter className="pt-6 p-0">
                <Button 
                  className={`w-full transition-colors ${
                    selectedCourse?.id === item.id 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-[#4F46E5] hover:bg-[#3b34b0]'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCourseSelection(item)
                  }}
                >
                  {selectedCourse?.id === item.id ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    'Select Program'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Select a program above to see detailed features and pricing
          </p>
          {selectedCourse && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Program Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {selectedCourse.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
