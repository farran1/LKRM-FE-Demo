import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    console.log('Live Game Session Complete API called');
    const { client: supabase, user } = await createServerClientWithAuth(request);
    const { sessionId } = await params;
    console.log('SessionId:', sessionId);
    
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the session exists and user has permission
    const { data: session, error: sessionError } = await supabase
      .from('live_game_sessions')
      .select('id, created_by, event_id, game_state')
      .eq('id', parseInt(sessionId))
      .single();

    if (sessionError || !session) {
      console.log('Session not found:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.created_by !== user.id) {
      console.log('Permission denied');
      return NextResponse.json({ error: 'Unauthorized to complete this session' }, { status: 403 });
    }

    // Mark session as completed
    const { data: updatedSession, error: updateError } = await supabase
      .from('live_game_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(sessionId))
      .select()
      .single();

    if (updateError) {
      console.error('Error completing session:', updateError);
      return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
    }

    // Trigger goal calculations
    try {
      console.log('Triggering goal calculations for session:', sessionId);
      const calculationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/stats/team-goals/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('authorization') || '',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          sessionId: parseInt(sessionId),
          triggerType: 'game_completion'
        })
      });

      if (!calculationResponse.ok) {
        console.error('Failed to trigger goal calculations:', await calculationResponse.text());
        // Don't fail the session completion if goal calculation fails
      } else {
        console.log('Goal calculations triggered successfully');
      }
    } catch (calcError) {
      console.error('Error triggering goal calculations:', calcError);
      // Don't fail the session completion if goal calculation fails
    }

    // Log the completion for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        userid: user.id,
        action: 'COMPLETE_LIVE_GAME_SESSION',
        table: 'live_game_sessions',
        recordId: parseInt(sessionId),
        oldData: session,
        newData: updatedSession,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      });

    return NextResponse.json({ 
      session: updatedSession,
      message: 'Session completed successfully and goal calculations triggered'
    });
  } catch (error) {
    console.error('Error in POST /live-game-sessions/[sessionId]/complete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
