import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	console.log('API GET /test-route - working!')
	return NextResponse.json({ message: 'Test route is working!' })
}

export async function POST(request: NextRequest) {
	console.log('API POST /test-route - working!')
	const body = await request.json()
	console.log('API POST /test-route - received body:', JSON.stringify(body, null, 2))
	return NextResponse.json({ message: 'Test route POST is working!', received: body })
}
