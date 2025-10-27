import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const noteId = parseInt(id)

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 })
    }

    const { data: note, error } = await (supabase as any)
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
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    if (!user) {
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

    const { data: note, error: noteError } = await (supabase as any)
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
      await (supabase as any)
        .from('coach_mentions')
        .delete()
        .eq('note_id', noteId)

      // Add new mentions
      if (mentions.length > 0) {
        // Only process mentions that have userId provided
        const validMentions = mentions.filter((mention: any) => {
          return mention.userId
        })

        if (validMentions.length > 0) {
          const mentionInserts = validMentions.map((mention: any) => ({
            note_id: noteId,
            mentioned_user_id: mention.userId,
            mention_text: mention.text,
            start_position: mention.startPosition,
            end_position: mention.endPosition
          }))

          const { error: mentionsError } = await (supabase as any)
            .from('coach_mentions')
            .insert(mentionInserts)

          if (mentionsError) {
            console.error('Error updating mentions:', mentionsError)
          }

          // Create notifications for mentioned users
          const notificationInserts = validMentions.map((mention: any) => ({
            user_id: mention.userId,
            note_id: noteId,
            mentioned_by: user.id
          }))

          await (supabase as any)
            .from('mention_notifications')
            .insert(notificationInserts)
        }
      }
    }

    // Fetch the complete updated note
    const { data: completeNote, error: fetchError } = await (supabase as any)
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
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const noteId = parseInt(id)

    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 })
    }

    // Log deletion attempt
    console.log('🗑️ Deleting note:', noteId, 'by user:', user.id)

    // First, delete related records to avoid foreign key constraint issues
    try {
      await (supabase as any).from('coach_mentions').delete().eq('note_id', noteId)
      console.log('✅ Deleted coach_mentions for note:', noteId)
    } catch (err) {
      console.error('⚠️ Error deleting coach_mentions:', err)
      // Continue anyway
    }

    try {
      await (supabase as any).from('mention_notifications').delete().eq('note_id', noteId)
      console.log('✅ Deleted mention_notifications for note:', noteId)
    } catch (err) {
      console.error('⚠️ Error deleting mention_notifications:', err)
      // Continue anyway
    }

    try {
      await (supabase as any).from('quick_note_tags').delete().eq('note_id', noteId)
      console.log('✅ Deleted quick_note_tags for note:', noteId)
    } catch (err) {
      console.error('⚠️ Error deleting quick_note_tags:', err)
      // Continue anyway
    }

    // Now delete the note itself
    const { error } = await (supabase as any)
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
