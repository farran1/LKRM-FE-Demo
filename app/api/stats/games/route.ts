import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024-25';
    const timeRange = searchParams.get('timeRange') || 'season';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gameIdsParam = searchParams.get('gameIds');
    const selectedIds = gameIdsParam ? gameIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0) : [];
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build date filter based on timeRange
    let dateFilter = '2024-01-01'; // Default season start
    if (timeRange === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
    } else if (timeRange === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = sevenDaysAgo.toISOString().split('T')[0];
    } else if (timeRange === 'custom' && startDate && endDate) {
      dateFilter = startDate;
    }

    // Get recent games from live game sessions with proper date filtering
    let sessionsQuery = (supabase as any)
      .from('live_game_sessions' as any)
      .select(`
        id,
        game_state,
        created_at,
        event_id,
        events (
          name,
          startTime,
          oppositionTeam
        ),
        live_game_events (
          event_type,
          event_value,
          player_id,
          opponent_jersey,
          is_opponent_event
        )
      `)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (timeRange === 'selectGames' && selectedIds.length > 0) {
      sessionsQuery = (sessionsQuery as any).in('id', selectedIds as any);
    }

    // Add end date filter if provided
    if (timeRange === 'custom' && endDate) {
      sessionsQuery = sessionsQuery.lte('created_at', endDate);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch games data' }, { status: 500 });
    }

    // Transform sessions into game stats
    const gameStats = sessions?.map((session: any) => {
      // Calculate scores from events instead of relying on game_state
      let teamScore = 0;
      let opponentScore = 0;
      
      session.live_game_events?.forEach((event: any) => {
        if (event.is_opponent_event) {
          // Opponent events
          switch (event.event_type) {
            case 'fg_made':
              opponentScore += event.event_value || 2;
              break;
            case 'three_made':
              opponentScore += event.event_value || 3;
              break;
            case 'ft_made':
              opponentScore += event.event_value || 1;
              break;
          }
        } else {
          // Team events
          switch (event.event_type) {
            case 'fg_made':
              teamScore += event.event_value || 2;
              break;
            case 'three_made':
              teamScore += event.event_value || 3;
              break;
            case 'ft_made':
              teamScore += event.event_value || 1;
              break;
          }
        }
      });
      
      const margin = teamScore - opponentScore;
      const result = margin > 0 ? 'W' : margin < 0 ? 'L' : 'T';

      return {
        id: session.id,
        opponent: session.events?.oppositionTeam || 'Unknown',
        date: session.events?.startTime || session.created_at,
        result,
        score: `${teamScore}-${opponentScore}`,
        margin,
        ppg: teamScore,
        oppg: opponentScore,
        fgPct: 0, // Could be calculated from events
        threePct: 0, // Could be calculated from events
        ftPct: 0, // Could be calculated from events
        type: 'Regular Season' // Could be determined from event type
      };
    }) || [];

    return NextResponse.json(gameStats);
  } catch (error) {
    console.error('Error in games stats API:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 });
  }
}
