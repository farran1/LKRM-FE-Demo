export enum UserRole {
  SUPER_ADMIN = 'super_admin',      // Platform owner - full access
  SCHOOL_ADMIN = 'school_admin',    // School district admin
  COACH = 'coach',                  // Team coach
  ASSISTANT_COACH = 'assistant_coach', // Assistant coach
  PLAYER = 'player',                // Student athlete
  PARENT = 'parent',                // Parent/guardian
  VIEWER = 'viewer'                 // Read-only access
}

export interface RolePermissions {
  canViewExpenses: boolean
  canCreateExpenses: boolean
  canEditExpenses: boolean
  canDeleteExpenses: boolean
  canViewReceipts: boolean
  canUploadReceipts: boolean
  canViewBudgets: boolean
  canEditBudgets: boolean
  canViewEvents: boolean
  canEditEvents: boolean
  canViewUsers: boolean
  canEditUsers: boolean
  canViewAuditLogs: boolean
  canAccessAdminPanel: boolean
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.SUPER_ADMIN]: {
    canViewExpenses: true,
    canCreateExpenses: true,
    canEditExpenses: true,
    canDeleteExpenses: true,
    canViewReceipts: true,
    canUploadReceipts: true,
    canViewBudgets: true,
    canEditBudgets: true,
    canViewEvents: true,
    canEditEvents: true,
    canViewUsers: true,
    canEditUsers: true,
    canViewAuditLogs: true,
    canAccessAdminPanel: true
  },
  [UserRole.SCHOOL_ADMIN]: {
    canViewExpenses: true,
    canCreateExpenses: true,
    canEditExpenses: true,
    canDeleteExpenses: true,
    canViewReceipts: true,
    canUploadReceipts: true,
    canViewBudgets: true,
    canEditBudgets: true,
    canViewEvents: true,
    canEditEvents: true,
    canViewUsers: true,
    canEditUsers: false,
    canViewAuditLogs: true,
    canAccessAdminPanel: true
  },
  [UserRole.COACH]: {
    canViewExpenses: true,
    canCreateExpenses: true,
    canEditExpenses: true,
    canDeleteExpenses: false,
    canViewReceipts: true,
    canUploadReceipts: true,
    canViewBudgets: true,
    canEditBudgets: false,
    canViewEvents: true,
    canEditEvents: true,
    canViewUsers: false,
    canEditUsers: false,
    canViewAuditLogs: false,
    canAccessAdminPanel: false
  },
  [UserRole.ASSISTANT_COACH]: {
    canViewExpenses: true,
    canCreateExpenses: true,
    canEditExpenses: false,
    canDeleteExpenses: false,
    canViewReceipts: true,
    canUploadReceipts: true,
    canViewBudgets: true,
    canEditBudgets: false,
    canViewEvents: true,
    canEditEvents: false,
    canViewUsers: false,
    canEditUsers: false,
    canViewAuditLogs: false,
    canAccessAdminPanel: false
  },
  [UserRole.PLAYER]: {
    canViewExpenses: false,
    canCreateExpenses: false,
    canEditExpenses: false,
    canDeleteExpenses: false,
    canViewReceipts: false,
    canUploadReceipts: false,
    canViewBudgets: false,
    canEditBudgets: false,
    canViewEvents: true,
    canEditEvents: false,
    canViewUsers: false,
    canEditUsers: false,
    canViewAuditLogs: false,
    canAccessAdminPanel: false
  },
  [UserRole.PARENT]: {
    canViewExpenses: true,
    canCreateExpenses: false,
    canEditExpenses: false,
    canDeleteExpenses: false,
    canViewReceipts: true,
    canUploadReceipts: false,
    canViewBudgets: true,
    canEditBudgets: false,
    canViewEvents: true,
    canEditEvents: false,
    canViewUsers: false,
    canEditUsers: false,
    canViewAuditLogs: false,
    canAccessAdminPanel: false
  },
  [UserRole.VIEWER]: {
    canViewExpenses: true,
    canCreateExpenses: false,
    canEditExpenses: false,
    canDeleteExpenses: false,
    canViewReceipts: false,
    canUploadReceipts: false,
    canViewBudgets: true,
    canEditBudgets: false,
    canViewEvents: true,
    canEditEvents: false,
    canViewUsers: false,
    canEditUsers: false,
    canViewAuditLogs: false,
    canAccessAdminPanel: false
  }
}

export function hasPermission(userRole: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[userRole]?.[permission] || false
}

export function requirePermission(permission: keyof RolePermissions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      // This will be implemented with actual user context
      // For now, return the original method
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}
