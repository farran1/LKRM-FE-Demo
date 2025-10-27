import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';
import { goalCalculationService } from '@/services/goal-calculation-service';

export async function POST(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, goalId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_game_sessions')
      .select('id, created_by')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to access this session' }, { status: 403 });
    }

    let results;

    if (goalId) {
      // Calculate specific goal
      const result = await goalCalculationService.calculateGoalProgress(goalId, sessionId);
      if (!result) {
        return NextResponse.json({ error: 'Goal not found or inactive' }, { status: 404 });
      }
      
      // Save progress
      await goalCalculationService.saveGoalProgress(result);
      
      // Check for status changes
      await goalCalculationService.checkForStatusChanges(goalId, result.result.status);
      
      results = [result];
    } else {
      // Calculate all active goals for the session
      results = await goalCalculationService.calculateAllGoalsForSession(sessionId);
      
      // Save all progress records
      for (const result of results) {
        await goalCalculationService.saveGoalProgress(result);
        await goalCalculationService.checkForStatusChanges(result.goalId, result.result.status);
      }
    }

    return NextResponse.json({ 
      message: 'Goal calculations completed successfully',
      results: results.map(r => ({
        goalId: r.goalId,
        sessionId: r.sessionId,
        actualValue: r.result.actualValue,
        targetValue: r.result.targetValue,
        delta: r.result.delta,
        status: r.result.status
      }))
    });
  } catch (error) {
    console.error('Error in goal calculation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
