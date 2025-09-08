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
    
    console.log('Quick notes GET - User:', user?.id)
    console.log('Quick notes GET - Auth Error:', authError)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Get total count first
    const { count: totalCount, error: countError } = await supabase
      .from('quick_notes')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)

    if (countError) {
      console.error('Error fetching notes count:', countError)
      return NextResponse.json({ error: 'Failed to fetch notes count' }, { status: 500 })
    }

    // Get quick notes with mentions
    const { data: notes, error: notesError } = await supabase
      .from('quick_notes')
      .select(`
        *,
        coach_mentions(
          mentioned_user_id,
          mention_text,
          start_position,
          end_position
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    console.log('Quick notes GET - Notes:', notes)
    console.log('Quick notes GET - Error:', notesError)
    console.log('Quick notes GET - Total Count:', totalCount)

    if (notesError) {
      console.error('Error fetching quick notes:', notesError)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({ 
      notes: notes || [], 
      total: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0)
    })
  } catch (error) {
    console.error('Error in GET /api/quick-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    
    console.log('Quick notes POST - User:', user?.id)
    console.log('Quick notes POST - Auth Error:', authError)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Quick notes POST - Body:', body)
    const { content, color, position_x, position_y, is_pinned, mentions } = body

    // Allow empty content for new notes
    if (content === undefined) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Create the quick note
    const { data: note, error: noteError } = await supabase
      .from('quick_notes')
      .insert({
        content,
        color: color || '#FFE66D',
        position_x: position_x || 0,
        position_y: position_y || 0,
        is_pinned: is_pinned || false,
        created_by: user.id
      })
      .select()
      .single()

    console.log('Quick notes POST - Note created:', note)
    console.log('Quick notes POST - Note error:', noteError)

    if (noteError) {
      console.error('Error creating quick note:', noteError)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    // Process mentions if provided
    if (mentions && mentions.length > 0) {
      // Prefer provided userId from the client; fallback to username mapping
      let userMap: Map<string, string> | null = null
      if (mentions.some((m: any) => !m.userId)) {
        const { data: allUsers, error: usersError } = await supabase
          .from('auth.users')
          .select('id, email')
        if (usersError) {
          console.error('Error looking up mentioned users:', usersError)
        }
        userMap = new Map()
        allUsers?.forEach(user => {
          const username = (user.email || '').split('@')[0]
          userMap!.set(username, user.id as any)
        })
      }

      const validMentions = mentions.filter((mention: any) => {
        if (mention.userId) return true
        const username = String(mention.text || '').replace('@', '')
        return userMap?.has(username)
      })

      if (validMentions.length > 0) {
        const mentionInserts = validMentions.map((mention: any) => {
          const username = String(mention.text || '').replace('@', '')
          const resolvedId = mention.userId || (userMap ? userMap.get(username) : null)
          return {
            note_id: note.id,
            mentioned_user_id: resolvedId,
            mention_text: mention.text,
            start_position: mention.startPosition,
            end_position: mention.endPosition
          }
        })

        const { error: mentionsError } = await supabase
          .from('coach_mentions')
          .insert(mentionInserts)

        if (mentionsError) {
          console.error('Error adding mentions:', mentionsError)
        }

        // Create notifications for mentioned users
        const notificationInserts = validMentions.map((mention: any) => {
          const username = String(mention.text || '').replace('@', '')
          const resolvedId = mention.userId || (userMap ? userMap.get(username) : null)
          return {
            user_id: resolvedId,
            note_id: note.id,
            mentioned_by: user.id
          }
        })

        await supabase
          .from('mention_notifications')
          .insert(notificationInserts)
      }
    }

    // Fetch the complete note with relationships
    const { data: completeNote, error: fetchError } = await supabase
      .from('quick_notes')
      .select(`
        *,
        coach_mentions(
          mentioned_user_id,
          mention_text,
          start_position,
          end_position
        )
      `)
      .eq('id', note.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete note:', fetchError)
      return NextResponse.json({ note }, { status: 201 })
    }

    return NextResponse.json({ note: completeNote }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quick-notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
