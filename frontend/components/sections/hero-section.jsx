"use client"

import { Button } from "@/components/ui/button"
import { PlayCircle, Users, Scale, BookOpen, Brain, Heart, Shield, Zap, Star, Target, Award, GraduationCap } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative w-full py-24 md:py-32 lg:py-40 pt-32 md:pt-40 lg:pt-48 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 animate-bounce">
          <div className="w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
        </div>
        <div className="absolute top-40 right-20 animate-bounce delay-1000">
          <div className="w-3 h-3 bg-purple-400 rounded-full opacity-60 animate-pulse"></div>
        </div>
        <div className="absolute top-60 left-1/4 animate-bounce delay-2000">
          <div className="w-2 h-2 bg-indigo-400 rounded-full opacity-60 animate-pulse"></div>
        </div>
        <div className="absolute top-80 right-1/3 animate-bounce delay-3000">
          <div className="w-5 h-5 bg-pink-400 rounded-full opacity-60 animate-pulse"></div>
        </div>
        
        {/* Floating Icons */}
        <div className="absolute top-32 right-16 animate-float">
          <Brain className="h-8 w-8 text-blue-500 opacity-40" />
        </div>
        <div className="absolute top-48 left-20 animate-float delay-1000">
          <Heart className="h-6 w-6 text-red-500 opacity-40" />
        </div>
        <div className="absolute top-64 right-1/4 animate-float delay-2000">
          <Shield className="h-7 w-7 text-green-500 opacity-40" />
        </div>
        <div className="absolute top-96 left-1/3 animate-float delay-3000">
          <Zap className="h-5 w-5 text-yellow-500 opacity-40" />
        </div>
        
        {/* Rotating Stars */}
        <div className="absolute top-24 right-1/3 animate-spin-slow">
          <Star className="h-4 w-4 text-yellow-400 opacity-50" />
        </div>
        <div className="absolute top-72 left-16 animate-spin-slow delay-1000">
          <Star className="h-3 w-3 text-yellow-400 opacity-50" />
        </div>
        <div className="absolute top-48 right-8 animate-spin-slow delay-2000">
          <Star className="h-5 w-5 text-yellow-400 opacity-50" />
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Content Section */}
        <div className="space-y-6 text-center lg:text-left animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 animate-slide-in-up">
            Master the <span className="text-[#4F46E5] animate-pulse">NCLEX</span> with Expert Guidance
          </h1>
          <p className="text-lg md:text-xl text-gray-700 animate-slide-in-up delay-100">
            Join thousands of nursing students who have successfully passed their NCLEX exam with our comprehensive
            virtual tutoring program. <strong>Student registration only - payment required.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 animate-slide-in-up delay-200">
            <Button
              asChild
              className="bg-[#4F46E5] text-white px-8 py-3 text-lg rounded-md hover:bg-[#3b34b0] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 animate-pulse"
            >
              <Link href="/register">Register</Link>
            </Button>
            <Button
              variant="ghost"
              className="text-gray-700 hover:bg-gray-100 hover:text-[#4F46E5] transition-all duration-300 flex items-center gap-2 px-6 py-3 text-lg rounded-md hover:scale-105"
            >
              <PlayCircle className="h-6 w-6 animate-pulse" />
              Watch Demo
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 text-gray-800 animate-slide-in-up delay-300">
            <div className="flex flex-col items-center lg:items-start group hover:scale-105 transition-transform duration-300">
              <Users className="h-10 w-10 text-[#4F46E5] mb-2 animate-bounce" />
              <span className="text-3xl font-bold animate-count-up">10,000+</span>
              <span className="text-sm text-gray-600">Students Enrolled</span>
            </div>
            <div className="flex flex-col items-center lg:items-start group hover:scale-105 transition-transform duration-300">
              <Scale className="h-10 w-10 text-[#4F46E5] mb-2 animate-bounce delay-300" />
              <span className="text-3xl font-bold animate-count-up">95%</span>
              <span className="text-sm text-gray-600">Pass Rate</span>
            </div>
            <div className="flex flex-col items-center lg:items-start group hover:scale-105 transition-transform duration-300">
              <BookOpen className="h-10 w-10 text-[#4F46E5] mb-2 animate-bounce delay-600" />
              <span className="text-3xl font-bold animate-count-up">500+</span>
              <span className="text-sm text-gray-600">Practice Questions</span>
            </div>
          </div>
        </div>

        {/* Right Animated Section */}
        <div className="relative h-80 md:h-[400px] lg:h-[500px] w-full flex items-center justify-center">
          {/* Central Animated Circle */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
            {/* Outer Rotating Ring */}
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-2 border-4 border-purple-200 rounded-full animate-spin-slow-reverse"></div>
            <div className="absolute inset-4 border-4 border-indigo-200 rounded-full animate-spin-slow"></div>
            
            {/* Central Content */}
            <div className="absolute inset-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <div className="text-center">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-[#4F46E5] animate-bounce" />
                <h3 className="text-xl font-bold text-gray-800 mb-2 animate-fade-in">NCLEX Success</h3>
                <p className="text-sm text-gray-600 animate-fade-in delay-500">Your Journey Starts Here</p>
              </div>
            </div>
            
            {/* Floating Cards Around Circle */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 animate-float">
              <div className="bg-white p-3 rounded-lg shadow-lg border border-blue-200">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 animate-float delay-1000">
              <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 animate-float delay-2000">
              <div className="bg-white p-3 rounded-lg shadow-lg border border-green-200">
                <Scale className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 animate-float delay-3000">
              <div className="bg-white p-3 rounded-lg shadow-lg border border-red-200">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
            </div>
            
            {/* Diagonal Floating Elements */}
            <div className="absolute top-8 right-8 animate-float delay-500">
              <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-2 rounded-full shadow-lg">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="absolute bottom-8 left-8 animate-float delay-1500">
              <div className="bg-gradient-to-r from-green-400 to-blue-400 p-2 rounded-full shadow-lg">
                <Brain className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="absolute top-8 left-8 animate-float delay-2500">
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-2 rounded-full shadow-lg">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="absolute bottom-8 right-8 animate-float delay-3500">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-2 rounded-full shadow-lg">
                <Star className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          {/* Background Animated Elements */}
          <div className="absolute inset-0 -z-10">
            {/* Pulsing Circles */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-ping"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-ping delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-200 rounded-full opacity-20 animate-ping delay-2000"></div>
            
            {/* Rotating Lines */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-blue-400 to-transparent animate-spin-slow"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-20 bg-gradient-to-t from-purple-400 to-transparent animate-spin-slow-reverse"></div>
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-20 h-1 bg-gradient-to-r from-indigo-400 to-transparent animate-spin-slow"></div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-20 h-1 bg-gradient-to-l from-pink-400 to-transparent animate-spin-slow-reverse"></div>
          </div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes count-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 15s linear infinite;
        }
        
        .animate-count-up {
          animation: count-up 1s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-slide-in-up {
          animation: slideInUp 0.8s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-1000 { animation-delay: 1s; }
        .delay-1500 { animation-delay: 1.5s; }
        .delay-2000 { animation-delay: 2s; }
        .delay-2500 { animation-delay: 2.5s; }
        .delay-3000 { animation-delay: 3s; }
        .delay-3500 { animation-delay: 3.5s; }
      `}</style>
    </section>
  )
}
