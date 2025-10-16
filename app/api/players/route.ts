import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

export async function GET(request: NextRequest) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		const { searchParams } = new URL(request.url)
		const params = Object.fromEntries(searchParams.entries())
		console.log('API GET /players - params:', params)
		
		// Build query
		let query = supabase
			.from('players')
			.select(`
				id,
				name,
				first_name,
				last_name,
				jersey_number,
				jersey,
				positionId,
				height,
				weight,
				school_year,
				created_at,
				updated_at,
				positions (
					id,
					name,
					abbreviation
				)
			`)

		// Apply filters
    if (params.position) {
      const positionId = parseInt(params.position as string)
      if (!Number.isNaN(positionId)) {
        query = query.eq('positionId', positionId)
      }
		}
    if (params.class_year) {
      const allowed = ['freshman','sophomore','junior','senior'] as const
      const val = params.class_year as typeof allowed[number]
      if ((allowed as readonly string[]).includes(params.class_year as string)) {
        query = query.eq('school_year', val)
      }
		}
		if (params.isActive !== undefined) {
			query = query.eq('is_active', params.isActive === 'true')
		}
		if (params.search) {
			query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,name.ilike.%${params.search}%`)
		}

		// Apply sorting
		const sortBy = params.sortBy || 'last_name'
		const sortOrder = params.sortOrder || params.sortDirection || 'asc'
		const ascending = sortOrder === 'desc' ? false : true
		query = query.order(sortBy, { ascending })

		// Apply pagination
		if (params.limit) {
			const limit = parseInt(params.limit)
			const offset = parseInt(params.offset || '0')
			query = query.range(offset, offset + limit - 1)
		}

		const { data: players, error } = await query

		if (error) {
			console.error('Error fetching players:', error)
			return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
		}

		// Fetch notes and goals separately for each player
		const playersWithNotesAndGoals = await Promise.all(
			(players || []).map(async (player) => {
				// Fetch notes for this player
				const { data: notes } = await supabase
					.from('player_notes')
					.select('id, note_text, note, created_at')
					.eq('playerId', player.id)

				// Fetch goals for this player
				const { data: goals } = await supabase
					.from('player_goals')
					.select('id, goal_text, goal, targetDate, isAchieved, created_at')
					.eq('playerId', player.id)

				return {
					...player,
					notes: notes || [],
					goals: goals || []
				}
			})
		)

		console.log('API GET /players - returning:', { players: playersWithNotesAndGoals?.length || 0 })
		return NextResponse.json({ 
			success: true,
			data: playersWithNotesAndGoals || [],
			count: playersWithNotesAndGoals?.length || 0
		})
	} catch (error) {
		console.error('Error fetching players:', error)
		
		// Check if it's an authentication error
		if (error instanceof Error && error.message.includes('Authentication')) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		if (error instanceof Error && error.message.includes('permissions')) {
			return NextResponse.json(
				{ error: 'Insufficient permissions' },
				{ status: 403 }
			)
		}
		
		return NextResponse.json(
			{ error: 'Failed to fetch players' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		const body = await request.json()
		console.log('API POST /players - body:', body)

    const { data: player, error } = await supabase
			.from('players')
      .insert({
        name: `${body.first_name || ''} ${body.last_name || ''}`.trim(),
        first_name: body.first_name,
        last_name: body.last_name,
        jersey_number: body.jersey_number,
        positionId: body.positionId,
        height: body.height,
        weight: body.weight,
        school_year: body.school_year
      } as any)
			.select()
			.single()

		if (error) {
			console.error('Error creating player:', error)
			return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
		}

		console.log('API POST /players - created:', player)
		return NextResponse.json({ player }, { status: 201 })
	} catch (error) {
		console.error('Error creating player:', error)
		
		// Check if it's an authentication error
		if (error instanceof Error && error.message.includes('Authentication')) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		if (error instanceof Error && error.message.includes('permissions')) {
			return NextResponse.json(
				{ error: 'Insufficient permissions' },
				{ status: 403 }
			)
		}
		
		return NextResponse.json(
			{ error: 'Failed to create player' },
			{ status: 500 }
		)
	}
}