import { NextRequest, NextResponse } from 'next/server'
import { supabaseAPI } from '../../../../../src/services/supabase-api'

// Force Node.js runtime to avoid Edge Runtime issues with Supabase
export const runtime = 'nodejs'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	console.log('=== NOTES GET ROUTE CALLED ===')
	console.log('Request URL:', request.url)
	
	try {
		const { id } = await params
		const playerId = parseInt(id)
		
		console.log('Player ID parsed:', playerId)
		
		if (isNaN(playerId)) {
			console.log('Invalid player ID')
			return NextResponse.json(
				{ error: 'Invalid player ID' },
				{ status: 400 }
			)
		}

		console.log('API GET /players/[id]/notes - fetching notes for player:', playerId)
		
		const notes = await supabaseAPI.getPlayerNotes(playerId)
		
		console.log('API GET /players/[id]/notes - returning notes:', notes)
		return NextResponse.json({ notes })
	} catch (error) {
		console.error('Error fetching player notes:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch player notes' },
			{ status: 500 }
		)
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	console.log('=== NOTES POST ROUTE CALLED ===')
	
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
		console.log('API POST /players/[id]/notes - request body:', body)
		console.log('API POST /players/[id]/notes - creating note for player:', playerId, 'with data:', body)
		
		// Check if we have the required note text
		if (!body.note && !body.noteText) {
			console.error('Missing note text in request body')
			return NextResponse.json(
				{ error: 'Missing note text' },
				{ status: 400 }
			)
		}
		
		const note = await supabaseAPI.createPlayerNote({
			playerId,
			noteText: body.note || body.noteText
		})
		
		console.log('API POST /players/[id]/notes - created note:', note)
		return NextResponse.json({ note }, { status: 201 })
	} catch (error) {
		console.error('Error creating player note:', error)
		console.error('Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : 'No stack trace'
		})
		return NextResponse.json(
			{ error: 'Failed to create player note' },
			{ status: 500 }
		)
	}
}
