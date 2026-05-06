// Admin roles and permissions

export type AdminRole = 'superadmin' | 'admin' | 'moderator';

export type AdminPermission = 
  | 'users:view'
  | 'users:edit'
  | 'users:delete'
  | 'models:view'
  | 'models:edit'
  | 'models:add'
  | 'models:delete'
  | 'settings:edit'
  | 'pricing:manage'
  | 'analytics:view'
  | 'admin:manage'
  | 'logs:view';

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  superadmin: [
    'users:view',
    'users:edit',
    'users:delete',
    'models:view',
    'models:edit',
    'models:add',
    'models:delete',
    'settings:edit',
    'pricing:manage',
    'analytics:view',
    'admin:manage',
    'logs:view',
  ],
  admin: [
    'users:view',
    'users:edit',
    'models:view',
    'models:edit',
    'settings:edit',
    'pricing:manage',
    'analytics:view',
    'logs:view',
  ],
  moderator: [
    'users:view',
    'models:view',
    'analytics:view',
    'logs:view',
  ],
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  superadmin: 'Full system access - manage everything',
  admin: 'Manage users, models, settings, and pricing',
  moderator: 'View-only access with limited user management',
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canManageUsers(role: AdminRole): boolean {
  return hasPermission(role, 'users:edit');
}

export function canManageModels(role: AdminRole): boolean {
  return hasPermission(role, 'models:edit');
}

export function canManageSettings(role: AdminRole): boolean {
  return hasPermission(role, 'settings:edit');
}

export function canManagePricing(role: AdminRole): boolean {
  return hasPermission(role, 'pricing:manage');
}

export function canViewAnalytics(role: AdminRole): boolean {
  return hasPermission(role, 'analytics:view');
}

export function canManageAdmins(role: AdminRole): boolean {
  return hasPermission(role, 'admin:manage');
}

export function canViewLogs(role: AdminRole): boolean {
  return hasPermission(role, 'logs:view');
}
