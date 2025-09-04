"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageCircle, 
  Plus, 
  HelpCircle, 
  Users,
  ArrowLeft,
  Send,
  BookOpen,
  User,
  Clock,
  AlertCircle
} from 'lucide-react'
import ConversationList from '@/components/messaging/conversation-list'
import ChatInterface from '@/components/messaging/chat-interface'
import { chatAPI } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'

export default function MessagesPage() {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  
  // New conversation form state
  const [conversationType, setConversationType] = useState('instructor')
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [availableInstructors, setAvailableInstructors] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Load unread count
    loadUnreadCount()
    
    // Load available instructors and courses for new conversations
    if (user?.role === 'student') {
      loadAvailableInstructors()
      loadAvailableCourses()
    }
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [user])

  const loadUnreadCount = async () => {
    try {
      const result = await chatAPI.getUnreadCount()
      if (result.success) {
        setTotalUnread(result.data.total_unread)
      }
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }

  const loadAvailableInstructors = async () => {
    try {
      // Fetch real instructors from the backend
      const response = await fetch('/api/auth/instructors/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableInstructors(data.data.map(instructor => ({
            id: instructor.id,
            name: instructor.full_name,
            specialty: instructor.specialty || 'NCLEX Preparation',
            email: instructor.email
          })))
        } else {
          console.error('Failed to load instructors:', data.error)
          // Fallback to mock data if API fails
          setAvailableInstructors([
            { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Medical-Surgical Nursing', email: 'sarah.johnson@nclexkeys.com' },
            { id: '2', name: 'Prof. Michael Chen', specialty: 'Pediatric Nursing', email: 'michael.chen@nclexkeys.com' },
            { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Mental Health Nursing', email: 'emily.rodriguez@nclexkeys.com' }
          ])
        }
      } else {
        console.error('Failed to load instructors:', response.statusText)
        // Fallback to mock data
        setAvailableInstructors([
          { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Medical-Surgical Nursing', email: 'sarah.johnson@nclexkeys.com' },
          { id: '2', name: 'Prof. Michael Chen', specialty: 'Pediatric Nursing', email: 'michael.chen@nclexkeys.com' },
          { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Mental Health Nursing', email: 'emily.rodriguez@nclexkeys.com' }
        ])
      }
    } catch (error) {
      console.error('Failed to load instructors:', error)
      // Fallback to mock data
      setAvailableInstructors([
        { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Medical-Surgical Nursing', email: 'sarah.johnson@nclexkeys.com' },
        { id: '2', name: 'Prof. Michael Chen', specialty: 'Pediatric Nursing', email: 'michael.chen@nclexkeys.com' },
        { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Mental Health Nursing', email: 'emily.rodriguez@nclexkeys.com' }
      ])
    }
  }

  const loadAvailableCourses = async () => {
    try {
      // Fetch real courses from the backend
      const response = await fetch('/api/courses/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableCourses(data.data.map(course => ({
            id: course.id,
            title: course.title,
            category: course.category || 'General'
          })))
        } else {
          console.error('Failed to load courses:', data.error)
          // Fallback to mock data if API fails
          setAvailableCourses([
            { id: '1', title: 'NCLEX-RN Comprehensive Review', category: 'General' },
            { id: '2', title: 'Medical-Surgical Nursing', category: 'Specialty' },
            { id: '3', title: 'Pediatric Nursing Fundamentals', category: 'Specialty' },
            { id: '4', title: 'Mental Health Nursing', category: 'Specialty' }
          ])
        }
      } else {
        console.error('Failed to load courses:', response.statusText)
        // Fallback to mock data
        setAvailableCourses([
          { id: '1', title: 'NCLEX-RN Comprehensive Review', category: 'General' },
          { id: '2', title: 'Medical-Surgical Nursing', category: 'Specialty' },
          { id: '3', title: 'Pediatric Nursing Fundamentals', category: 'Specialty' },
          { id: '4', title: 'Mental Health Nursing', category: 'Specialty' }
        ])
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
      // Fallback to mock data
      setAvailableCourses([
        { id: '1', title: 'NCLEX-RN Comprehensive Review', category: 'General' },
        { id: '2', title: 'Medical-Surgical Nursing', category: 'Specialty' },
        { id: '3', title: 'Pediatric Nursing Fundamentals', category: 'Specialty' },
        { id: '4', title: 'Mental Health Nursing', category: 'Specialty' }
      ])
    }
  }

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    if (isMobile) {
      // On mobile, hide conversation list when chat is open
      setShowNewConversation(false)
    }
  }

  const handleCloseChat = () => {
    setSelectedConversation(null)
  }

  const handleNewConversation = () => {
    setShowNewConversation(true)
    setSelectedConversation(null)
    // Reset form
    setConversationType('instructor')
    setSelectedInstructor('')
    setSelectedCourse('none')
    setSubject('')
    setInitialMessage('')
  }

  const handleBackToConversations = () => {
    setSelectedConversation(null)
    setShowNewConversation(false)
  }

  const handleCreateConversation = async () => {
    if (!subject.trim() || !initialMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and initial message.",
        variant: "destructive",
      })
      return
    }

    if (conversationType === 'instructor' && !selectedInstructor) {
      toast({
        title: "Missing Information",
        description: "Please select an instructor.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreatingConversation(true)
      
      const conversationData = {
        conversation_type: conversationType,
        subject: subject.trim(),
        initial_message: initialMessage.trim(),
        instructor_id: conversationType === 'instructor' ? selectedInstructor : null,
        course_id: selectedCourse && selectedCourse !== 'none' ? selectedCourse : null
      }

      const result = await chatAPI.createConversation(conversationData)
      
      if (result.success) {
        toast({
          title: "Conversation Created",
          description: "Your message has been sent successfully.",
        })
        
        // Select the new conversation
        setSelectedConversation(result.data.conversation)
        setShowNewConversation(false)
        
        // Reset form
        setSubject('')
        setInitialMessage('')
        setSelectedInstructor('')
        setSelectedCourse('none')
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to create conversation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingConversation(false)
    }
  }

  const getConversationTypeLabel = (type) => {
    switch (type) {
      case 'instructor': return 'Message Instructor'
      case 'support': return 'Contact Support'
      case 'general': return 'General Inquiry'
      default: return 'Message'
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-gray-600">Connect with instructors and support</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-sm">
                {totalUnread} unread
              </Badge>
            )}
            <Button onClick={handleNewConversation} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      {isMobile ? (
        <div className="h-[calc(100vh-200px)]">
          {selectedConversation ? (
            <div className="h-full">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToConversations}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {selectedConversation.other_participant?.full_name || 'Chat'}
                </span>
              </div>
              <Card className="h-full">
                <ChatInterface
                  conversationId={selectedConversation.id}
                  onClose={handleCloseChat}
                />
              </Card>
            </div>
          ) : (
            <Card className="h-full">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </Card>
          )}
        </div>
      ) : (
        /* Desktop Layout */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-2">
            {selectedConversation ? (
              <Card className="h-full">
                <ChatInterface
                  conversationId={selectedConversation.id}
                  onClose={handleCloseChat}
                />
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Choose a conversation from the list to start messaging
                  </p>
                  <Button
                    onClick={handleNewConversation}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Enhanced New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Start New Conversation</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewConversation(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Conversation Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Conversation Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'instructor', label: 'Message Instructor', icon: Users, description: 'Ask questions about courses or content' },
                      { value: 'support', label: 'Contact Support', icon: HelpCircle, description: 'Technical issues or account problems' },
                      { value: 'general', label: 'General Inquiry', icon: MessageCircle, description: 'Other questions or feedback' }
                    ].map((type) => (
                      <div
                        key={type.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          conversationType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setConversationType(type.value)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <type.icon className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructor Selection (if type is instructor) */}
                {conversationType === 'instructor' && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Select Instructor</Label>
                    <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableInstructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{instructor.name}</span>
                              <span className="text-sm text-gray-500">{instructor.specialty}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Course Selection (optional) */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Course (Optional)
                    <span className="text-gray-500 font-normal ml-1">- Help instructors provide better context</span>
                  </Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific course</SelectItem>
                      {availableCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{course.title}</span>
                            <span className="text-sm text-gray-500">{course.category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Subject</Label>
                  <Input
                    placeholder="Brief description of your message"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {subject.length}/100
                  </div>
                </div>

                {/* Initial Message */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Message</Label>
                  <Textarea
                    placeholder="Type your message here..."
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {initialMessage.length}/1000
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewConversation(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateConversation}
                    disabled={isCreatingConversation || !subject.trim() || !initialMessage.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreatingConversation ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
