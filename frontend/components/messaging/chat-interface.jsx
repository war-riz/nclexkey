"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  Search,
  User,
  MessageCircle,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react'
import { chatAPI } from '@/lib/api'

export default function ChatInterface({ conversationId, onClose }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const messagesEndRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    if (conversationId) {
      loadConversation()
      loadMessages()
      loadOnlineUsers()
      // Set up polling for new messages
      const interval = setInterval(loadMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversation = async () => {
    try {
      setIsLoading(true)
      const result = await chatAPI.getConversation(conversationId)
      if (result.success) {
        setConversation(result.data.conversation)
        // Mark conversation as read
        await chatAPI.markConversationRead(conversationId)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const result = await chatAPI.getMessages(conversationId)
      if (result.success) {
        setMessages(result.data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const result = await chatAPI.getOnlineUsers(conversationId)
      if (result.success) {
        setOnlineUsers(result.data.online_users || [])
      }
    } catch (error) {
      console.error('Failed to load online users:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    try {
      setIsSending(true)
      const messageData = {
        conversation: conversationId,
        message_type: 'text',
        content: newMessage.trim()
      }

      const result = await chatAPI.sendMessage(conversationId, messageData)
      if (result.success) {
        setNewMessage('')
        // Add new message to the list
        setMessages(prev => [...prev, result.data.message])
        // Clear typing status
        await chatAPI.setTypingStatus(conversationId, false)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleTyping = async (isTyping) => {
    try {
      await chatAPI.setTypingStatus(conversationId, isTyping)
    } catch (error) {
      console.error('Failed to update typing status:', error)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isMyMessage = (message) => {
    return message.sender?.id === currentUser?.id
  }

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p>Loading conversation...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!conversation) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Conversation not found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {conversation.other_participant?.full_name || 'Unknown User'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${onlineUsers.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {onlineUsers.length > 0 ? 'Online' : 'Offline'}
                </span>
                {typingUsers.length > 0 && (
                  <span className="text-sm text-blue-500">typing...</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isMyMessage(message) ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className={`flex flex-col ${isMyMessage(message) ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isMyMessage(message)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTime(message.created_at)}
                      </span>
                      {isMyMessage(message) && (
                        <div className="flex items-center">
                          {message.is_read_by_current_user ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Check className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Message Input */}
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Smile className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping(e.target.value.length > 0)
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isSending}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </div>
  )
}
