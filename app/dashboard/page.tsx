'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Globe,
  Smartphone,
  Package,
  Palette,
  Code2,
  Zap,
  Bot,
  MessageCircle,
  Plus,
  FolderPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
  status: string
}

const builders = [
  {
    title: 'Website Builder',
    description: 'Create stunning websites with AI',
    icon: Globe,
    href: '/dashboard/builders/website',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'App Builder',
    description: 'Build mobile & web apps',
    icon: Smartphone,
    href: '/dashboard/builders/app',
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'SaaS Builder',
    description: 'Launch your SaaS product',
    icon: Package,
    href: '/dashboard/builders/saas',
    color: 'from-pink-500 to-pink-600',
  },
  {
    title: 'UI Components',
    description: 'Design UI components',
    icon: Palette,
    href: '/dashboard/builders/ui',
    color: 'from-orange-500 to-orange-600',
  },
  {
    title: 'Code Snippets',
    description: 'Generate code',
    icon: Code2,
    href: '/dashboard/builders/coding',
    color: 'from-green-500 to-green-600',
  },
  {
    title: 'SEO Optimizer',
    description: 'Optimize for search',
    icon: Zap,
    href: '/dashboard/builders/seo',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    title: 'AI Agent',
    description: 'Create autonomous agents',
    icon: Bot,
    href: '/dashboard/builders/agent',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    title: 'Chatbot',
    description: 'Build chatbots',
    icon: MessageCircle,
    href: '/dashboard/builders/chatbot',
    color: 'from-cyan-500 to-cyan-600',
  },
]

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        
        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUser(user)

        // Load projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6)

        setProjects(projectsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-foreground/60 mt-2">Create amazing projects with Arix AI builders</p>
        </div>
        <Button className="gap-2" size="lg">
          <FolderPlus className="w-5 h-5" />
          New Project
        </Button>
      </div>

      {/* AI Builders Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">AI Builders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {builders.map((builder) => {
            const Icon = builder.icon
            return (
              <Link key={builder.href} href={builder.href}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${builder.color} flex items-center justify-center mb-2`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{builder.title}</CardTitle>
                    <CardDescription>{builder.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline" size="sm">
                      Launch
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Recent Projects</h2>
          <Link href="/dashboard/projects">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-12 text-center">
              <p className="text-foreground/60 mb-4">No projects yet. Create your first one!</p>
              <Button className="gap-2">
                <FolderPlus className="w-4 h-4" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow bg-card border-border">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/50">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
