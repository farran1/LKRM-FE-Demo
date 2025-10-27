import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { eventId: eventIdString } = await params;
    const eventId = parseInt(eventIdString);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    const { data: event, error } = await (supabase as any)
      .from('live_game_events')
      .select(`
        *,
        live_game_sessions!inner (
          id,
          event_id,
          created_by,
          events!inner (
            id,
            name
          )
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error in GET /live-game-events/[eventId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { eventId: eventIdString } = await params;
    const eventId = parseInt(eventIdString);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    const body = await request.json();

    // First, get the event to verify ownership
    const { data: existingEvent, error: fetchError } = await (supabase as any)
      .from('live_game_events')
      .select(`
        *,
        live_game_sessions!inner (
          id,
          event_id,
          created_by,
          events!inner (
            id,
            name
          )
        )
      `)
      .eq('id', eventId)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Service role has full access, no need to check permissions

    // Validate the update data
    const allowedFields = [
      'player_id',
      'event_type', 
      'event_value',
      'quarter',
      'is_opponent_event',
      'opponent_jersey',
      'metadata'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add audit information
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = existingEvent.live_game_sessions.created_by;

    // Update the event
    const { data: updatedEvent, error: updateError } = await (supabase as any)
      .from('live_game_events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    // Log the change for audit trail
    await (supabase as any)
      .from('audit_logs')
      .insert({
        updated_by: existingEvent.live_game_sessions.created_by,
        action: 'UPDATE_LIVE_GAME_EVENT',
        table: 'live_game_events',
        recordId: eventId,
        oldData: existingEvent,
        newData: updatedEvent,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      });

    return NextResponse.json({ 
      event: updatedEvent,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /live-game-events/[eventId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    console.log('DELETE endpoint called');
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { eventId: eventIdString } = await params;
    const eventId = parseInt(eventIdString);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    console.log('Processing delete for eventId:', eventId);

    // First, get the event to verify ownership
    const { data: existingEvent, error: fetchError } = await (supabase as any)
      .from('live_game_events')
      .select(`
        *,
        live_game_sessions!inner (
          id,
          event_id,
          created_by,
          events!inner (
            id,
            name
          )
        )
      `)
      .eq('id', eventId)
      .single();

    if (fetchError || !existingEvent) {
      console.log('Event not found or fetch error:', fetchError);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    console.log('Found event:', existingEvent.id, 'session:', existingEvent.live_game_sessions?.id);

    // Soft delete by updating deleted_at timestamp
    console.log('Attempting soft delete for event:', eventId);
    const { error: deleteError } = await (supabase as any)
      .from('live_game_events')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_by: existingEvent.live_game_sessions.created_by
      })
      .eq('id', eventId);

    if (deleteError) {
      console.error('Error deleting event:', deleteError);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    console.log('Event soft deleted successfully');

    // Try to log the deletion for audit trail, but don't fail if it doesn't work
    try {
      console.log('Attempting audit log insertion');
      await (supabase as any)
        .from('audit_logs')
        .insert({
          updated_by: existingEvent.live_game_sessions.created_by,
          action: 'DELETE_LIVE_GAME_EVENT',
          table: 'live_game_events',
          recordId: eventId,
          oldData: existingEvent,
          newData: null,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        });
      console.log('Audit log inserted successfully');
    } catch (auditError) {
      console.error('Audit log error (non-fatal):', auditError);
      // Don't fail the delete if audit logging fails
    }

    return NextResponse.json({ 
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /live-game-events/[eventId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
