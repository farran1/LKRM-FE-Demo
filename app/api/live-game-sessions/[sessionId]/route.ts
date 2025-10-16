/*
import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    console.log('Live Game Sessions API PUT called');
    const { client: supabase, user } = await createServerClientWithAuth(request);
    const { sessionId } = await params;
    console.log('SessionId:', sessionId);
    const body = await request.json();
    console.log('Request body:', body);
    
    console.log('User auth result:', { user: user?.id });
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the session exists and user has permission
    const { data: session, error: sessionError } = await supabase
      .from('live_game_sessions')
      .select('id, created_by')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.log('Session not found:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.created_by !== user.id) {
      console.log('Permission denied');
      return NextResponse.json({ error: 'Unauthorized to edit this session' }, { status: 403 });
    }

    // Validate the update data
    const allowedFields = [
      'game_id',
      'game_state',
      'is_active',
      'ended_at'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add audit information
    updateData.updated_at = new Date().toISOString();

    // Update the session
    const { data: updatedSession, error: updateError } = await supabase
      .from('live_game_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    // Log the change for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        userid: user.id,
        action: 'UPDATE_LIVE_GAME_SESSION',
        table: 'live_game_sessions',
        recordId: parseInt(sessionId),
        oldData: session,
        newData: updatedSession,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      });

    return NextResponse.json({ 
      session: updatedSession,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /live-game-sessions/[sessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/

// Live game sessions PUT API temporarily disabled
export async function PUT() {
  return new Response('Box score editing temporarily disabled', { status: 503 });
}
