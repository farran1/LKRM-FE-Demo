import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	console.log('API GET /task - test route working')
	return NextResponse.json({ message: 'GET /task is working' })
}

export async function POST(request: NextRequest) {
	console.log('API POST /task - test route working')
	const body = await request.json()
	console.log('API POST /task - received body:', JSON.stringify(body, null, 2))
	return NextResponse.json({ message: 'POST /task is working', received: body })
}
