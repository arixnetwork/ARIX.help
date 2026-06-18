'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, Play, Pause, Trash2, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Workflow {
  id: string
  name: string
  description: string
  status: string
  trigger_type: string
  enabled: boolean
  created_at: string
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get user's projects first
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)

      const projectIds = projects?.map((p) => p.id) || []

      if (projectIds.length === 0) {
        setIsLoading(false)
        return
      }

      // Get workflows for those projects
      const { data } = await supabase
        .from('workflows')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })

      setWorkflows(data || [])
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleWorkflow = async (workflowId: string, currentEnabled: boolean) => {
    try {
      await supabase
        .from('workflows')
        .update({ enabled: !currentEnabled })
        .eq('id', workflowId)

      setWorkflows(
        workflows.map((w) =>
          w.id === workflowId ? { ...w, enabled: !currentEnabled } : w
        )
      )
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Delete this workflow?')) return

    try {
      await supabase.from('workflows').delete().eq('id', workflowId)
      setWorkflows(workflows.filter((w) => w.id !== workflowId))
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-foreground/60 mt-1">Automate tasks and integrate services</p>
        </div>
        <Link href="/dashboard/workflows/new">
          <Button className="gap-2" size="lg">
            <Plus className="w-5 h-5" />
            New Workflow
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <Input
          placeholder="Search workflows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {filteredWorkflows.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-12 text-center">
            <p className="text-foreground/60 mb-4">
              {workflows.length === 0
                ? 'No workflows yet. Create one to automate your tasks!'
                : 'No workflows match your search.'}
            </p>
            <Link href="/dashboard/workflows/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Workflow
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                    <p className="text-sm text-foreground/60 mt-1">{workflow.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {workflow.trigger_type}
                      </span>
                      <span className="text-xs text-foreground/50">
                        Created {new Date(workflow.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleWorkflow(workflow.id, workflow.enabled)}
                      className={workflow.enabled ? 'bg-green-500/10 text-green-600 border-green-600/50' : ''}
                    >
                      {workflow.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>

                    <Link href={`/dashboard/workflows/${workflow.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600/50 hover:bg-red-500/10"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
