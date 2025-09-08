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

    // Calculate team statistics
    let wins = 0;
    let losses = 0;
    let totalPoints = 0;
    let totalOpponentPoints = 0;
    let totalFieldGoalsMade = 0;
    let totalFieldGoalsAttempted = 0;
    let totalThreePointsMade = 0;
    let totalThreePointsAttempted = 0;
    let totalFreeThrowsMade = 0;
    let totalFreeThrowsAttempted = 0;
    let totalRebounds = 0;
    let totalAssists = 0;
    let totalSteals = 0;
    let totalBlocks = 0;
    let totalTurnovers = 0;
    let totalFouls = 0;

    // Process games
    games?.forEach(game => {
      if (game.result === 'WIN') {
        wins++;
      } else if (game.result === 'LOSS') {
        losses++;
      }
      
      if (game.homeScore !== null && game.awayScore !== null) {
        totalPoints += game.homeScore;
        totalOpponentPoints += game.awayScore;
      }
    });

    // Process game stats
    gameStats?.forEach(stat => {
      totalFieldGoalsMade += stat.fieldGoalsMade || 0;
      totalFieldGoalsAttempted += stat.fieldGoalsAttempted || 0;
      totalThreePointsMade += stat.threePointsMade || 0;
      totalThreePointsAttempted += stat.threePointsAttempted || 0;
      totalFreeThrowsMade += stat.freeThrowsMade || 0;
      totalFreeThrowsAttempted += stat.freeThrowsAttempted || 0;
      totalRebounds += stat.rebounds || 0;
      totalAssists += stat.assists || 0;
      totalSteals += stat.steals || 0;
      totalBlocks += stat.blocks || 0;
      totalTurnovers += stat.turnovers || 0;
      totalFouls += stat.fouls || 0;
    });

    const totalGames = wins + losses;
    const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const ppg = totalGames > 0 ? Math.round((totalPoints / totalGames) * 10) / 10 : 0;
    const oppg = totalGames > 0 ? Math.round((totalOpponentPoints / totalGames) * 10) / 10 : 0;
    const fgPct = totalFieldGoalsAttempted > 0 ? Math.round((totalFieldGoalsMade / totalFieldGoalsAttempted) * 1000) / 10 : 0;
    const threePct = totalThreePointsAttempted > 0 ? Math.round((totalThreePointsMade / totalThreePointsAttempted) * 1000) / 10 : 0;
    const ftPct = totalFreeThrowsAttempted > 0 ? Math.round((totalFreeThrowsMade / totalFreeThrowsAttempted) * 1000) / 10 : 0;

    const teamStats = {
      wins,
      losses,
      winPercentage,
      ppg,
      oppg,
      fgPct,
      threePct,
      ftPct,
      rebounds: Math.round((totalRebounds / totalGames) * 10) / 10,
      assists: Math.round((totalAssists / totalGames) * 10) / 10,
      steals: Math.round((totalSteals / totalGames) * 10) / 10,
      blocks: Math.round((totalBlocks / totalGames) * 10) / 10,
      turnovers: Math.round((totalTurnovers / totalGames) * 10) / 10,
      fouls: Math.round((totalFouls / totalGames) * 10) / 10
    };

    return NextResponse.json(teamStats);
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  }
}
