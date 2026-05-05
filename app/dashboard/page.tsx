'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, MessageSquare, BookOpen, Zap, TrendingUp } from 'lucide-react'

interface UserStats {
  conversationsCount: number
  messagesCount: number
  resourcesViewed: number
  forumPostsCreated: number
  creditsRemaining: number
  totalTokensUsed: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [stats, setStats] = useState<UserStats>({
    conversationsCount: 0,
    messagesCount: 0,
    resourcesViewed: 0,
    forumPostsCreated: 0,
    creditsRemaining: 0,
    totalTokensUsed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserProfile(profile)

        // Get stats
        const { data: conversations } = await supabase
          .from('ai_conversations')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)

        const { data: messages } = await supabase
          .from('ai_messages')
          .select('id', { count: 'exact' })
          .in(
            'conversation_id',
            (conversations || []).map((c: any) => c.id)
          )

        const { data: posts } = await supabase
          .from('forum_posts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)

        const { data: usageData } = await supabase
          .from('usage_tracking')
          .select('tokens_used')
          .eq('user_id', user.id)

        const totalTokens = usageData?.reduce((sum: number, row: any) => sum + (row.tokens_used || 0), 0) || 0

        setStats({
          conversationsCount: conversations?.length || 0,
          messagesCount: messages?.length || 0,
          resourcesViewed: 0,
          forumPostsCreated: posts?.length || 0,
          creditsRemaining: profile?.credits_remaining || 0,
          totalTokensUsed: totalTokens,
        })
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/chat" className="text-2xl font-bold text-primary">
              ARIX
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-border hover:bg-card text-foreground flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Profile Section */}
      <section className="py-12 border-b border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
              <p className="text-foreground/60">Track your activity and manage your account</p>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-background border border-border rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-2">Email</p>
                <p className="text-lg font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-2">Subscription</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold uppercase">
                    {userProfile?.subscription_tier || 'Free'}
                  </span>
                  {userProfile?.subscription_tier === 'free' && (
                    <Link href="/">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Upgrade
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-2">Remaining Credits</p>
                <p className="text-lg font-semibold text-primary">{stats.creditsRemaining}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Activity Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Conversations */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Conversations</h3>
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold mb-2">{stats.conversationsCount}</p>
              <p className="text-sm text-foreground/60">Total AI conversations started</p>
            </div>

            {/* Messages */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Messages</h3>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold mb-2">{stats.messagesCount}</p>
              <p className="text-sm text-foreground/60">Messages sent and received</p>
            </div>

            {/* Forum Posts */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Forum Posts</h3>
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold mb-2">{stats.forumPostsCreated}</p>
              <p className="text-sm text-foreground/60">Discussions you&apos;ve started</p>
            </div>

            {/* Tokens Used */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Tokens Used</h3>
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold mb-2">{stats.totalTokensUsed}</p>
              <p className="text-sm text-foreground/60">API tokens consumed</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card/20 border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/chat">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Start New Chat
                </Button>
              </Link>
              <Link href="/resources">
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-card text-foreground"
                >
                  Browse Resources
                </Button>
              </Link>
              <Link href="/forum">
                <Button 
                  variant="outline" 
                  className="w-full border-border hover:bg-card text-foreground"
                >
                  View Forums
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-foreground/60 text-sm">
            © 2024 ARIX.help. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
