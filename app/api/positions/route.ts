import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../src/services/supabase-api'

const supabaseAPI = new SupabaseAPI()

export async function GET(request: NextRequest) {
	try {
		const res = await supabaseAPI.getPositions()
		return NextResponse.json(res)
	} catch (error) {
		console.error('Error fetching positions:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch positions' },
			{ status: 500 }
		)
	}
}
