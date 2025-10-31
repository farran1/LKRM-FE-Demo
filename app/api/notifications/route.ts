import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing')
  }
  return { supabaseUrl, supabaseAnonKey }
}

export async function GET(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create a Supabase client with the JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('mention_notifications')
      .select(`
        *,
        quick_notes(
          id,
          content,
          color,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Get user information for mentioned_by users
    const mentionedByUserIds = [...new Set((notifications || []).map(n => n.mentioned_by))]
    const { data: users } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, full_name')
      .in('id', mentionedByUserIds)

    const userMap = new Map((users || []).map(u => [u.id, u]))

    // Transform the data with real user information
    const transformedNotifications = (notifications || []).map((notification: any) => {
      const mentionedByUser = userMap.get(notification.mentioned_by)
      const mentionedBy = mentionedByUser ? {
        id: mentionedByUser.id,
        name: mentionedByUser.full_name || `${mentionedByUser.first_name} ${mentionedByUser.last_name}`.trim() || mentionedByUser.email.split('@')[0],
        email: mentionedByUser.email,
        initials: (mentionedByUser.full_name || `${mentionedByUser.first_name} ${mentionedByUser.last_name}`.trim() || mentionedByUser.email.split('@')[0])
          .split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
      } : {
        id: notification.mentioned_by || 'unknown',
        name: 'Unknown User',
        email: 'unknown@example.com',
        initials: 'U'
      }

      return {
        id: notification.id,
        type: notification.note_id ? 'mention' : 'assignment',
        noteId: notification.note_id,
        mentionedBy: mentionedBy,
        note: notification.quick_notes,
        isRead: notification.is_read,
        createdAt: notification.created_at,
        readAt: notification.read_at
      }
    })

    return NextResponse.json({ notifications: transformedNotifications })
  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create a Supabase client with the JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAsRead } = body

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'Notification IDs are required' }, { status: 400 })
    }

    const updateData: any = {}
    if (markAsRead) {
      updateData.is_read = true
      updateData.read_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('mention_notifications')
      .update(updateData)
      .in('id', notificationIds)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating notifications:', error)
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PUT /api/notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
