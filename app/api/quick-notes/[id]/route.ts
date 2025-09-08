import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const noteId = parseInt(id)

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 })
    }

    const { data: note, error } = await supabase
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
      .eq('id', noteId)
      .eq('created_by', user.id)
      .single()

    if (error) {
      console.error('Error fetching note:', error)
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error in GET /api/quick-notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const noteId = parseInt(id)

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 })
    }

    const body = await request.json()
    const { content, color, position_x, position_y, is_pinned, mentions } = body

    // Update the quick note
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (content !== undefined) updateData.content = content
    if (color !== undefined) updateData.color = color
    if (position_x !== undefined) updateData.position_x = position_x
    if (position_y !== undefined) updateData.position_y = position_y
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned

    const { data: note, error: noteError } = await supabase
      .from('quick_notes')
      .update(updateData)
      .eq('id', noteId)
      .eq('created_by', user.id)
      .select()
      .single()

    if (noteError) {
      console.error('Error updating note:', noteError)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    // Update mentions if provided
    if (mentions !== undefined) {
      // Remove existing mentions
      await supabase
        .from('coach_mentions')
        .delete()
        .eq('note_id', noteId)

      // Add new mentions
      if (mentions.length > 0) {
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

        // Resolve mentions
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
              note_id: noteId,
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
            console.error('Error updating mentions:', mentionsError)
          }

          // Create notifications for mentioned users
          const notificationInserts = validMentions.map((mention: any) => {
            const username = String(mention.text || '').replace('@', '')
            const resolvedId = mention.userId || (userMap ? userMap.get(username) : null)
            return {
              user_id: resolvedId,
              note_id: noteId,
              mentioned_by: user.id
            }
          })

          await supabase
            .from('mention_notifications')
            .insert(notificationInserts)
        }
      }
    }

    // Fetch the complete updated note
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
      .eq('id', noteId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated note:', fetchError)
      return NextResponse.json({ note }, { status: 200 })
    }

    return NextResponse.json({ note: completeNote })
  } catch (error) {
    console.error('Error in PUT /api/quick-notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const noteId = parseInt(id)

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 })
    }

    // Fetch note to log prior to deletion
    const { data: existingNote } = await supabase
      .from('quick_notes')
      .select('*')
      .eq('id', noteId)
      .eq('created_by', user.id)
      .single()

    // Insert audit log (best-effort) before delete
    try {
      await supabase
        .from('audit_logs')
        .insert({
          userId: null, // user.id is UUID; column is integer in current schema
          action: 'DELETE',
          table: 'quick_notes',
          recordId: noteId,
          oldData: existingNote || null,
          newData: null,
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null
        })
    } catch (logErr) {
      console.error('Audit log insert failed (DELETE quick_note):', logErr)
    }

    const { error } = await supabase
      .from('quick_notes')
      .delete()
      .eq('id', noteId)
      .eq('created_by', user.id)

    if (error) {
      console.error('Error deleting note:', error)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/quick-notes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
