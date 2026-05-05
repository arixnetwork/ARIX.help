'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, MessageSquare, Plus, Menu, LogOut, Settings, Send } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [currentConversation, setCurrentConversation] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabaseRef = useRef<any>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      conversationId: currentConversation,
    },
  })

  // Load user and conversations
  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      supabaseRef.current = supabase
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Load conversations
      const { data: convs } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (convs) {
        setConversations(convs)
        if (convs.length > 0 && !currentConversation) {
          setCurrentConversation(convs[0].id)
        }
      }
    }

    loadUser()
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createNewConversation = async () => {
    if (!supabaseRef.current) return
    const { data: conversation, error } = await supabaseRef.current
      .from('ai_conversations')
      .insert({
        title: 'New Conversation',
        category: 'general',
        user_id: user?.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return
    }

    if (conversation) {
      setConversations([conversation, ...conversations])
      setCurrentConversation(conversation.id)
    }
  }

  const handleLogout = async () => {
    if (supabaseRef.current) {
      await supabaseRef.current.auth.signOut()
    }
    router.push('/auth/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-card border-r border-border transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewConversation}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 mb-4"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
          <div className="space-y-2">
            <Link href="/resources">
              <Button 
                variant="ghost"
                className="w-full justify-start text-foreground/70 hover:text-foreground hover:bg-card"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Resources
              </Button>
            </Link>
            <Link href="/forum">
              <Button 
                variant="ghost"
                className="w-full justify-start text-foreground/70 hover:text-foreground hover:bg-card"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Forums
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setCurrentConversation(conv.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                currentConversation === conv.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/60 hover:bg-card'
              }`}
            >
              <p className="truncate text-sm">{conv.title}</p>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <div className="text-sm text-foreground/60 mb-4">
            <p className="font-medium">{user?.email}</p>
            <p className="text-xs mt-1">Free Plan</p>
          </div>
          <Link href="/dashboard">
            <Button 
              variant="outline"
              className="w-full justify-start border-border hover:bg-card text-foreground"
            >
              <Settings className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-border hover:bg-card text-foreground flex items-center justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-foreground"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">ARIX AI</h1>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card text-foreground rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card text-foreground px-4 py-2 rounded-lg">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-card border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything..."
              className="bg-input border-border text-foreground placeholder:text-foreground/50 flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !currentConversation}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
