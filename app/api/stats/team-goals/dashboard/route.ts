import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024-25';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get all active goals with their metrics
    const { data: goals, error: goalsError } = await supabase
      .from('team_goals')
      .select(`
        id,
        target_value,
        comparison_operator,
        period_type,
        season,
        visibility,
        notes,
        created_at,
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
      .eq('season', season)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }

    if (!goals || goals.length === 0) {
      return NextResponse.json({ 
        goals: [],
        summary: {
          totalGoals: 0,
          onTrack: 0,
          atRisk: 0,
          offTrack: 0
        }
      });
    }

    // Get latest progress for each goal
    const goalIds = goals.map(g => g.id);
    const { data: latestProgress, error: progressError } = await supabase
      .from('team_goal_progress')
      .select(`
        goal_id,
        actual_value,
        target_value,
        delta,
        status,
        calculated_at
      `)
      .in('goal_id', goalIds)
      .order('calculated_at', { ascending: false });

    if (progressError) {
      console.error('Error fetching latest progress:', progressError);
    }

    // Get trend data (last N games) for each goal
    const { data: trendData, error: trendError } = await supabase
      .from('team_goal_progress')
      .select(`
        goal_id,
        actual_value,
        calculated_at,
        live_game_sessions!inner (
          id,
          events (
            name,
            oppositionTeam
          )
        )
      `)
      .in('goal_id', goalIds)
      .order('calculated_at', { ascending: false })
      .limit(limit * goalIds.length); // Get last N records per goal

    if (trendError) {
      console.error('Error fetching trend data:', trendError);
    }

    // COMMENTED OUT: Get recent notifications
    // const { data: notifications, error: notificationsError } = await supabase
    //   .from('notifications')
    //   .select('id, type, title, message, data, createdAt')
    //   .in('type', ['GOAL_AT_RISK', 'GOAL_OFF_TRACK', 'GOAL_ACHIEVED', 'GOAL_TREND_IMPROVING'])
    //   .order('createdAt', { ascending: false })
    //   .limit(10);

    // if (notificationsError) {
    //   console.error('Error fetching notifications:', notificationsError);
    // }

    // Process data to create dashboard summary
    const goalsWithProgress = goals.map(goal => {
      const latest = latestProgress?.find(p => p.goal_id === goal.id);
      const trends = trendData?.filter(t => t.goal_id === goal.id).slice(0, limit) || [];

      return {
        ...goal,
        currentProgress: latest ? {
          actualValue: latest.actual_value,
          targetValue: latest.target_value,
          delta: latest.delta,
          status: latest.status,
          lastCalculated: latest.calculated_at
        } : null,
        trends: trends.map(t => ({
          value: t.actual_value,
          date: t.calculated_at,
          game: t.live_game_sessions?.events?.name || 'Unknown Game',
          opponent: t.live_game_sessions?.events?.oppositionTeam || 'Unknown'
        }))
      };
    });

    // Calculate summary statistics
    const summary = {
      totalGoals: goalsWithProgress.length,
      onTrack: goalsWithProgress.filter(g => g.currentProgress?.status === 'on_track').length,
      atRisk: goalsWithProgress.filter(g => g.currentProgress?.status === 'at_risk').length,
      offTrack: goalsWithProgress.filter(g => g.currentProgress?.status === 'off_track').length
    };

    return NextResponse.json({
      goals: goalsWithProgress,
      summary
      // COMMENTED OUT: recentNotifications: notifications || []
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
