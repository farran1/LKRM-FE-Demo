import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!url || !anon) {
      return NextResponse.json(
        { error: 'Supabase environment variables are missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anon);
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024-25';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all games for the season
    let gamesQuery = supabase
      .from('games')
      .select('*')
      .eq('season', season);

    if (startDate) {
      gamesQuery = gamesQuery.gte('gameDate', startDate);
    }
    if (endDate) {
      gamesQuery = gamesQuery.lte('gameDate', endDate);
    }

    const { data: games, error: gamesError } = await gamesQuery;

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    // Get all game stats for the season
    // First get game IDs for the season
    const gameIds = games.map(game => game.id);

    // Get all game stats for the games in this season
    const { data: gameStats, error: statsError } = await supabase
      .from('game_stats')
      .select('*')
      .in('gameId', gameIds);

    if (statsError) {
      console.error('Error fetching game stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch game stats' },
        { status: 500 }
      );
    }

    // Calculate advanced statistics
    let totalPossessions = 0;
    let totalFieldGoalsAttempted = 0;
    let totalFieldGoalsMade = 0;
    let totalThreePointsAttempted = 0;
    let totalThreePointsMade = 0;
    let totalFreeThrowsAttempted = 0;
    let totalFreeThrowsMade = 0;
    let totalOffensiveRebounds = 0;
    let totalDefensiveRebounds = 0;
    let totalTurnovers = 0;
    let totalPoints = 0;
    let totalOpponentPoints = 0;

    // Process games for possessions calculation
    games?.forEach(game => {
      if (game.homeScore !== null && game.awayScore !== null) {
        totalPoints += game.homeScore;
        totalOpponentPoints += game.awayScore;
      }
    });

    // Process game stats
    gameStats?.forEach(stat => {
      totalFieldGoalsAttempted += stat.fieldGoalsAttempted || 0;
      totalFieldGoalsMade += stat.fieldGoalsMade || 0;
      totalThreePointsAttempted += stat.threePointsAttempted || 0;
      totalThreePointsMade += stat.threePointsMade || 0;
      totalFreeThrowsAttempted += stat.freeThrowsAttempted || 0;
      totalFreeThrowsMade += stat.freeThrowsMade || 0;
      totalOffensiveRebounds += stat.offensiveRebounds || 0;
      totalDefensiveRebounds += stat.defensiveRebounds || 0;
      totalTurnovers += stat.turnovers || 0;
    });

    // Calculate advanced metrics
    const totalGames = games?.length || 1;
    const totalRebounds = totalOffensiveRebounds + totalDefensiveRebounds;
    
    // Estimate possessions (simplified formula)
    totalPossessions = totalFieldGoalsAttempted + 0.44 * totalFreeThrowsAttempted + totalTurnovers;
    
    // Calculate rates and percentages
    const pace = totalGames > 0 ? Math.round((totalPossessions / totalGames) * 10) / 10 : 0;
    const possessions = Math.round(totalPossessions);
    const offensiveEfficiency = totalPossessions > 0 ? Math.round((totalPoints / totalPossessions) * 100) : 0;
    const defensiveEfficiency = totalPossessions > 0 ? Math.round((totalOpponentPoints / totalPossessions) * 100) : 0;
    const netRating = offensiveEfficiency - defensiveEfficiency;
    const trueShootingPct = (totalFieldGoalsAttempted + 0.44 * totalFreeThrowsAttempted) > 0 ? 
      Math.round(((totalPoints / 2) / (totalFieldGoalsAttempted + 0.44 * totalFreeThrowsAttempted)) * 1000) / 10 : 0;
    const effectiveFgPct = totalFieldGoalsAttempted > 0 ? 
      Math.round(((totalFieldGoalsMade + 0.5 * totalThreePointsMade) / totalFieldGoalsAttempted) * 1000) / 10 : 0;
    const turnoverRate = totalPossessions > 0 ? 
      Math.round((totalTurnovers / totalPossessions) * 1000) / 10 : 0;
    const offensiveReboundRate = totalFieldGoalsAttempted > 0 ? 
      Math.round((totalOffensiveRebounds / (totalOffensiveRebounds + totalDefensiveRebounds)) * 1000) / 10 : 0;
    const defensiveReboundRate = totalFieldGoalsAttempted > 0 ? 
      Math.round((totalDefensiveRebounds / (totalOffensiveRebounds + totalDefensiveRebounds)) * 1000) / 10 : 0;
    const freeThrowRate = totalFieldGoalsAttempted > 0 ? 
      Math.round((totalFreeThrowsAttempted / totalFieldGoalsAttempted) * 1000) / 10 : 0;
    const threePointRate = totalFieldGoalsAttempted > 0 ? 
      Math.round((totalThreePointsAttempted / totalFieldGoalsAttempted) * 1000) / 10 : 0;

    const advancedStats = {
      pace,
      possessions,
      offensiveEfficiency,
      defensiveEfficiency,
      netRating,
      trueShootingPct,
      effectiveFgPct,
      turnoverRate,
      offensiveReboundRate,
      defensiveReboundRate,
      freeThrowRate,
      threePointRate
    };

    return NextResponse.json(advancedStats);
  } catch (error) {
    console.error('Error fetching advanced stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced stats' },
      { status: 500 }
    );
  }
}
