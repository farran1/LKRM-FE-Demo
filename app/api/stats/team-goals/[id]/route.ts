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

    const { data: goal, error } = await (supabase as any)
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
      .eq('created_by', user.id) // Ensure user can only access their own goals
      .single();

    if (error) {
      console.error('Error fetching team goal:', error);
      return NextResponse.json({ error: 'Failed to fetch team goal' }, { status: 500 });
    }

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error in team goals GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { 
      target_value, 
      comparison_operator, 
      period_type, 
      season, 
      competition_filter, 
      visibility, 
      status,
      notes 
    } = body;

    // Validate comparison operator if provided
    if (comparison_operator) {
      const validOperators = ['gte', 'lte', 'eq'];
      if (!validOperators.includes(comparison_operator)) {
        return NextResponse.json({ error: 'Invalid comparison operator' }, { status: 400 });
      }
    }

    // Validate period type if provided
    if (period_type) {
      const validPeriodTypes = ['per_game', 'season_total', 'rolling_5', 'rolling_10'];
      if (!validPeriodTypes.includes(period_type)) {
        return NextResponse.json({ error: 'Invalid period type' }, { status: 400 });
      }
    }

    // Validate visibility if provided
    if (visibility) {
      const validVisibility = ['staff_only', 'shared_with_team'];
      if (!validVisibility.includes(visibility)) {
        return NextResponse.json({ error: 'Invalid visibility setting' }, { status: 400 });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatus = ['active', 'archived'];
      if (!validStatus.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (target_value !== undefined) updateData.target_value = parseFloat(target_value);
    if (comparison_operator !== undefined) updateData.comparison_operator = comparison_operator;
    if (period_type !== undefined) updateData.period_type = period_type;
    if (season !== undefined) updateData.season = season;
    if (competition_filter !== undefined) updateData.competition_filter = competition_filter;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data: goal, error } = await (supabase as any)
      .from('team_goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('created_by', user.id) // Ensure user can only update their own goals
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
      console.error('Error updating team goal:', error);
      return NextResponse.json({ error: 'Failed to update team goal' }, { status: 500 });
    }

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error in team goals PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Soft delete by setting status to archived
    const { data: goal, error } = await (supabase as any)
      .from('team_goals')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('created_by', user.id) // Ensure user can only delete their own goals
      .select()
      .single();

    if (error) {
      console.error('Error archiving team goal:', error);
      return NextResponse.json({ error: 'Failed to archive team goal' }, { status: 500 });
    }

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Goal archived successfully' });
  } catch (error) {
    console.error('Error in team goals DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
