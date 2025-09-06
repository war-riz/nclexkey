"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Play,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { getCourseDetailsPublic, getCourseContentStructure } from '@/lib/api'
import VideoPlayer from '@/components/video-player'
import { toast } from '@/hooks/use-toast'

export default function CourseViewerPage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState(null)
  const [courseStructure, setCourseStructure] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState(new Set())

  useEffect(() => {
    if (params.courseId) {
      loadCourse()
    }
  }, [params.courseId])

  const loadCourse = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load course details and structure
      const [courseResult, structureResult] = await Promise.all([
        getCourseDetailsPublic(params.courseId),
        getCourseContentStructure(params.courseId)
      ])
      
      if (courseResult.success) {
        setCourse(courseResult.data)
      } else {
        setError(courseResult.error?.message || 'Failed to load course')
        return
      }
      
      if (structureResult.success) {
        setCourseStructure(structureResult.data)
        // Auto-expand first section
        if (structureResult.data.sections && structureResult.data.sections.length > 0) {
          setExpandedSections(new Set([structureResult.data.sections[0].id]))
        }
      } else {
        console.warn('Failed to load course structure:', structureResult.error)
      }
    } catch (error) {
      setError('Failed to load course details')
      console.error('Error loading course:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson)
  }

  const getVideoSource = (lesson) => {
    if (lesson.video_source === 'upload' && lesson.video_file) {
      return {
        source: 'cloudinary',
        url: lesson.video_file,
        cloudinaryUrl: lesson.video_file
      }
    } else if (lesson.video_source === 'url' && lesson.video_url) {
      return {
        source: 'external',
        url: lesson.video_url
      }
    } else if (lesson.video_source === 'streaming' && lesson.video_streaming_url) {
      return {
        source: 'hls',
        url: lesson.video_streaming_url
      }
    }
    return null
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading course...</span>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Course not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2">{course.description}</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            Full Access
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Content */}
        <div className="lg:col-span-2">
          {selectedLesson ? (
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-blue-600" />
                  {selectedLesson.title}
                </CardTitle>
                <CardDescription>
                  {selectedLesson.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedLesson.lesson_type === 'video' ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <VideoPlayer
                        videoId={selectedLesson.id}
                        title={selectedLesson.title}
                        videoSource={getVideoSource(selectedLesson)?.source || 'cloudinary'}
                        cloudinaryUrl={getVideoSource(selectedLesson)?.cloudinaryUrl}
                        videoUrl={getVideoSource(selectedLesson)?.url}
                        showControls={true}
                        autoPlay={false}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Duration: {formatDuration(selectedLesson.duration_seconds)}</span>
                      <span>Type: {selectedLesson.get_lesson_type_display || selectedLesson.lesson_type}</span>
                    </div>
                    
                    {/* Video Information */}
                    <div className="mt-4 space-y-4">
                      {/* Video Details */}
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Video Information:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Source:</span>
                            <span className="ml-2 capitalize">{getVideoSource(selectedLesson)?.source || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Type:</span>
                            <span className="ml-2">{selectedLesson.video_source || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Video Link Display */}
                      {getVideoSource(selectedLesson)?.url && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Video Link:</h4>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={getVideoSource(selectedLesson)?.url}
                              readOnly
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(getVideoSource(selectedLesson)?.url)
                                toast({
                                  title: "Link Copied",
                                  description: "Video link copied to clipboard",
                                })
                              }}
                            >
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(getVideoSource(selectedLesson)?.url, '_blank')}
                            >
                              Open
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <p className="text-gray-700">{selectedLesson.text_content || 'No content available for this lesson type.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white shadow-md">
              <CardHeader>
                <CardTitle>Select a lesson to start learning</CardTitle>
                <CardDescription>
                  Choose a lesson from the course structure to begin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click on any lesson to start watching</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Structure Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-md sticky top-4">
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>
                {courseStructure?.sections?.length || 0} sections • {courseStructure?.total_lessons || 0} lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {courseStructure?.sections?.map((section) => (
                  <div key={section.id} className="border rounded-lg">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.has(section.id) ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {section.total_lessons} lessons
                      </Badge>
                    </button>
                    
                    {expandedSections.has(section.id) && (
                      <div className="border-t bg-gray-50">
                        {section.lessons?.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            className={`w-full p-3 text-left hover:bg-gray-100 flex items-center gap-3 ${
                              selectedLesson?.id === lesson.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {lesson.lesson_type === 'video' ? (
                                <Play className="h-4 w-4 text-blue-600" />
                              ) : (
                                <BookOpen className="h-4 w-4 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-sm">{lesson.title}</div>
                              <div className="text-xs text-gray-500">
                                {lesson.lesson_type === 'video' && formatDuration(lesson.duration_seconds)}
                              </div>
                            </div>
                            {lesson.is_preview && (
                              <Badge variant="secondary" className="text-xs">Preview</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
