import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Live Game Sessions API POST called');
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      console.log('🎯 No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🎯 Request body:', body);
    
    const { event_id, game_id, session_key, game_state, is_active, started_at, ended_at } = body;
    
    // Insert new live game session
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_game_sessions')
      .insert({
        event_id,
        game_id,
        session_key,
        game_state,
        is_active,
        started_at,
        ended_at,
        created_by: user.id
      })
      .select()
      .single();

    if (sessionError) {
      console.error('🎯 Error creating session:', sessionError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    console.log('🎯 Session created successfully:', session.id);
    return NextResponse.json(session);
  } catch (error) {
    console.error('🎯 Error in live game sessions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Live Game Sessions API GET called');
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      console.log('🎯 No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const gameId = searchParams.get('gameId');
    const isActive = searchParams.get('isActive');

    let query = (supabase as any)
      .from('live_game_sessions')
      .select(`
        id,
        event_id,
        game_id,
        session_key,
        game_state,
        is_active,
        started_at,
        ended_at,
        created_at,
        events (
          name,
          startTime
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', parseInt(eventId));
    }
    if (gameId) {
      query = query.eq('game_id', parseInt(gameId));
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('🎯 Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    console.log('🎯 Sessions fetched successfully:', sessions?.length || 0);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('🎯 Error in live game sessions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
