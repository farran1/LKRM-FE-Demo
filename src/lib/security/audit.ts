import { supabase } from '@/lib/supabase'

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
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_INPUT = 'invalid_input',
  
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
      
      // Log to database
      const { error } = await supabase
        .from('security_audit_logs')
        .insert({
          user_id: entry.userId,
          user_email: entry.userEmail,
          user_role: entry.userRole,
          action: entry.action,
          severity: entry.severity,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          details: entry.details,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          session_id: entry.sessionId,
          success: entry.success,
          error_message: entry.errorMessage,
          metadata: entry.metadata
        })
      
      if (error) {
        console.error('Failed to log audit entry to database:', error)
        // Fallback to console logging in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 AUDIT LOG:', entry)
        }
      }
      
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

  // Method to get audit logs with filtering
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate.toISOString())
      }
      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate.toISOString())
      }
      if (filter.userId) {
        query = query.eq('user_id', filter.userId)
      }
      if (filter.action) {
        query = query.eq('action', filter.action)
      }
      if (filter.severity) {
        query = query.eq('severity', filter.severity)
      }
      if (filter.resourceType) {
        query = query.eq('resource_type', filter.resourceType)
      }
      if (filter.success !== undefined) {
        query = query.eq('success', filter.success)
      }
      if (filter.limit) {
        query = query.limit(filter.limit)
      }
      if (filter.offset) {
        query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch audit logs:', error)
        return []
      }

      if (!data) return []
      // Map DB rows to AuditLogEntry shape
      return data.map((row: any) => ({
        id: row.id ?? this.generateId(),
        timestamp: new Date(row.timestamp ?? row.created_at ?? Date.now()),
        userId: row.user_id ?? 'unknown',
        userEmail: row.user_email ?? 'unknown',
        userRole: row.user_role ?? 'unknown',
        action: row.action,
        severity: row.severity,
        resourceType: row.resource_type ?? 'unknown',
        resourceId: row.resource_id ?? undefined,
        details: row.details ?? {},
        ipAddress: row.ip_address ?? 'unknown',
        userAgent: row.user_agent ?? 'unknown',
        sessionId: row.session_id ?? 'unknown',
        success: row.success ?? false,
        errorMessage: row.error_message ?? undefined,
        metadata: row.metadata ?? {}
      })) as AuditLogEntry[]
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }
  }

  // Method to get security events
  async getSecurityEvents(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch security events:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching security events:', error)
      return []
    }
  }
}

export const auditLogger = AuditLogger.getInstance()
