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

    // Get team statistics from live game sessions with proper date filtering
    let sessionsQuery = (supabase as any)
      .from('live_game_sessions' as any)
      .select(`
        id,
        game_state,
        created_at,
        event_id,
        events (
          name,
          startTime
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
      .order('created_at', { ascending: false });

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
      return NextResponse.json({ error: 'Failed to fetch team data', details: sessionsError.message }, { status: 500 });
    }

    // Calculate team statistics
    let wins = 0;
    let losses = 0;
    let totalPoints = 0;
    let totalOpponentPoints = 0;
    let totalGames = sessions?.length || 0;

    // Calculate shooting stats
    let totalFgMade = 0;
    let totalFgAttempted = 0;
    let totalThreeMade = 0;
    let totalThreeAttempted = 0;
    let totalFtMade = 0;
    let totalFtAttempted = 0;
    let totalRebounds = 0;
    let totalAssists = 0;
    let totalSteals = 0;
    let totalBlocks = 0;
    let totalTurnovers = 0;
    let totalFouls = 0;

    (sessions as any[])?.forEach((session: any) => {
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
      
      totalPoints += teamScore;
      totalOpponentPoints += opponentScore;
      
      if (teamScore > opponentScore) {
        wins++;
      } else if (teamScore < opponentScore) {
        losses++;
      }

      // Process events for statistics
      session.live_game_events?.forEach((event: any) => {
        switch (event.event_type) {
          case 'fg_made':
            totalFgMade++;
            totalFgAttempted++;
            break;
          case 'fg_missed':
            totalFgAttempted++;
            break;
          case 'three_made':
            totalThreeMade++;
            totalThreeAttempted++;
            totalFgMade++;
            totalFgAttempted++;
            break;
          case 'three_missed':
            totalThreeAttempted++;
            totalFgAttempted++;
            break;
          case 'ft_made':
            totalFtMade++;
            totalFtAttempted++;
            break;
          case 'ft_missed':
            totalFtAttempted++;
            break;
          case 'rebound':
            totalRebounds++;
            break;
          case 'assist':
            totalAssists++;
            break;
          case 'steal':
            totalSteals++;
            break;
          case 'block':
            totalBlocks++;
            break;
          case 'turnover':
            totalTurnovers++;
            break;
          case 'foul':
            totalFouls++;
            break;
        }
      });
    });

    const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const ppg = totalGames > 0 ? Math.round((totalPoints / totalGames) * 10) / 10 : 0;
    const oppg = totalGames > 0 ? Math.round((totalOpponentPoints / totalGames) * 10) / 10 : 0;
    const fgPct = totalFgAttempted > 0 ? Math.round((totalFgMade / totalFgAttempted) * 100) : 0;
    const threePct = totalThreeAttempted > 0 ? Math.round((totalThreeMade / totalThreeAttempted) * 100) : 0;
    const ftPct = totalFtAttempted > 0 ? Math.round((totalFtMade / totalFtAttempted) * 100) : 0;

    const teamStats = {
      wins,
      losses,
      winPercentage,
      ppg,
      oppg,
      fgPct,
      threePct,
      ftPct,
      rebounds: totalRebounds,
      assists: totalAssists,
      steals: totalSteals,
      blocks: totalBlocks,
      turnovers: totalTurnovers,
      fouls: totalFouls,
      season,
      totalGames
    };

    return NextResponse.json(teamStats);
  } catch (error) {
    console.error('Error in team stats API:', error);
    
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