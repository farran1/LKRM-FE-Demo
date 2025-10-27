import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024-25';
    const status = searchParams.get('status') || 'active';
    const visibility = searchParams.get('visibility');

    let query = (supabase as any)
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
      .eq('season', season)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (visibility) {
      query = query.eq('visibility', visibility);
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error('Error fetching team goals:', error);
      return NextResponse.json({ error: 'Failed to fetch team goals' }, { status: 500 });
    }

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error in team goals GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      metric_id, 
      target_value, 
      comparison_operator, 
      period_type, 
      season, 
      competition_filter
    } = body;

    // Validate required fields
    if (!metric_id || target_value === undefined || !comparison_operator) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate comparison operator
    const validOperators = ['gte', 'lte', 'eq'];
    if (!validOperators.includes(comparison_operator)) {
      return NextResponse.json({ error: 'Invalid comparison operator' }, { status: 400 });
    }

    // Validate period type
    const validPeriodTypes = ['per_game', 'season_total', 'rolling_5', 'rolling_10'];
    if (period_type && !validPeriodTypes.includes(period_type)) {
      return NextResponse.json({ error: 'Invalid period type' }, { status: 400 });
    }

    // Verify metric exists
    const { data: metric, error: metricError } = await (supabase as any)
      .from('stat_metrics')
      .select('id, name')
      .eq('id', metric_id)
      .eq('is_active', true)
      .single();

    if (metricError || !metric) {
      return NextResponse.json({ error: 'Invalid metric ID' }, { status: 400 });
    }

    const { data: goal, error } = await (supabase as any)
      .from('team_goals')
      .insert({
        metric_id,
        target_value: parseFloat(target_value),
        comparison_operator,
        period_type: period_type || 'per_game',
        season: season || '2024-25',
        competition_filter: competition_filter || {},
        status: 'active',
        created_by: user.id // Use authenticated user ID
      })
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
      .single();

    if (error) {
      console.error('Error creating team goal:', error);
      return NextResponse.json({ error: 'Failed to create team goal' }, { status: 500 });
    }

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Error in team goals POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
