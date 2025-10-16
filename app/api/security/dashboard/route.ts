import { NextRequest, NextResponse } from 'next/server'
import { withAuth, requireRole, AuthenticatedRequest, AuthContext } from '@/lib/auth-middleware'
import { auditLogger, AuditAction, AuditSeverity } from '@/lib/security/audit'
import { supabase } from '@/lib/supabase'

// Force Node.js runtime
export const runtime = 'nodejs'

// Get security dashboard data
async function getSecurityDashboardHandler(
  request: AuthenticatedRequest,
  context: AuthContext
) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    const limit = parseInt(searchParams.get('limit') || '100')

    // Calculate time range
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    // Get security events
    const { data: securityEvents, error: eventsError } = await supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (eventsError) {
      throw new Error(`Failed to fetch security events: ${eventsError.message}`)
    }

    // Get audit logs
    const { data: auditLogs, error: logsError } = await supabase
      .from('security_audit_logs')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (logsError) {
      throw new Error(`Failed to fetch audit logs: ${logsError.message}`)
    }

    // Calculate statistics
    const stats = {
      totalEvents: securityEvents?.length || 0,
      criticalEvents: securityEvents?.filter(e => e.severity === 'critical').length || 0,
      highSeverityEvents: securityEvents?.filter(e => e.severity === 'high').length || 0,
      unresolvedEvents: securityEvents?.filter(e => !e.resolved).length || 0,
      recentActivity: auditLogs?.length || 0,
      failedLogins: auditLogs?.filter(log => log.action === 'login_attempt_failed').length || 0,
      permissionDenied: auditLogs?.filter(log => log.action === 'permission_denied').length || 0,
      suspiciousActivity: auditLogs?.filter(log => log.action === 'suspicious_activity').length || 0
    }

    // Get top actions
    const actionCounts = auditLogs?.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }))

    // Get severity breakdown
    const severityCounts = auditLogs?.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const severityBreakdown = Object.entries(severityCounts)
      .map(([severity, count]) => ({ severity, count }))

    // Get user activity
    const userActivity = auditLogs?.reduce((acc, log) => {
      if (log.user_email) {
        acc[log.user_email] = (acc[log.user_email] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    const topUsers = Object.entries(userActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([email, count]) => ({ email, count }))

    // Log the security dashboard access
    await auditLogger.logUserAction(
      context.user.id,
      context.user.email ?? 'unknown',
      context.user.user_metadata?.role || 'user',
      AuditAction.SYSTEM_CONFIG_CHANGED,
      'security_dashboard',
      undefined,
      { timeRange, limit },
      AuditSeverity.LOW
    )

    return NextResponse.json({
      success: true,
      data: {
        stats,
        securityEvents: securityEvents || [],
        auditLogs: auditLogs || [],
        topActions,
        severityBreakdown,
        topUsers,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Security dashboard API error:', error)
    
    await auditLogger.logSecurityEvent(
      context.user.id,
      context.user.email ?? 'unknown',
      context.user.user_metadata?.role || 'user',
      AuditAction.SUSPICIOUS_ACTIVITY,
      {
        endpoint: '/api/security/dashboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      AuditSeverity.HIGH
    )

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch security data',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Resolve security events
async function resolveSecurityEventHandler(
  request: AuthenticatedRequest,
  context: AuthContext
) {
  try {
    const body = await request.json()
    const { eventId, action, notes } = body

    if (!eventId || !action) {
      return NextResponse.json(
        { success: false, error: 'Event ID and action are required' },
        { status: 400 }
      )
    }

    if (!['resolve', 'dismiss', 'escalate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be resolve, dismiss, or escalate' },
        { status: 400 }
      )
    }

    // Update the security event
    const updateData: any = {
      resolved: action === 'resolve',
      resolved_at: action === 'resolve' ? new Date().toISOString() : null,
      resolved_by: context.user.id
    }

    if (notes) {
      updateData.resolution_notes = notes
    }

    const { data, error } = await supabase
      .from('security_events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update security event: ${error.message}`)
    }

    // Log the action
    await auditLogger.logUserAction(
      context.user.id,
      context.user.email ?? 'unknown',
      context.user.user_metadata?.role || 'user',
      AuditAction.SYSTEM_CONFIG_CHANGED,
      'security_event',
      eventId,
      { action, notes },
      AuditSeverity.MEDIUM
    )

    return NextResponse.json({
      success: true,
      data,
      message: `Security event ${action}d successfully`
    })

  } catch (error) {
    console.error('Security event resolution error:', error)
    
    await auditLogger.logSecurityEvent(
      context.user.id,
      context.user.email ?? 'unknown',
      context.user.user_metadata?.role || 'user',
      AuditAction.SUSPICIOUS_ACTIVITY,
      {
        endpoint: '/api/security/dashboard',
        action: 'resolve_event',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      AuditSeverity.HIGH
    )

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to resolve security event',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

// Export the handlers with proper middleware
export const GET = async (request: NextRequest) => {
  const handler = await requireRole(['admin', 'super_admin'])(getSecurityDashboardHandler)
  return handler(request, {} as AuthContext)
}

export const POST = async (request: NextRequest) => {
  const handler = await requireRole(['admin', 'super_admin'])(resolveSecurityEventHandler)
  return handler(request, {} as AuthContext)
}
