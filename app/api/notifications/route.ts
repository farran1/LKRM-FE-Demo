import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
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

    // Transform the data
    const transformedNotifications = (notifications || []).map((notification: any) => {
      // For now, we'll use placeholder data since we can't access auth.users directly
      const mentionedBy = {
        id: notification.mentioned_by || 'unknown',
        name: 'Coach',
        email: 'coach@example.com',
        initials: 'C'
      }

      return {
        id: notification.id,
        type: notification.note_id ? 'mention' : 'generic',
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
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
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
