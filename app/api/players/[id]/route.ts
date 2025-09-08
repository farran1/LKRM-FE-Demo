import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../../src/services/supabase-api'

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

		console.log('API GET /players/[id] - fetching player:', playerId)
		const player = await supabaseAPI.getPlayer(playerId)
		
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
		
		const updatedPlayer = await supabaseAPI.updatePlayer(playerId, body)
		
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
		const { id } = await params
		const playerId = parseInt(id)
		
		if (isNaN(playerId)) {
			return NextResponse.json(
				{ error: 'Invalid player ID' },
				{ status: 400 }
			)
		}

		console.log('API DELETE /players/[id] - deleting player:', playerId)
		await supabaseAPI.deletePlayer(playerId)
		
		return NextResponse.json({ message: 'Player deleted successfully' })
	} catch (error) {
		console.error('Error deleting player:', error)
		return NextResponse.json(
			{ error: 'Failed to delete player' },
			{ status: 500 }
		)
	}
}
