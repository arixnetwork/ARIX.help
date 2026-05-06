import { createClient } from '@/lib/supabase/server'
import { hasAdminPermission, logAdminAction } from '@/lib/admin/auth'
import { getAIModels, getAIModelById, createAIModel, updateAIModel, toggleAIModelStatus } from '@/lib/db/admin-queries'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Simple hash function for API keys (not for production - use proper encryption)
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await hasAdminPermission(user.id, 'models:view')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const models = await getAIModels()
    
    // Mask API key hashes for security
    const safeModels = models.map(model => ({
      ...model,
      api_key_hash: model.api_key_hash.substring(0, 8) + '...'
    }))

    return NextResponse.json(safeModels)
  } catch (error) {
    console.error('[v0] Get models error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const hasPermission = await hasAdminPermission(user.id, 'models:add')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { modelName, provider, apiKey, parameters = {} } = body

    if (!modelName || !provider || !apiKey) {
      return NextResponse.json(
        { error: 'Model name, provider, and API key required' },
        { status: 400 }
      )
    }

    const apiKeyHash = hashApiKey(apiKey)
    const result = await createAIModel(modelName, provider, apiKeyHash, parameters, user.id)

    if (result) {
      await logAdminAction(
        supabase,
        user.id,
        'create_model',
        'ai_model',
        result.id,
        { modelName, provider }
      )
    }

    return NextResponse.json(result || { error: 'Creation failed' })
  } catch (error) {
    console.error('[v0] Create model error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
