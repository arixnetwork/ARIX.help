'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, MessageSquare } from 'lucide-react'
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
  const supabase = createClient()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      conversationId: currentConversation,
    },
  })

  // Load user and conversations
  useEffect(() => {
    const loadUser = async () => {
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
    const { data: conversation, error } = await supabase
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
    await supabase.auth.signOut()
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
              className={`w-full text-left p-3 rounded-lg transition ${
                currentConversation === conv.id
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-card-foreground/10 text-foreground/70'
              }`}
            >
              <p className="font-medium truncate">{conv.title}</p>
              <p className="text-xs mt-1 opacity-60">
                {new Date(conv.created_at).toLocaleDateString()}
              </p>
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border bg-card/50 flex items-center px-6">
          <Button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            variant="ghost"
            size="sm"
            className="mr-4"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">ARIX Chat</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Start a Conversation</h2>
                <p className="text-foreground/60 mb-6">
                  Ask me anything about coding, design, app development, or web building.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() =>
                      handleInputChange({
                        target: {
                          value: 'How do I build a React component?',
                        },
                      } as any)
                    }
                    className="p-3 text-left bg-card border border-border rounded-lg hover:border-primary/50 transition"
                  >
                    <p className="font-medium text-sm">React Components</p>
                    <p className="text-xs text-foreground/60 mt-1">
                      Learn how to create React components
                    </p>
                  </button>
                  <button
                    onClick={() =>
                      handleInputChange({
                        target: {
                          value: 'What are SEO best practices?',
                        },
                      } as any)
                    }
                    className="p-3 text-left bg-card border border-border rounded-lg hover:border-primary/50 transition"
                  >
                    <p className="font-medium text-sm">SEO Tips</p>
                    <p className="text-xs text-foreground/60 mt-1">
                      Get SEO optimization advice
                    </p>
                  </button>
                  <button
                    onClick={() =>
                      handleInputChange({
                        target: {
                          value: 'Design principles for UI/UX',
                        },
                      } as any)
                    }
                    className="p-3 text-left bg-card border border-border rounded-lg hover:border-primary/50 transition"
                  >
                    <p className="font-medium text-sm">Design Principles</p>
                    <p className="text-xs text-foreground/60 mt-1">
                      Learn UI/UX best practices
                    </p>
                  </button>
                  <button
                    onClick={() =>
                      handleInputChange({
                        target: {
                          value: 'How to deploy a web app?',
                        },
                      } as any)
                    }
                    className="p-3 text-left bg-card border border-border rounded-lg hover:border-primary/50 transition"
                  >
                    <p className="font-medium text-sm">Deployment</p>
                    <p className="text-xs text-foreground/60 mt-1">
                      Learn about web app deployment
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md lg:max-w-2xl p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border text-foreground p-4 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card/50 p-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask anything about coding, design, or web development..."
              className="flex-1 bg-input border-border text-foreground placeholder:text-foreground/50"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-xs text-foreground/50 mt-2">
            Free tier: 10 queries/day • Pro: Unlimited
          </p>
        </div>
      </div>
    </div>
  )
}
