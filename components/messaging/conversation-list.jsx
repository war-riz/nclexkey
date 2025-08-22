"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  MessageCircle, 
  Plus, 
  MoreVertical,
  Filter,
  User,
  Users,
  HelpCircle
} from 'lucide-react'
import { chatAPI } from '@/lib/api'

export default function ConversationList({ onSelectConversation, selectedConversationId }) {
  const [conversations, setConversations] = useState([])
  const [filteredConversations, setFilteredConversations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})

  useEffect(() => {
    loadConversations()
    loadUnreadCounts()
    
    // Set up polling for new conversations and unread counts
    const interval = setInterval(() => {
      loadConversations()
      loadUnreadCounts()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterConversations()
  }, [conversations, searchQuery])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const result = await chatAPI.getConversations()
      if (result.success) {
        setConversations(result.data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCounts = async () => {
    try {
      const result = await chatAPI.getUnreadCount()
      if (result.success) {
        const counts = {}
        result.data.conversation_counts.forEach(item => {
          counts[item.conversation_id] = item.unread_count
        })
        setUnreadCounts(counts)
      }
    } catch (error) {
      console.error('Failed to load unread counts:', error)
    }
  }

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const filtered = conversations.filter(conversation => {
      const query = searchQuery.toLowerCase()
      const subject = conversation.subject?.toLowerCase() || ''
      const participantName = conversation.other_participant?.full_name?.toLowerCase() || ''
      const courseTitle = conversation.course?.title?.toLowerCase() || ''
      
      return subject.includes(query) || 
             participantName.includes(query) || 
             courseTitle.includes(query)
    })
    
    setFilteredConversations(filtered)
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleConversationClick = (conversation) => {
    onSelectConversation(conversation)
  }

  const getConversationIcon = (conversationType) => {
    switch (conversationType) {
      case 'student_instructor':
        return <Users className="h-4 w-4" />
      case 'student_support':
      case 'instructor_support':
        return <HelpCircle className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const truncateText = (text, maxLength = 50) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Messages</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <Separator />

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-sm text-gray-400">
                {searchQuery ? 'Try adjusting your search terms' : 'Start a conversation to begin messaging'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => {
                const unreadCount = unreadCounts[conversation.id] || 0
                const isSelected = selectedConversationId === conversation.id
                
                return (
                  <div
                    key={conversation.id}
                    className={`relative cursor-pointer rounded-lg p-3 transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.other_participant?.profile_picture} />
                          <AvatarFallback>
                            {getInitials(conversation.other_participant?.full_name || 'User')}
                          </AvatarFallback>
                        </Avatar>
                        {unreadCount > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">
                              {conversation.other_participant?.full_name || 'Unknown User'}
                            </h4>
                            {conversation.conversation_type !== 'student_instructor' && (
                              <span className="text-xs text-gray-500">
                                {getConversationIcon(conversation.conversation_type)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {conversation.last_message && (
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.last_message.created_at)}
                              </span>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Subject or Course */}
                        {conversation.subject && (
                          <p className="text-xs text-gray-600 mb-1 truncate">
                            {conversation.subject}
                          </p>
                        )}

                        {/* Course Title */}
                        {conversation.course && (
                          <p className="text-xs text-blue-600 mb-1 truncate">
                            📚 {conversation.course.title}
                          </p>
                        )}

                        {/* Last Message */}
                        {conversation.last_message && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {conversation.last_message.sender_name}:
                            </span>
                            <p className={`text-xs truncate ${
                              unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                            }`}>
                              {truncateText(conversation.last_message.content)}
                            </p>
                          </div>
                        )}

                        {/* Status Indicators */}
                        <div className="flex items-center gap-2 mt-1">
                          {conversation.is_resolved && (
                            <Badge variant="secondary" className="text-xs">
                              Resolved
                            </Badge>
                          )}
                          {conversation.conversation_type === 'student_support' && (
                            <Badge variant="outline" className="text-xs">
                              Support
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
