import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }
  
  try {
    if (!url || !anon) {
      return NextResponse.json(
        { error: 'Supabase environment variables are missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anon);

    // Check if tables exist and have data
    const checks = [];

    // Check players table
    try {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('count')
        .limit(1);
      
      checks.push({
        table: 'players',
        exists: !playersError,
        hasData: players && players.length > 0,
        error: playersError?.message
      });
    } catch (error) {
      checks.push({
        table: 'players',
        exists: false,
        hasData: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check games table
    try {
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('count')
        .limit(1);
      
      checks.push({
        table: 'games',
        exists: !gamesError,
        hasData: games && games.length > 0,
        error: gamesError?.message
      });
    } catch (error) {
      checks.push({
        table: 'games',
        exists: false,
        hasData: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check game_stats table
    try {
      const { data: gameStats, error: gameStatsError } = await supabase
        .from('game_stats')
        .select('count')
        .limit(1);
      
      checks.push({
        table: 'game_stats',
        exists: !gameStatsError,
        hasData: gameStats && gameStats.length > 0,
        error: gameStatsError?.message
      });
    } catch (error) {
      checks.push({
        table: 'game_stats',
        exists: false,
        hasData: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check if we can query games by season
    try {
      const { data: seasonGames, error: seasonError } = await supabase
        .from('games')
        .select('id, season')
        .eq('season', '2024-25')
        .limit(5);
      
      checks.push({
        test: 'games_by_season',
        success: !seasonError,
        data: seasonGames,
        error: seasonError?.message
      });
    } catch (error) {
      checks.push({
        test: 'games_by_season',
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      message: 'Database schema check completed',
      checks
    });
  } catch (error) {
    console.error('Error checking database schema:', error);
    return NextResponse.json(
      { error: 'Failed to check database schema' },
      { status: 500 }
    );
  }
}
