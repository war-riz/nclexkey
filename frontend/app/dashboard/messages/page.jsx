"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Plus, 
  HelpCircle, 
  Users,
  ArrowLeft
} from 'lucide-react'
import ConversationList from '@/components/messaging/conversation-list'
import ChatInterface from '@/components/messaging/chat-interface'
import { chatAPI } from '@/lib/api'

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Load unread count
    loadUnreadCount()
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
  }

  const handleBackToConversations = () => {
    setSelectedConversation(null)
    setShowNewConversation(false)
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
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-sm">
              {totalUnread} unread
            </Badge>
          )}
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
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleNewConversation}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Conversation
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* New Conversation Modal (simplified for now) */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Start New Conversation</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Handle student-instructor conversation
                    setShowNewConversation(false)
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Message Instructor
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Handle support conversation
                    setShowNewConversation(false)
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewConversation(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
