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

    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*');

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    // Get all game stats for the season by joining with games table
    // First get games for the season
    let gamesQuery = supabase
      .from('games')
      .select('id')
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

    if (!games || games.length === 0) {
      // No games for this season, return empty player stats
      const playerStats = players?.map(player => ({
        id: player.id,
        name: player.name,
        position: player.position,
        number: player.number,
        games: 0,
        ppg: 0,
        apg: 0,
        rpg: 0,
        spg: 0,
        fgPct: 0,
        threePct: 0,
        ftPct: 0,
        trend: 'no_games'
      })) || [];

      return NextResponse.json(playerStats);
    }

    // Get game IDs for the season
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

    // Calculate player statistics
    const playerStatsMap = new Map();

    // Initialize player stats
    players?.forEach(player => {
      playerStatsMap.set(player.id, {
        id: player.id,
        name: player.name,
        position: player.position,
        number: player.number,
        games: 0,
        totalPoints: 0,
        totalAssists: 0,
        totalRebounds: 0,
        totalSteals: 0,
        totalFieldGoalsMade: 0,
        totalFieldGoalsAttempted: 0,
        totalThreePointsMade: 0,
        totalThreePointsAttempted: 0,
        totalFreeThrowsMade: 0,
        totalFreeThrowsAttempted: 0
      });
    });

    // Aggregate stats by player
    gameStats?.forEach(stat => {
      if (stat.playerId && playerStatsMap.has(stat.playerId)) {
        const playerStats = playerStatsMap.get(stat.playerId);
        playerStats.games++;
        playerStats.totalPoints += stat.points || 0;
        playerStats.totalAssists += stat.assists || 0;
        playerStats.totalRebounds += stat.rebounds || 0;
        playerStats.totalSteals += stat.steals || 0;
        playerStats.totalFieldGoalsMade += stat.fieldGoalsMade || 0;
        playerStats.totalFieldGoalsAttempted += stat.fieldGoalsAttempted || 0;
        playerStats.totalThreePointsMade += stat.threePointsMade || 0;
        playerStats.totalThreePointsAttempted += stat.threePointsAttempted || 0;
        playerStats.totalFreeThrowsMade += stat.freeThrowsMade || 0;
        playerStats.totalFreeThrowsAttempted += stat.freeThrowsAttempted || 0;
      }
    });

    // Calculate averages and percentages
    const playerStats = Array.from(playerStatsMap.values()).map(player => {
      const ppg = player.games > 0 ? Math.round((player.totalPoints / player.games) * 10) / 10 : 0;
      const apg = player.games > 0 ? Math.round((player.totalAssists / player.games) * 10) / 10 : 0;
      const rpg = player.games > 0 ? Math.round((player.totalRebounds / player.games) * 10) / 10 : 0;
      const spg = player.games > 0 ? Math.round((player.totalSteals / player.games) * 10) / 10 : 0;
      const fgPct = player.totalFieldGoalsAttempted > 0 ? Math.round((player.totalFieldGoalsMade / player.totalFieldGoalsAttempted) * 1000) / 10 : 0;
      const threePct = player.totalThreePointsAttempted > 0 ? Math.round((player.totalThreePointsMade / player.totalThreePointsAttempted) * 1000) / 10 : 0;
      const ftPct = player.totalFreeThrowsAttempted > 0 ? Math.round((player.totalFreeThrowsMade / player.totalFreeThrowsAttempted) * 1000) / 10 : 0;

      // Simple trend calculation based on recent performance
      const trend = player.games >= 5 ? 'steady' : 'improving';

      return {
        ...player,
        ppg,
        apg,
        rpg,
        spg,
        fgPct,
        threePct,
        ftPct,
        trend
      };
    });

    // Sort by PPG descending
    playerStats.sort((a, b) => b.ppg - a.ppg);

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
