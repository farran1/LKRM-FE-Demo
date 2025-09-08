import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
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
    
    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get mention notifications with note content and mentioned_by user info
    const { data: notifications, error: notificationsError } = await supabase
      .from('mention_notifications')
      .select(`
        *,
        quick_notes!inner(
          content,
          created_at
        ),
        mentioned_by_user:mentioned_by(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Transform the data to include user names
    const transformedNotifications = notifications?.map(notification => ({
      id: notification.id,
      note_id: notification.note_id,
      mentioned_by: notification.mentioned_by,
      is_read: notification.is_read,
      created_at: notification.created_at,
      read_at: notification.read_at,
      note_content: notification.quick_notes?.content,
      mentioned_by_name: notification.mentioned_by_user?.raw_user_meta_data?.full_name || 
                         notification.mentioned_by_user?.email?.split('@')[0] || 
                         'Unknown User'
    })) || []

    return NextResponse.json({ notifications: transformedNotifications })
  } catch (error) {
    console.error('Error in GET /api/notifications/mentions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
