import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAPI } from '../../../src/services/supabase-api'

const supabaseAPI = new SupabaseAPI()

export async function GET(request: NextRequest) {
	try {
		const res = await supabaseAPI.getPriorities()
		const response = NextResponse.json(res)
		
		// Add cache-busting headers to prevent stale data
		response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
		response.headers.set('Pragma', 'no-cache')
		response.headers.set('Expires', '0')
		
		return response
	} catch (error) {
		console.error('Error fetching priorities:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch priorities' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		console.log('API POST /priorities - received body:', JSON.stringify(body, null, 2))
		
		const res = await supabaseAPI.createPriority(body)
		console.log('API POST /priorities - supabase result:', JSON.stringify(res, null, 2))
		
		return NextResponse.json(res, { status: 201 })
	} catch (error) {
		console.error('Error creating priority:', error)
		return NextResponse.json(
			{ error: 'Failed to create priority' },
			{ status: 500 }
		)
	}
}
