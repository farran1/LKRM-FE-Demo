import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { sessionKey, events } = await request.json()
    
    if (!sessionKey || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Get the session ID from the session key
    const { data: session, error: sessionError } = await supabase
      .from('live_game_sessions')
      .select('id, event_id')
      .eq('session_key', sessionKey)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Insert all offline events
    const { data: insertedEvents, error: insertError } = await supabase
      .from('live_game_events')
      .insert(
        events.map((event: any) => ({
          session_id: session.id,
          event_type: event.eventType,
          event_value: event.eventValue,
          quarter: event.quarter,
          game_time: event.gameTime,
          is_opponent_event: event.isOpponentEvent,
          opponent_jersey: event.opponentJersey,
          metadata: event.metadata || {},
          sync_status: 'synced',
          created_at: new Date().toISOString()
        }))
      )
      .select()

    if (insertError) {
      console.error('Error inserting events:', insertError)
      return NextResponse.json(
        { error: 'Failed to sync events' },
        { status: 500 }
      )
    }

    // Update session sync status
    await supabase
      .from('live_game_sync_status')
      .upsert({
        session_id: session.id,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      syncedEvents: insertedEvents.length,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionKey = searchParams.get('sessionKey')
    
    if (!sessionKey) {
      return NextResponse.json(
        { error: 'Session key required' },
        { status: 400 }
      )
    }

    // Get sync status for the session
    const { data: syncStatus, error } = await supabase
      .from('live_game_sync_status')
      .select('*')
      .eq('session_id', (await supabase
        .from('live_game_sessions')
        .select('id')
        .eq('session_key', sessionKey)
        .single()
      ).data?.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to get sync status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      syncStatus
    })

  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
