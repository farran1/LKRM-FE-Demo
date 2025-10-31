import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { eventIds } = await request.json()
    
    if (!eventIds || !Array.isArray(eventIds)) {
      return NextResponse.json(
        { error: 'eventIds array is required' },
        { status: 400 }
      )
    }

    // Check for existing data in both game_stats and live_game_events
    const dataStatus: Record<number, boolean> = {}

    for (const eventId of eventIds) {
      let hasData = false
      console.log(`🔍 Checking data for event ${eventId}`)

      // Check if there's a games record for this event
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('id')
        .eq('eventId', eventId)
        .single()

      console.log(`📊 Games check for event ${eventId}:`, { game, gameError })

      if (game) {
        // Check if there's data in game_stats
        const { count: gameStatsCount, error: gameStatsError } = await supabase
          .from('game_stats')
          .select('*', { count: 'exact', head: true })
          .eq('gameId', game.id)

        console.log(`📈 Game stats check for event ${eventId}:`, { gameStatsCount, gameStatsError })

        if (gameStatsCount && gameStatsCount > 0) {
          hasData = true
        }
      }

      // Check if there's data in live_game_events
      if (!hasData) {
        const { data: liveSession, error: liveSessionError } = await supabase
          .from('live_game_sessions')
          .select('id')
          .eq('event_id', eventId)
          .eq('is_active', true)
          .single()

        console.log(`🎮 Live session check for event ${eventId}:`, { liveSession, liveSessionError })

        if (liveSession) {
          const { count: liveEventsCount, error: liveEventsError } = await supabase
            .from('live_game_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', liveSession.id)

          console.log(`⚡ Live events check for event ${eventId}:`, { liveEventsCount, liveEventsError })

          if (liveEventsCount && liveEventsCount > 0) {
            hasData = true
          }
        }
      }

      console.log(`✅ Final result for event ${eventId}: hasData = ${hasData}`)
      dataStatus[eventId] = hasData
    }

    return NextResponse.json({ data: dataStatus })
  } catch (error) {
    console.error('Error checking event data:', error)
    return NextResponse.json(
      { error: 'Failed to check event data' },
      { status: 500 }
    )
  }
}
