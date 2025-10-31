import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'
import { auditLogger, AuditAction, AuditSeverity } from '@/lib/security/audit'

// Force Node.js runtime
export const runtime = 'nodejs'

// Allow all authenticated users to access this endpoint
export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    // Build query
    let query = (supabase as any)
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
    
    // If ids parameter is provided, filter by those IDs
    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (ids.length > 0) {
        query = query.in('id', ids)
      }
    } else {
      // Default: order by created_at
      query = query.order('created_at', { ascending: false })
    }
    
    const { data: users, error } = await query

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

    // Transform users to include name and username fields
    const transformedUsers = (users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email?.split('@')[0] || 'Unknown',
      username: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email?.split('@')[0] || 'Unknown',
      first_name: u.first_name,
      last_name: u.last_name,
      full_name: u.full_name,
      avatar_url: u.avatar_url
    }))
    
    // If ids parameter was provided, return format expected by RecentActivityModule
    if (idsParam) {
      return NextResponse.json({
        users: transformedUsers
      })
    }
    
    // Default response format
    return NextResponse.json({
      success: true,
      data: transformedUsers,
      count: transformedUsers.length
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