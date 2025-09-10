import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fvmsotuqcwftwknbojwp.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const sessionKey = searchParams.get('sessionKey')
    const type = searchParams.get('type')

    if (type === 'sessions' && eventId) {
      // Get all live game sessions for an event
      const { data: sessions, error } = await supabase
        .from('live_game_sessions')
        .select(`
          *,
          live_game_events (*)
        `)
        .eq('event_id', eventId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ success: true, data: sessions })
    }

    if (type === 'check-existing' && eventId) {
      // Check if there's an existing active session for an event
      const { data: existingSession, error } = await supabase
        .from('live_game_sessions')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
      }

      return NextResponse.json({ 
        success: true, 
        data: existingSession || null,
        exists: !!existingSession
      })
    }

    if (type === 'check-game' && eventId) {
      // Check if there's an existing game for an event
      const { data: existingGame, error } = await supabase
        .from('games')
        .select('id')
        .eq('eventId', eventId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
      }

      return NextResponse.json({ 
        success: true, 
        data: existingGame || null,
        exists: !!existingGame
      })
    }

    if (type === 'session' && sessionKey) {
      // Get a specific session with all its data
      const { data: session, error } = await supabase
        .from('live_game_sessions')
        .select(`
          *,
          live_game_events (*)
        `)
        .eq('session_key', sessionKey)
        .single()

      if (error) {
        // If session not found, return empty data instead of error
        if (error.code === 'PGRST116') {
          return NextResponse.json({ 
            success: true, 
            data: { 
              id: null, 
              session_key: sessionKey, 
              live_game_events: [] 
            } 
          })
        }
        throw error
      }

      return NextResponse.json({ success: true, data: session })
    }

    if (type === 'events' && sessionKey) {
      // Get all events for a session
      // First get the session ID from the session key
      const { data: session, error: sessionError } = await supabase
        .from('live_game_sessions')
        .select('id')
        .eq('session_key', sessionKey)
        .single()

      if (sessionError) throw sessionError

      // Then get events using the session ID
      const { data: events, error } = await supabase
        .from('live_game_events')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      return NextResponse.json({ success: true, data: events })
    }

    // Default: return error for invalid request
    return NextResponse.json(
      { success: false, error: 'Invalid request parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Live stat tracker GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'create-session':
        // First, check if a game already exists for this event
        let gameId = null
        const { data: existingGame, error: gameCheckError } = await supabase
          .from('games')
          .select('id')
          .eq('eventId', data.eventId)
          .single()

        if (gameCheckError && gameCheckError.code !== 'PGRST116') {
          throw gameCheckError
        }

        if (existingGame) {
          gameId = existingGame.id
        } else {
          // Create a new game record
          const { data: newGame, error: gameError } = await supabase
            .from('games')
            .insert({
              eventId: data.eventId,
              opponent: data.opponent || 'Live Game Opponent',
              gameDate: data.gameDate || new Date().toISOString(),
              season: data.season || '2024-25',
              isPlayoffs: data.isPlayoffs || false,
              createdBy: data.createdBy,
              updatedBy: data.updatedBy || data.createdBy
            })
            .select('id')
            .single()

          if (gameError) throw gameError
          gameId = newGame.id
        }

        // Create a new live game session with the game_id
        const { data: session, error: sessionError } = await supabase
          .from('live_game_sessions')
          .insert({
            event_id: data.eventId,
            game_id: gameId,
            session_key: data.sessionKey,
            game_state: data.gameState,
            is_active: true,
            created_by: data.createdBy
          })
          .select()
          .single()

        if (sessionError) throw sessionError

        return NextResponse.json({ success: true, data: session })

      case 'create-game':
        // Create a new game record
        const { data: newGame, error: gameError } = await supabase
          .from('games')
          .insert({
            eventId: data.eventId,
            opponent: data.opponent || 'Live Game Opponent',
            gameDate: data.gameDate || new Date().toISOString(),
            season: data.season || '2024-25',
            isPlayoffs: data.isPlayoffs || false,
            createdBy: data.createdBy,
            updatedBy: data.updatedBy || data.createdBy
          })
          .select('id')
          .single()

        if (gameError) throw gameError

        return NextResponse.json({ success: true, data: newGame })

      case 'record-event':
        // Record a game event
        console.log('Recording event with data:', data)
        
        // First check if the table exists
        const { data: tableCheck, error: tableError } = await supabase
          .from('live_game_events')
          .select('id')
          .limit(1)

        if (tableError) {
          console.error('Table check error:', tableError)
          return NextResponse.json({ 
            success: false, 
            error: `Table access error: ${tableError.message}` 
          }, { status: 400 })
        }

        // Get the game_id from the session
        const { data: sessionData, error: sessionLookupError } = await supabase
          .from('live_game_sessions')
          .select('game_id')
          .eq('id', data.sessionId)
          .single()

        if (sessionLookupError) {
          console.error('Session lookup error:', sessionLookupError)
          return NextResponse.json({ 
            success: false, 
            error: `Session lookup error: ${sessionLookupError.message}` 
          }, { status: 400 })
        }
        
        const { data: event, error: eventError } = await supabase
          .from('live_game_events')
          .insert({
            session_id: data.sessionId,
            game_id: sessionData.game_id, // Include the game_id from the session
            player_id: data.playerId,
            event_type: data.eventType,
            event_value: data.eventValue,
            quarter: data.quarter,
            game_time: data.gameTime,
            is_opponent_event: data.isOpponentEvent,
            opponent_jersey: data.opponentJersey,
            metadata: data.metadata
          })
          .select()
          .single()

        if (eventError) {
          console.error('Event insert error:', eventError)
          return NextResponse.json({ 
            success: false, 
            error: `Event insert error: ${eventError.message}` 
          }, { status: 400 })
        }

        console.log('Event recorded successfully:', event)
        return NextResponse.json({ success: true, data: event })

      case 'update-game-state':
        // Update the game state
        const { error: stateError } = await supabase
          .from('live_game_sessions')
          .update({ game_state: data.gameState })
          .eq('session_key', data.sessionKey)

        if (stateError) throw stateError

        return NextResponse.json({ success: true, message: 'Game state updated' })

      case 'end-session':
        // End a live game session
        const { error: endError } = await supabase
          .from('live_game_sessions')
          .update({ 
            is_active: false, 
            ended_at: new Date().toISOString() 
          })
          .eq('session_key', data.sessionKey)

        if (endError) throw endError

        return NextResponse.json({ success: true, message: 'Session ended' })

      case 'sync-offline-data':
        // Sync offline data to the database
        const { data: syncResult, error: syncError } = await supabase
          .from('live_game_sync_status')
          .upsert({
            session_id: data.sessionId,
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced',
            error_message: null,
            retry_count: 0
          })
          .select()
          .single()

        if (syncError) throw syncError

        return NextResponse.json({ success: true, data: syncResult })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Live stat tracker POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionKey, updates } = body

    // Update a live game session
    const { data, error } = await supabase
      .from('live_game_sessions')
      .update(updates)
      .eq('session_key', sessionKey)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Live stat tracker PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionKey = searchParams.get('sessionKey')

    if (!sessionKey) {
      return NextResponse.json(
        { success: false, error: 'Session key is required' },
        { status: 400 }
      )
    }

    // Delete a live game session and all related data
    // Note: This will cascade delete due to foreign key constraints
    const { error } = await supabase
      .from('live_game_sessions')
      .delete()
      .eq('session_key', sessionKey)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Session deleted' })

  } catch (error) {
    console.error('Live stat tracker DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
