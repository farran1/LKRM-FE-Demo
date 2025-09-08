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

    // Get all games for the season that have stats
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select(`
        *,
        game_stats(count)
      `)
      .eq('season', season)
      .order('gameDate', { ascending: false });

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return NextResponse.json(
        { error: 'Failed to fetch games' },
        { status: 500 }
      );
    }

    // Filter games that have stats and format the response
    const recordedGames = games
      ?.filter(game => game.game_stats && game.game_stats.length > 0)
      .map(game => ({
        id: game.id,
        opponent: game.opponent,
        date: game.gameDate,
        type: game.isPlayoffs ? 'Playoff' : 'Game',
        result: game.result === 'WIN' ? 'W' : game.result === 'LOSS' ? 'L' : 'T',
        score: game.homeScore && game.awayScore ? `${game.homeScore}-${game.awayScore}` : 'N/A',
        duration: '48:00', // Default duration
        location: 'Home', // Default location
        recorded: true,
        statsComplete: true
      }));

    return NextResponse.json(recordedGames || []);
  } catch (error) {
    console.error('Error fetching recorded games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recorded games' },
      { status: 500 }
    );
  }
}
