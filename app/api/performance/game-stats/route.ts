import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!url || !anon) {
      return NextResponse.json(
        { error: 'Supabase env vars are missing (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anon);

    const { data: gameStats, error } = await supabase
      .from('game_stats')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch game stats from database' },
        { status: 500 }
      );
    }

    return NextResponse.json(gameStats || []);
  } catch (error) {
    console.error('Error fetching all game stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game stats' },
      { status: 500 }
    );
  }
}
