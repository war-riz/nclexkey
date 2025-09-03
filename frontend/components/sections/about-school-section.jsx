"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { 
  CheckCircle, 
  Users, 
  MessageCircle, 
  Video, 
  Calendar, 
  Clock, 
  BookOpen, 
  Zap,
  GraduationCap,
  Target,
  Heart,
  Star
} from "lucide-react"

const features = [
  {
    icon: Heart,
    title: "PERSONALIZED GUIDANCE AND SUPPORT",
    description: "Tailored learning paths designed specifically for your success",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: MessageCircle,
    title: "EXCLUSIVE ONLINE GROUPS",
    subtitle: "WHATSAPP & TELEGRAM",
    description: "Connect with peers and tutors in dedicated learning communities",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Video,
    title: "LIVE TEACHING SESSIONS",
    subtitle: "9 HOURS A WEEK",
    description: "Interactive live sessions with expert instructors",
    color: "from-blue-500 to-indigo-500"
  },
  {
    icon: Calendar,
    title: "CUSTOMIZED STUDY PLANS",
    subtitle: "AND TIMETABLES",
    description: "Personalized schedules that fit your lifestyle",
    color: "from-purple-500 to-violet-500"
  },
  {
    icon: Clock,
    title: "WEEKLY CONTACT HOURS",
    subtitle: "4 HOURS WITH SEASONED TUTORS",
    description: "Direct access to experienced nursing professionals",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: BookOpen,
    title: "DAILY UWORLD QUESTIONS",
    description: "Practice with high-quality NCLEX-style questions daily",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: Zap,
    title: "UNLIMITED ACCESS",
    subtitle: "TO TUTORS AND RESOURCES",
    description: "24/7 access to learning materials and expert support",
    color: "from-yellow-500 to-amber-500"
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

const heroVariants = {
  hidden: { 
    opacity: 0, 
    y: 50 
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
}

export function AboutSchoolSection() {
  return (
    <section id="about-school" className="relative py-20 md:py-32 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-20"
          variants={heroVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full mb-6 shadow-lg"
          >
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">NCLEX PREP ACADEMY</span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            About Our{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              NCLEX Tutoring School
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Welcome to NCLEX Prep, your dedicated partner in achieving success on the NCLEX examination. 
            We provide a virtual learning environment designed to equip aspiring nurses with the knowledge, 
            strategies, and confidence needed to pass their exams.
          </motion.p>
          
          <motion.p 
            className="text-lg text-gray-600 max-w-3xl mx-auto mt-4 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Our comprehensive programs are tailored to meet individual learning styles, ensuring every 
            student receives the support they need to excel.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group relative"
            >
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden">
                {/* Gradient background overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Icon with gradient background */}
                <div className={`relative mb-6 inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg group-hover:shadow-xl transition-all duration-500`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                
                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  {feature.subtitle && (
                    <p className="text-lg font-semibold text-blue-600 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                      {feature.subtitle}
                    </p>
                  )}
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
                
                {/* Hover effect border */}
                <div className={`absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA Section */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Target className="h-16 w-16 mx-auto mb-6 text-yellow-300" />
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Ace Your NCLEX?
              </h3>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of successful nurses who have passed their NCLEX with our proven methods 
                and dedicated support system.
              </p>
                                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href="/register" 
                      className="inline-block bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50"
                    >
                      Register
                    </Link>
                  </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
