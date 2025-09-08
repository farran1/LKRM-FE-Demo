export enum AuditAction {
  // User Management
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  
  // Expense Management
  EXPENSE_CREATED = 'expense_created',
  EXPENSE_UPDATED = 'expense_updated',
  EXPENSE_DELETED = 'expense_deleted',
  EXPENSE_VIEWED = 'expense_viewed',
  
  // Receipt Management
  RECEIPT_UPLOADED = 'receipt_uploaded',
  RECEIPT_DOWNLOADED = 'receipt_downloaded',
  RECEIPT_DELETED = 'receipt_deleted',
  RECEIPT_VIEWED = 'receipt_viewed',
  
  // Budget Management
  BUDGET_CREATED = 'budget_created',
  BUDGET_UPDATED = 'budget_updated',
  BUDGET_DELETED = 'budget_deleted',
  BUDGET_VIEWED = 'budget_viewed',
  
  // Event Management
  EVENT_CREATED = 'event_created',
  EVENT_UPDATED = 'event_updated',
  EVENT_DELETED = 'event_deleted',
  EVENT_VIEWED = 'event_viewed',
  
  // Security Events
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  LOGIN_ATTEMPT_FAILED = 'login_attempt_failed',
  SESSION_EXPIRED = 'session_expired',
  
  // Data Access
  DATA_EXPORTED = 'data_exported',
  DATA_IMPORTED = 'data_imported',
  BULK_OPERATION = 'bulk_operation',
  
  // System Events
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',
  BACKUP_CREATED = 'backup_created',
  MAINTENANCE_MODE = 'maintenance_mode'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  userEmail: string
  userRole: string
  action: AuditAction
  severity: AuditSeverity
  resourceType: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  sessionId: string
  success: boolean
  errorMessage?: string
  metadata: Record<string, any>
}

export interface AuditLogFilter {
  startDate?: Date
  endDate?: Date
  userId?: string
  action?: AuditAction
  severity?: AuditSeverity
  resourceType?: string
  success?: boolean
  limit?: number
  offset?: number
}

export class AuditLogger {
  private static instance: AuditLogger
  
  private constructor() {}
  
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }
  
  async log(params: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const entry: AuditLogEntry = {
        ...params,
        id: this.generateId(),
        timestamp: new Date()
      }
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 AUDIT LOG:', entry)
      }
      
      // TODO: Implement actual audit log storage
      // This should go to a secure, immutable audit log table
      // and potentially to an external SIEM system
      
    } catch (error) {
      console.error('Failed to log audit entry:', error)
      // Don't throw - audit logging should never break main functionality
    }
  }
  
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }
  
  // Convenience methods for common audit actions
  async logUserAction(
    userId: string,
    userEmail: string,
    userRole: string,
    action: AuditAction,
    resourceType: string,
    resourceId?: string,
    details: Record<string, any> = {},
    severity: AuditSeverity = AuditSeverity.LOW
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      severity,
      resourceType,
      resourceId,
      details,
      ipAddress: 'unknown', // Will be filled by middleware
      userAgent: 'unknown', // Will be filled by middleware
      sessionId: 'unknown', // Will be filled by middleware
      success: true,
      metadata: {}
    })
  }
  
  async logSecurityEvent(
    userId: string,
    userEmail: string,
    userRole: string,
    action: AuditAction,
    details: Record<string, any> = {},
    severity: AuditSeverity = AuditSeverity.MEDIUM
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      severity,
      resourceType: 'security',
      details,
      ipAddress: 'unknown',
      userAgent: 'unknown',
      sessionId: 'unknown',
      success: false,
      metadata: {}
    })
  }
}

export const auditLogger = AuditLogger.getInstance()
