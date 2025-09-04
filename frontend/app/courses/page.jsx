"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  BookOpen,
  Loader2,
  User
} from 'lucide-react'
import { listAllCourses, getCourseCategoriesPublic } from '@/lib/api'

function CoursesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    loadCourses()
    loadCategories()
  }, [])

  useEffect(() => {
    // Apply filters when search or category changes
    const timer = setTimeout(() => {
      loadCourses()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory, sortBy])

  const loadCourses = async () => {
    try {
      setIsLoading(true)
      const params = {
        search: searchQuery,
        category: selectedCategory,
        ordering: sortBy === 'newest' ? '-created_at' : 
                 sortBy === 'oldest' ? 'created_at' :
                 sortBy === 'price_low' ? 'price' :
                 sortBy === 'price_high' ? '-price' :
                 sortBy === 'rating' ? '-rating' : '-created_at'
      }

      const result = await listAllCourses(params)
      if (result.success) {
        setCourses(result.data.courses || [])
      } else {
        console.error('Failed to load courses:', result.error)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await getCourseCategoriesPublic()
      if (result.success) {
        setCategories(result.data.categories || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleCourseClick = (courseId) => {
    router.push(`/courses/${courseId}`)
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Courses</h1>
        <p className="text-gray-600">
          Discover comprehensive NCLEX preparation courses from expert instructors
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          {isLoading ? 'Loading...' : `${courses.length} course${courses.length !== 1 ? 's' : ''} found`}
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or browse all categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="h-full flex flex-col">
              {/* Course Image */}
              {course.thumbnail && (
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => handleCourseClick(course.id)}
                  />
                  {course.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      Featured
                    </Badge>
                  )}
                </div>
              )}

              <CardHeader className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {course.category?.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {course.level}
                  </Badge>
                </div>
                
                <CardTitle 
                  className="text-lg cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleCourseClick(course.id)}
                >
                  {course.title}
                </CardTitle>
                
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Instructor */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-500" />
                  </div>
                  <span className="text-sm text-gray-600">
                    {course.instructor?.full_name || 'Unknown Instructor'}
                  </span>
                </div>

                {/* Course Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>{course.rating || '4.5'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.total_duration || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>All Students</span>
                  </div>
                </div>

                {/* Price and Enrollment */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        Full Access
                      </div>
                      <div className="text-sm text-gray-500">
                        Included in your registration
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleCourseClick(course.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Access Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoursesPageContent />
    </Suspense>
  )
}





