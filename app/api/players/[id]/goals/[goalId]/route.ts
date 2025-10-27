import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; goalId: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		const resolvedParams = await params;
		const playerId = parseInt(resolvedParams.id);
		const goalId = parseInt(resolvedParams.goalId);
		
		if (isNaN(playerId) || isNaN(goalId)) {
			return NextResponse.json({ error: 'Invalid player ID or goal ID' }, { status: 400 });
		}

		// Get specific goal
		const { data: goal, error } = await (supabase as any)
			.from('player_goals')
			.select(`
				id,
				goal as title,
				goal_text as description,
				targetDate as deadline,
				isAchieved as status,
				category as priority,
				createdAt as created_at,
				updatedAt as updated_at,
				createdBy as created_by,
				auth_users!player_goals_createdBy_fkey (
					id,
					email
				)
			`)
			.eq('id', goalId)
			.eq('playerId', playerId)
			.single();

		if (error) {
			console.error('Error fetching goal:', error);
			return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
		}

		if (!goal) {
			return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
		}

		return NextResponse.json({ goal });
	} catch (error) {
		console.error('Error in goal GET:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; goalId: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		const resolvedParams = await params;
		const playerId = parseInt(resolvedParams.id);
		const goalId = parseInt(resolvedParams.goalId);
		
		if (isNaN(playerId) || isNaN(goalId)) {
			return NextResponse.json({ error: 'Invalid player ID or goal ID' }, { status: 400 });
		}

		const body = await request.json();
		const { title, description, target_value, current_value, status, priority, deadline } = body;

		// Update goal
		const { data: goal, error } = await (supabase as any)
			.from('player_goals')
			.update({
				goal: title?.trim(),
				goal_text: description?.trim(),
				targetDate: deadline,
				isAchieved: status === 'achieved',
				category: priority,
				updatedAt: new Date().toISOString()
			})
			.eq('id', goalId)
			.eq('playerId', playerId)
			.select(`
				id,
				goal as title,
				goal_text as description,
				targetDate as deadline,
				isAchieved as status,
				category as priority,
				createdAt as created_at,
				updatedAt as updated_at,
				createdBy as created_by,
				auth_users!player_goals_createdBy_fkey (
					id,
					email
				)
			`)
			.single();

		if (error) {
			console.error('Error updating goal:', error);
			return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
		}

		return NextResponse.json({ goal });
	} catch (error) {
		console.error('Error in goal PUT:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; goalId: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request);
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		
		const resolvedParams = await params;
		const playerId = parseInt(resolvedParams.id);
		const goalId = parseInt(resolvedParams.goalId);
		
		if (isNaN(playerId) || isNaN(goalId)) {
			return NextResponse.json({ error: 'Invalid player ID or goal ID' }, { status: 400 });
		}

		// Delete goal
		const { error } = await (supabase as any)
			.from('player_goals')
			.delete()
			.eq('id', goalId)
			.eq('playerId', playerId);

		if (error) {
			console.error('Error deleting goal:', error);
			return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
		}

		return NextResponse.json({ message: 'Goal deleted successfully' });
	} catch (error) {
		console.error('Error in goal DELETE:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}