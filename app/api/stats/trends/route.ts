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

    // Get all games for the season ordered by date
    let query = supabase
      .from('games')
      .select('*')
      .eq('season', season);

    if (startDate) {
      query = query.gte('gameDate', startDate);
    }
    if (endDate) {
      query = query.lte('gameDate', endDate);
    }

    const { data: games, error: gamesError } = await query
      .order('gameDate', { ascending: true });

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    // Get game stats for each game
    const trendsPromises = games?.map(async (game, index) => {
      const { data: stats, error: statsError } = await supabase
        .from('game_stats')
        .select('*')
        .eq('gameId', game.id);

      if (statsError) {
        console.error(`Error fetching stats for game ${game.id}:`, statsError);
        return null;
      }

      // Calculate game totals
      const gameTotals = stats?.reduce((acc, stat) => ({
        points: acc.points + (stat.points || 0),
        fieldGoalsMade: acc.fieldGoalsMade + (stat.fieldGoalsMade || 0),
        fieldGoalsAttempted: acc.fieldGoalsAttempted + (stat.fieldGoalsAttempted || 0),
        threePointsMade: acc.threePointsMade + (stat.threePointsMade || 0),
        threePointsAttempted: acc.threePointsAttempted + (stat.threePointsAttempted || 0),
        freeThrowsMade: acc.freeThrowsMade + (stat.freeThrowsMade || 0),
        freeThrowsAttempted: acc.freeThrowsAttempted + (stat.freeThrowsAttempted || 0),
        rebounds: acc.rebounds + (stat.rebounds || 0),
        assists: acc.assists + (stat.assists || 0),
        steals: acc.steals + (stat.steals || 0),
        blocks: acc.blocks + (stat.blocks || 0),
        turnovers: acc.turnovers + (stat.turnovers || 0),
        fouls: acc.fouls + (stat.fouls || 0)
      }), {
        points: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointsMade: 0,
        threePointsAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0
      });

      // Calculate percentages
      const fgPct = gameTotals.fieldGoalsAttempted > 0 ? Math.round((gameTotals.fieldGoalsMade / gameTotals.fieldGoalsAttempted) * 1000) / 10 : 0;
      const threePct = gameTotals.threePointsAttempted > 0 ? Math.round((gameTotals.threePointsMade / gameTotals.threePointsAttempted) * 1000) / 10 : 0;
      const ftPct = gameTotals.freeThrowsAttempted > 0 ? Math.round((gameTotals.freeThrowsMade / gameTotals.freeThrowsAttempted) * 1000) / 10 : 0;

      return {
        game: index + 1,
        opponent: game.opponent,
        date: game.gameDate,
        ppg: gameTotals.points,
        oppg: game.awayScore || 0,
        fgPct,
        threePct,
        ftPct,
        rebounds: gameTotals.rebounds,
        assists: gameTotals.assists,
        steals: gameTotals.steals,
        blocks: gameTotals.blocks,
        turnovers: gameTotals.turnovers
      };
    });

    const trends = await Promise.all(trendsPromises);
    const validTrends = trends.filter(Boolean);

    return NextResponse.json(validTrends);
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance trends' },
      { status: 500 }
    );
  }
}
