import { NextResponse } from 'next/server'

export function GET() {
	return NextResponse.json({ message: 'Simple route working!' })
}

export function POST() {
	return NextResponse.json({ message: 'Simple route POST working!' })
}
