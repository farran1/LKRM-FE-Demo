/*
import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Games API POST called');
    const { client: supabase, user } = await createServerClientWithAuth(request);
    const body = await request.json();
    console.log('Request body:', body);
    
    console.log('User auth result:', { user: user?.id });
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    const { event_id, opponent, home_score, away_score, result } = body;
    
    if (!event_id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Verify the event exists and user has permission
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, createdBy')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      console.log('Event not found:', eventError);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.createdBy !== user.id) {
      console.log('Permission denied');
      return NextResponse.json({ error: 'Unauthorized to create game for this event' }, { status: 403 });
    }

    // Create the game record
    const gameData = {
      event_id,
      opponent: opponent || 'Unknown',
      home_score: home_score || 0,
      away_score: away_score || 0,
      result: result || 'WIN',
      game_date: new Date().toISOString(),
      season: '2024-25',
      is_playoffs: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newGame, error: createError } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating game:', createError);
      return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }

    // Log the change for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        userid: user.id,
        action: 'CREATE_GAME',
        table: 'games',
        recordId: newGame.id,
        oldData: null,
        newData: newGame,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      });

    return NextResponse.json({ 
      game: newGame,
      message: 'Game created successfully'
    });
  } catch (error) {
    console.error('Error in POST /games:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/

// Games POST API temporarily disabled
export async function POST() {
  return new Response('Box score editing temporarily disabled', { status: 503 });
}
