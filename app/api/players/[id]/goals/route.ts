import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../../../src/services/supabase-api'

const supabaseAPI = new SupabaseAPI()

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const playerId = parseInt(id)
		
		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: 'Invalid player ID' },
				{ status: 400 }
			)
		}

		console.log('API GET /players/[id]/goals - fetching goals for player:', playerId)
		
		const goals = await supabaseAPI.getPlayerGoals(playerId)
		
		console.log('API GET /players/[id]/goals - returning goals:', goals)
		return NextResponse.json({ goals })
	} catch (error) {
		console.error('Error fetching player goals:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch player goals' },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		const playerId = parseInt(id)
		
		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: 'Invalid player ID' },
				{ status: 400 }
			)
		}

		const body = await request.json()
		console.log('API POST /players/[id]/goals - creating goal for player:', playerId, 'with data:', body)
		
		const goal = await supabaseAPI.createPlayerGoal({
			playerId,
			goalText: body.goal || body.goalText
		})
		
		console.log('API POST /players/[id]/goals - created goal:', goal)
		return NextResponse.json({ goal }, { status: 201 })
	} catch (error) {
		console.error('Error creating player goal:', error)
		return NextResponse.json(
			{ error: 'Failed to create player goal' },
			{ status: 500 }
		)
	}
}
