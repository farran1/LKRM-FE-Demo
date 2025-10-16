import { NextRequest, NextResponse } from 'next/server'
import { createServerClientWithAuth } from '@/lib/supabase'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params
		const playerId = parseInt(id)
		
		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: 'Invalid player ID' },
				{ status: 400 }
			)
		}

		console.log('API GET /players/[id] - fetching player:', playerId)
		
		// Fetch player with position relationship
		const { data: player, error } = await supabase
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
			.eq('id', playerId)
			.single()

		if (error) {
			console.error('Error fetching player:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch player' },
				{ status: 500 }
			)
		}

		if (!player) {
			return NextResponse.json(
				{ error: 'Player not found' },
				{ status: 404 }
			)
		}

		console.log('API GET /players/[id] - returning player:', player)
		return NextResponse.json({ player })
	} catch (error) {
		console.error('Error fetching player:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch player' },
			{ status: 500 }
		)
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params
		const playerId = parseInt(id)
		
		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: 'Invalid player ID' },
				{ status: 400 }
			)
		}

		const body = await request.json()
		console.log('API PUT /players/[id] - updating player:', playerId, 'with data:', body)
		
		const { data: updatedPlayer, error } = await supabase
			.from('players')
			.update({
				first_name: body.first_name,
				last_name: body.last_name,
				jersey_number: body.jersey_number,
				positionId: body.positionId,
				height: body.height,
				weight: body.weight,
				school_year: body.school_year
			})
			.eq('id', playerId)
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
			.single()

		if (error) {
			console.error('Error updating player:', error)
			return NextResponse.json(
				{ error: 'Failed to update player' },
				{ status: 500 }
			)
		}

		console.log('API PUT /players/[id] - updated player:', updatedPlayer)
		return NextResponse.json({ player: updatedPlayer })
	} catch (error) {
		console.error('Error updating player:', error)
		return NextResponse.json(
			{ error: 'Failed to update player' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { client: supabase, user } = await createServerClientWithAuth(request)
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params
		const playerId = parseInt(id)
		
		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: 'Invalid player ID' },
				{ status: 400 }
			)
		}

		console.log('API DELETE /players/[id] - deleting player:', playerId)
		
		const { error } = await supabase
			.from('players')
			.delete()
			.eq('id', playerId)

		if (error) {
			console.error('Error deleting player:', error)
			return NextResponse.json(
				{ error: 'Failed to delete player' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({ message: 'Player deleted successfully' })
	} catch (error) {
		console.error('Error deleting player:', error)
		return NextResponse.json(
			{ error: 'Failed to delete player' },
			{ status: 500 }
		)
	}
}
