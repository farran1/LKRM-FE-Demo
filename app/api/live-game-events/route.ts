import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Use authenticated client with RLS
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    const { session_id, player_id, event_type, quarter, event_value, is_opponent_event, opponent_jersey, metadata } = body;
    
    if (!session_id || !event_type || !quarter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the session exists
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_game_sessions')
      .select('id, created_by, event_id')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // If it's a player event, verify the player exists
    if (player_id) {
      const { data: player, error: playerError } = await (supabase as any)
        .from('players')
        .select('id')
        .eq('id', player_id)
        .single();

      if (playerError || !player) {
        return NextResponse.json({ error: 'Player not found' }, { status: 404 });
      }
    }

    // Create the event
    const eventData = {
      session_id,
      game_id: session.event_id, // Use event_id as game_id for now
      player_id: player_id || null,
      event_type,
      event_value: event_value || null,
      quarter,
      is_opponent_event: is_opponent_event || false,
      opponent_jersey: opponent_jersey || null,
      metadata: metadata || {},
      sync_status: 'synced',
      created_at: new Date().toISOString(),
      created_by: session.created_by // Use the session creator
    };

    const { data: newEvent, error: insertError } = await (supabase as any)
      .from('live_game_events')
      .insert(eventData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating event:', insertError);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Log the creation for audit trail
    await (supabase as any)
      .from('audit_logs')
      .insert({
        userId: parseInt(user.id) || 0,
        action: 'CREATE_LIVE_GAME_EVENT',
        table: 'live_game_events',
        recordId: newEvent.id,
        oldData: null,
        newData: newEvent,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      });

    return NextResponse.json({ 
      event: newEvent,
      message: 'Event created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /live-game-events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
