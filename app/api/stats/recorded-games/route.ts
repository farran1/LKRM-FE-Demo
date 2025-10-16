import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
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

    // Build date filter based on timeRange
    let dateFilter = '2024-01-01';
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

    // Get recorded games from live game sessions with events
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
          eventTypeId
        ),
        live_game_events (
          event_type,
          event_value,
          is_opponent_event
        )
      `)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false });

    if (timeRange === 'selectGames' && selectedIds.length > 0) {
      sessionsQuery = (sessionsQuery as any).in('id', selectedIds as any);
    }

    if (timeRange === 'custom' && endDate) {
      sessionsQuery = sessionsQuery.lte('created_at', endDate);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch recorded games' }, { status: 500 });
    }

    // Transform sessions into recorded games format
    const recordedGames = (sessions as any[])?.map((session: any) => {
      const gameState = session.game_state || {};
      let teamScore = 0;
      let opponentScore = 0;
      
      // Calculate scores from events
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
        opponent: session.events?.name || 'Unknown',
        date: session.events?.startTime || session.created_at,
        result,
        score: `${teamScore}-${opponentScore}`,
        margin,
        type: 'Regular Season', // Could be determined from eventTypeId
        teamScore,
        opponentScore,
        season
      };
    }) || [];

    return NextResponse.json(recordedGames);
  } catch (error) {
    console.error('Error in recorded games API:', error);
    
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
