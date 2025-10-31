import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

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

    // Get team statistics from live game sessions with proper date filtering
    let sessionsQuery = (supabase as any)
      .from('live_game_sessions' as any)
      .select(`
        id,
        game_state,
        created_at,
        live_game_events (
          event_type,
          player_id,
          opponent_jersey
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
      return NextResponse.json({ error: 'Failed to fetch advanced stats data' }, { status: 500 });
    }

    // Calculate advanced statistics
    let totalPoints = 0;
    let totalOpponentPoints = 0;
    let totalPossessions = 0;
    let totalFgMade = 0;
    let totalFgAttempted = 0;
    let totalThreeMade = 0;
    let totalThreeAttempted = 0;
    let totalFtMade = 0;
    let totalFtAttempted = 0;
    let totalRebounds = 0;
    let totalOffensiveRebounds = 0;
    let totalDefensiveRebounds = 0;
    let totalAssists = 0;
    let totalSteals = 0;
    let totalBlocks = 0;
    let totalTurnovers = 0;
    let totalFouls = 0;
    let totalGames = sessions?.length || 0;

    sessions?.forEach((session: any) => {
      const gameState = session.game_state || {};
      const teamScore = gameState.homeScore || 0;
      const opponentScore = gameState.awayScore || gameState.opponentScore || 0;
      
      totalPoints += teamScore;
      totalOpponentPoints += opponentScore;
      
      // Estimate possessions (simplified calculation)
      totalPossessions += Math.max(teamScore, opponentScore) * 0.8;

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
            // Simplified: assume 30% offensive, 70% defensive
            if (Math.random() < 0.3) {
              totalOffensiveRebounds++;
            } else {
              totalDefensiveRebounds++;
            }
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

    // Calculate advanced metrics
    const pace = totalGames > 0 ? Math.round((totalPossessions / totalGames) * 10) / 10 : 0;
    const offensiveEfficiency = totalPossessions > 0 ? Math.round((totalPoints / totalPossessions) * 100) : 0;
    const defensiveEfficiency = totalPossessions > 0 ? Math.round((totalOpponentPoints / totalPossessions) * 100) : 0;
    const netRating = offensiveEfficiency - defensiveEfficiency;
    
    const fgPct = totalFgAttempted > 0 ? (totalFgMade / totalFgAttempted) : 0;
    const ftPct = totalFtAttempted > 0 ? (totalFtMade / totalFtAttempted) : 0;
    const threePct = totalThreeAttempted > 0 ? (totalThreeMade / totalThreeAttempted) : 0;
    
    const trueShootingPct = totalFgAttempted + (totalFtAttempted * 0.44) > 0 
      ? Math.round(((totalPoints / (2 * (totalFgAttempted + (totalFtAttempted * 0.44)))) * 100) * 10) / 10 
      : 0;
    
    const effectiveFgPct = totalFgAttempted > 0 
      ? Math.round(((totalFgMade + (totalThreeMade * 0.5)) / totalFgAttempted) * 100 * 10) / 10 
      : 0;
    
    const turnoverRate = totalPossessions > 0 
      ? Math.round((totalTurnovers / totalPossessions) * 100 * 10) / 10 
      : 0;
    
    const offensiveReboundRate = totalFgAttempted > 0 
      ? Math.round((totalOffensiveRebounds / (totalOffensiveRebounds + totalDefensiveRebounds)) * 100 * 10) / 10 
      : 0;
    
    const defensiveReboundRate = totalFgAttempted > 0 
      ? Math.round((totalDefensiveRebounds / (totalOffensiveRebounds + totalDefensiveRebounds)) * 100 * 10) / 10 
      : 0;
    
    const freeThrowRate = totalFgAttempted > 0 
      ? Math.round((totalFtAttempted / totalFgAttempted) * 100 * 10) / 10 
      : 0;
    
    const threePointRate = totalFgAttempted > 0 
      ? Math.round((totalThreeAttempted / totalFgAttempted) * 100 * 10) / 10 
      : 0;

    const advancedStats = {
      pace,
      possessions: Math.round(totalPossessions),
      offensiveEfficiency,
      defensiveEfficiency,
      netRating,
      trueShootingPct,
      effectiveFgPct,
      turnoverRate,
      offensiveReboundRate,
      defensiveReboundRate,
      freeThrowRate,
      threePointRate,
      season,
      totalGames
    };

    return NextResponse.json(advancedStats);
  } catch (error) {
    console.error('Error in advanced stats API:', error);
    
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
