import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    if (!url || !anon) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Supabase env vars are missing (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anon);
    const { eventId: eventIdStr } = await params;
    const eventId = parseInt(eventIdStr);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    console.log(`Fetching complete game log for event ID: ${eventId}`);

    // First, check if the event exists
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event:', eventError);
      return NextResponse.json(
        { error: 'Failed to fetch event data', details: eventError.message },
        { status: 500 }
      );
    }

    if (!eventData) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log('Event found:', eventData.name);

    // Try to fetch live game session data, but handle gracefully if tables don't exist
    let liveSessionData = null;
    let playByPlayData = [];
    let gameData = null;
    let playerStatsData = [];

    try {
      // Check if live_game_sessions table exists by trying a simple query
      const { data: sessionCheck, error: sessionCheckError } = await supabase
        .from('live_game_sessions')
        .select('id')
        .eq('event_id', eventId)
        .limit(1);

      if (sessionCheckError) {
        console.log('Live game sessions table may not exist yet, using fallback data');
      } else if (sessionCheck && sessionCheck.length > 0) {
        // Live stat tracking tables exist, fetch the data
        const { data: liveData, error: liveError } = await supabase
          .from('events')
          .select(`
            *,
            live_game_sessions!inner(
              *,
              live_game_events(
                *,
                players(name, jersey)
              ),
              games(
                *,
                game_stats(
                  *,
                  players(name, jersey)
                )
              )
            )
          `)
          .eq('id', eventId)
          .single();

        if (!liveError && liveData) {
          liveSessionData = liveData.live_game_sessions?.[0] || null;
          playByPlayData = liveData.live_game_sessions?.[0]?.live_game_events || [];
          gameData = liveData.live_game_sessions?.[0]?.games?.[0] || null;
          playerStatsData = liveData.live_game_sessions?.[0]?.games?.[0]?.game_stats || [];
        }
      }
    } catch (error) {
      console.log('Error checking live stat tracking tables:', error);
    }

    // If no live data, try to get basic game data from the standard tables
    if (!gameData) {
      try {
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select(`
            *,
            game_stats(
              *,
              players(name, jersey)
            )
          `)
          .eq('eventId', eventId)
          .limit(1);

        if (!gamesError && gamesData && gamesData.length > 0) {
          gameData = gamesData[0];
          playerStatsData = gamesData[0].game_stats || [];
        }
      } catch (error) {
        console.log('Error fetching games data:', error);
      }
    }

    // Structure the data for easy consumption
    const completeGameLog = {
      event: {
        id: eventData.id,
        name: eventData.name,
        description: eventData.description,
        startTime: eventData.startTime,
        venue: eventData.venue,
        oppositionTeam: eventData.oppositionTeam,
        location: eventData.location
      },
      liveSession: liveSessionData,
      playByPlay: playByPlayData,
      game: gameData,
      playerStats: playerStatsData
    };

    console.log('Complete game log prepared:', {
      eventId: completeGameLog.event.id,
      eventName: completeGameLog.event.name,
      hasLiveSession: !!completeGameLog.liveSession,
      playByPlayCount: completeGameLog.playByPlay.length,
      hasGame: !!completeGameLog.game,
      playerStatsCount: completeGameLog.playerStats.length
    });

    return NextResponse.json(completeGameLog);
  } catch (error) {
    console.error('Error fetching complete game log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complete game log', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
