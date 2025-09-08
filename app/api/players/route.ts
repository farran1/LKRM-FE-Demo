import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../src/services/supabase-api'

const supabaseAPI = new SupabaseAPI()

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const params = Object.fromEntries(searchParams.entries())
		console.log('API GET /players - params:', params)
		
		const res = await supabaseAPI.getPlayers(params)
		console.log('API GET /players - returning:', res)
		
		return NextResponse.json(res)
	} catch (error) {
		console.error('Error fetching players:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch players' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const res = await supabaseAPI.createPlayer(body)
		return NextResponse.json(res, { status: 201 })
	} catch (error) {
		console.error('Error creating player:', error)
		return NextResponse.json(
			{ error: 'Failed to create player' },
			{ status: 500 }
		)
	}
}
