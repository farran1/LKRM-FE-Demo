import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../../src/services/supabase-api'
import { createClient } from '@supabase/supabase-js'

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

    // Upsert event_coaches from members (array of usernames)
    if (Array.isArray(body?.members)) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const usernames: string[] = body.members.filter((v: any) => typeof v === 'string' && v.trim() !== '')
      await supabase.from('event_coaches').delete().eq('eventId', id)
      if (usernames.length > 0) {
        await supabase
          .from('event_coaches')
          .upsert(usernames.map((u) => ({ eventId: id, coachUsername: u })), { onConflict: 'eventId,coachUsername' })
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
    const api = new SupabaseAPI()
    const result = await api.deleteEvent(id)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
