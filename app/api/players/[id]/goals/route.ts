import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'
import { z } from 'zod'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

// Input validation schema
const createGoalSchema = z.object({
	title: z.string().min(1).max(255).trim(),
	description: z.string().max(1000).optional(),
	target_value: z.number().optional(),
	priority: z.enum(['low', 'medium', 'high']).optional(),
	deadline: z.string().datetime().optional()
})

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		
		const resolvedParams = await params
		const playerId = parseInt(resolvedParams.id)
		
		if (isNaN(playerId) || playerId <= 0) {
			return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
		}

		// Verify player exists
		const { data: player, error: playerError } = await (supabase as any)
			.from('players')
			.select('id')
			.eq('id', playerId)
			.single()

		if (playerError || !player) {
			return NextResponse.json({ error: 'Player not found' }, { status: 404 })
		}

		// Get player goals
		// Note: createdBy is an integer field (legacy) with no foreign key to auth_users
		const { data: goals, error } = await (supabase as any)
			.from('player_goals')
			.select(`
				id,
				goal,
				goal_text,
				targetDate,
				isAchieved,
				category,
				createdAt,
				created_at,
				createdBy
			`)
			.eq('playerId', playerId)
			.order('createdAt', { ascending: false })

		if (error) {
			console.error('Error fetching goals:', error);
			return NextResponse.json({ error: 'Failed to fetch goals', details: error.message }, { status: 500 })
		}

		// Transform goals to include createdUser for NoteList component
		// Since createdBy is just an integer with no user mapping, set createdUser to null
		const transformedGoals = (goals || []).map((g: any) => ({
			...g,
			createdUser: null  // No user mapping available for legacy integer createdBy
		}))
		
		return NextResponse.json({ goals: transformedGoals })
	} catch (error) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		
		const resolvedParams = await params
		const playerId = parseInt(resolvedParams.id)
		
		if (isNaN(playerId) || playerId <= 0) {
			return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
		}

		// Verify player exists
		const { data: player, error: playerError } = await (supabase as any)
			.from('players')
			.select('id')
			.eq('id', playerId)
			.single()

		if (playerError || !player) {
			return NextResponse.json({ error: 'Player not found' }, { status: 404 })
		}

		const body = await request.json()
		const validatedData = createGoalSchema.parse(body)
		const { title, description, target_value, priority, deadline } = validatedData

		// Create new goal
		// Note: createdBy is an integer field (legacy), set to 0 as fallback
		// TODO: Consider migrating to UUID or removing this constraint
		const { data: goal, error } = await (supabase as any)
			.from('player_goals')
			.insert({
				playerId: playerId,
				goal: title,
				goal_text: description || '',
				targetDate: deadline || null,
				isAchieved: false,
				category: priority || 'medium',
				createdBy: 0  // Legacy integer field, no mapping to auth.users
			})
			.select(`
				id,
				goal,
				goal_text,
				targetDate,
				isAchieved,
				category,
				createdAt,
				created_at,
				createdBy
			`)
			.single()

		if (error) {
			console.error('Error creating goal:', error);
			return NextResponse.json({ error: 'Failed to create goal', details: error.message }, { status: 500 })
		}

		// Transform goal to include createdUser for NoteList component
		// Since createdBy is just an integer with no user mapping, set createdUser to null
		const transformedGoal = {
			...goal,
			createdUser: null  // No user mapping available for legacy integer createdBy
		}
		
		return NextResponse.json({ goal: transformedGoal }, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Invalid input data', details: error.issues }, { status: 400 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
