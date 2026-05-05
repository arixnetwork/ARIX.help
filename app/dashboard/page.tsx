'use client'

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

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserProfile(profile)

        const { data: conversations } = await supabase
          .from('ai_conversations')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)

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
          messagesCount: 0,
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
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
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

      <section className="py-12 border-b border-border/30 bg-card/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-foreground/60">Welcome back, {user?.email}</p>

          <div className="bg-background border border-border rounded-lg p-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-2">Plan</p>
                <p className="text-lg font-semibold uppercase">{userProfile?.subscription_tier || 'Free'}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-2">Credits Remaining</p>
                <p className="text-lg font-semibold text-primary">{stats.creditsRemaining}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-2">Member Since</p>
                <p className="text-lg font-semibold">{new Date(user?.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Activity</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Conversations</h3>
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.conversationsCount}</p>
              <p className="text-sm text-foreground/60">Total chats</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Forum Posts</h3>
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.forumPostsCreated}</p>
              <p className="text-sm text-foreground/60">Posts created</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Tokens Used</h3>
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats.totalTokensUsed}</p>
              <p className="text-sm text-foreground/60">Total tokens</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground/80">Streak</h3>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">3</p>
              <p className="text-sm text-foreground/60">Days active</p>
            </div>
          </div>

          <div className="bg-card/20 border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold mb-6">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/chat">
                <Button className="w-full bg-primary hover:bg-primary/90">Start Chat</Button>
              </Link>
              <Link href="/resources">
                <Button variant="outline" className="w-full border-border hover:bg-card">Resources</Button>
              </Link>
              <Link href="/forum">
                <Button variant="outline" className="w-full border-border hover:bg-card">Forums</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
