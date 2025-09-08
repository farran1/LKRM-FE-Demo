import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch sample live game events to show structure
    const { data: liveEvents, error } = await supabase
      .from('live_game_events')
      .select(`
        *,
        live_game_sessions(
          event_id,
          events(name, oppositionTeam)
        ),
        players(name, jersey)
      `)
      .limit(10)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch live events from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Live game events structure',
      count: liveEvents?.length || 0,
      events: liveEvents || [],
      sample_structure: {
        description: 'This shows the structure of live game events',
        fields: [
          'id: Event ID',
          'session_id: Links to live_game_sessions',
          'player_id: Links to players table',
          'event_type: Type of basketball event (2pt_made, 3pt_miss, etc.)',
          'event_value: Numeric value if applicable',
          'quarter: Game quarter (1-4)',
          'game_time: Seconds from start of quarter',
          'is_opponent_event: Boolean for opponent plays',
          'metadata: JSON with additional event details',
          'created_at: Timestamp of event'
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching live events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live events' },
      { status: 500 }
    );
  }
}
