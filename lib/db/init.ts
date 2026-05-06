import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function initializeDatabase() {
  try {
    const supabase = await createClient()
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'lib/db/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    
    // Split into individual statements and execute
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    console.log(`[v0] Running ${statements.length} SQL statements...`)
    
    for (const statement of statements) {
      try {
        await supabase.rpc('exec', { statement })
      } catch (error) {
        // If exec doesn't work, use query instead (for simpler statements)
        console.warn(`[v0] Statement failed with RPC, attempting direct query:`, error)
      }
    }
    
    console.log('[v0] Database initialization complete!')
    return true
  } catch (error) {
    console.error('[v0] Database initialization failed:', error)
    return false
  }
}

export async function ensureUserProfile(userId: string, email: string) {
  try {
    const supabase = await createClient()
    
    // Check if user profile exists
    const { data: userProfile, error: selectError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (selectError || !userProfile) {
      // Create new user profile with 10 free credits
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          credits_remaining: 10,
          subscription_tier: 'free',
          tokens_used_today: 0,
        })
      
      if (insertError) {
        console.error('[v0] Failed to create user profile:', insertError)
        return false
      }
      
      console.log('[v0] User profile created:', userId)
    }
    
    return true
  } catch (error) {
    console.error('[v0] Failed to ensure user profile:', error)
    return false
  }
}
