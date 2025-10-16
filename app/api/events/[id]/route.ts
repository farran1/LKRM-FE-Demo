import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../../src/services/supabase-api'
import { createClient } from '@supabase/supabase-js'
import { createServerClientWithAuth } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { id: idStr } = await params
    const id = Number(idStr)
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_types(id, name, color),
        event_coaches(coachUsername)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json({ event: data })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id: idStr } = await params
    const id = Number(idStr)
    const api = new SupabaseAPI()
    const updated = await api.updateEvent(id, body)

    // Upsert event_coaches from members (array of email addresses)
    if (Array.isArray(body?.members)) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const emails: string[] = body.members.filter((v: any) => typeof v === 'string' && v.trim() !== '')
      await supabase.from('event_coaches').delete().eq('eventId', id)
      if (emails.length > 0) {
        await supabase
          .from('event_coaches')
          .upsert(emails.map((email) => ({ eventId: id, coachUsername: email })), { onConflict: 'eventId,coachUsername' })
      }
    }
    return NextResponse.json({ event: updated })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = Number(idStr)
    
    // Get the authenticated user
    const { client: supabaseAuth, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      console.error('API DELETE /events/[id] - Not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    console.log('API DELETE /events/[id] - Authenticated user:', user.email, user.id)
    console.log('API DELETE /events/[id] - Attempting to delete event ID:', id)
    console.log('API DELETE /events/[id] - User ID type:', typeof user.id)
    console.log('API DELETE /events/[id] - Event ID type:', typeof id)
    
    // Use service role key since RLS is disabled on events table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // First, let's check if the event exists and belongs to the user
    console.log('API DELETE /events/[id] - Querying for event with ID:', id, 'and createdBy:', user.id)
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id, createdBy, name')
      .eq('id', id)
      .eq('createdBy', user.id) // Only fetch events owned by this user
      .single()
    
    console.log('API DELETE /events/[id] - Query result:', { existingEvent, fetchError })
    
    if (fetchError) {
      console.error('API DELETE /events/[id] - Error fetching event:', fetchError)
      console.error('API DELETE /events/[id] - Error details:', JSON.stringify(fetchError, null, 2))
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      )
    }
    
    console.log('API DELETE /events/[id] - Found event:', existingEvent)
    
    // Delete the event itself - Foreign key constraints with CASCADE will handle related data automatically
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('API DELETE /events/[id] - Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete event', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('API DELETE /events/[id] - Successfully deleted event:', id)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
