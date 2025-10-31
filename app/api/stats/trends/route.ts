import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

// Helper function to extract opponent name from event name when oppositionTeam is null
function extractOpponentFromEventName(eventName: string | null | undefined): string | null {
  if (!eventName) return null;
  
  // Common patterns to extract opponent name:
  // "Milton HS V. Williams HS" -> "Williams HS"
  // "JL Mann VS Dutch Fork HS" -> "Dutch Fork HS"
  // "Away Game vs. Westside High" -> "Westside High"
  // "Season Opener vs. Central High" -> "Central High"
  
  const patterns = [
    /\s+[Vv][Ss]\.?\s+(.+)/i,      // "VS" or "Vs" or "vs"
    /\s+[Vv]\.?\s+(.+)/i,           // "V" or "v" or "V."
    /\s+vs\.?\s+(.+)/i,             // "vs" or "vs."
    /\s+versus\s+(.+)/i,            // "versus"
  ];
  
  for (const pattern of patterns) {
    const match = eventName.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Helper function to get opponent name with fallbacks
function getOpponentName(event: any): string {
  // Priority 1: Use oppositionTeam if available
  if (event?.oppositionTeam) {
    return event.oppositionTeam;
  }
  
  // Priority 2: Extract from event name
  const extractedName = extractOpponentFromEventName(event?.name);
  if (extractedName) {
    return extractedName;
  }
  
  // Priority 3: Fallback to event name or "Unknown"
  return event?.name || 'Unknown';
}

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2025-26';
    const timeRange = searchParams.get('timeRange') || 'season';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gameIdsParam = searchParams.get('gameIds');
    const selectedIds = gameIdsParam ? gameIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0) : [];

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

    // Get game sessions ordered by date with proper date filtering
    let sessionsQuery = (supabase as any)
      .from('live_game_sessions' as any)
      .select(`
        id,
        game_state,
        created_at,
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
      .order('created_at', { ascending: true });

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
      return NextResponse.json({ error: 'Failed to fetch trends data' }, { status: 500 });
    }

    // Generate trend data (points per game over time)
    const trends = (sessions as any[])?.map((session: any, index: number) => {
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
      
      return {
        game: index + 1,
        ppg: teamScore,
        oppg: opponentScore,
        date: session.events?.startTime || session.created_at,
        margin: teamScore - opponentScore,
        gameName: getOpponentName(session.events)
      };
    }) || [];

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error in trends API:', error);
    
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
