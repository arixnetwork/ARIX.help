import { createClient } from '@/lib/supabase/server'
import type { AdminRole } from './roles'

export async function getAdminUser(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select(
        `
        id,
        user_id,
        role_id,
        assigned_at,
        admin_roles:role_id (
          id,
          name,
          description,
          permissions
        )
      `
      )
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[v0] Error fetching admin user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Error in getAdminUser:', error)
    return null
  }
}

export async function getUserRole(userId: string): Promise<AdminRole | null> {
  const adminUser = await getAdminUser(userId)
  
  if (!adminUser) {
    return null
  }

  return adminUser.admin_roles?.name || null
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role !== null
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId)
  return role === 'superadmin'
}

export async function hasAdminPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const adminUser = await getAdminUser(userId)
  
  if (!adminUser) {
    return false
  }

  const permissions = adminUser.admin_roles?.permissions || []
  return permissions.includes(permission)
}

export async function logAdminAction(
  supabase: any,
  adminUserId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  changes?: any,
  status: 'success' | 'failure' = 'success',
  errorMessage?: string
) {
  try {
    await supabase.from('admin_logs').insert({
      admin_user_id: adminUserId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      changes: changes ? JSON.stringify(changes) : null,
      status,
      error_message: errorMessage,
    })
  } catch (error) {
    console.error('[v0] Error logging admin action:', error)
  }
}
