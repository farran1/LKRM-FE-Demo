import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'
import { auditLogger, AuditAction, AuditSeverity } from '@/lib/security/audit'

// Force Node.js runtime
export const runtime = 'nodejs'

// Allow all authenticated users to access this endpoint
export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    // Use the authenticated client to fetch users from the public.users table
    // This respects RLS policies and doesn't require service role key
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        full_name,
        avatar_url,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      
      await auditLogger.logSecurityEvent(
        user.id,
        user.email || 'unknown@example.com',
        user.user_metadata?.role || 'user',
        AuditAction.SUSPICIOUS_ACTIVITY,
        {
          endpoint: '/api/users',
          error: error.message
        },
        AuditSeverity.HIGH
      )

      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Log the user list access
    await auditLogger.logUserAction(
      user.id,
      user.email || 'unknown@example.com',
      user.user_metadata?.role || 'user',
      AuditAction.USER_UPDATED,
      'users',
      undefined,
      { userCount: users?.length || 0 },
      AuditSeverity.LOW
    )

    return NextResponse.json({
      success: true,
      data: users || [],
      count: users?.length || 0
    })

  } catch (error) {
    console.error('Error in GET /api/users:', error)
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    await auditLogger.logSecurityEvent(
      'unknown',
      'unknown',
      'unknown',
      AuditAction.SUSPICIOUS_ACTIVITY,
      {
        endpoint: '/api/users',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      AuditSeverity.HIGH
    )

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}