import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const goalId = parseInt(id);
    
    if (isNaN(goalId)) {
      return NextResponse.json({ error: 'Invalid goal ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get goal with metric details
    const { data: goal, error: goalError } = await (supabase as any)
      .from('team_goals')
      .select(`
        *,
        stat_metrics (
          id,
          name,
          category,
          description,
          unit,
          calculation_type,
          event_types
        )
      `)
      .eq('id', goalId)
      .single();

    if (goalError || !goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Get progress history
    const { data: progress, error: progressError } = await (supabase as any)
      .from('team_goal_progress')
      .select(`
        *,
        live_game_sessions (
          id,
          created_at,
          events (
            name,
            startTime,
            oppositionTeam
          )
        )
      `)
      .eq('goal_id', goalId)
      .order('calculated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (progressError) {
      console.error('Error fetching goal progress:', progressError);
      return NextResponse.json({ error: 'Failed to fetch goal progress' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await (supabase as any)
      .from('team_goal_progress')
      .select('*', { count: 'exact', head: true })
      .eq('goal_id', goalId);

    if (countError) {
      console.error('Error counting goal progress:', countError);
    }

    return NextResponse.json({ 
      goal, 
      progress: progress || [], 
      totalCount: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error in goal progress GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
