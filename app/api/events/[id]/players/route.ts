import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Players are not assigned to events - only coaches/attendees are
  // Return empty array immediately since this functionality is not used
  return NextResponse.json([]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Players are not assigned to events - only coaches/attendees are
  // Return success but do nothing since this functionality is not used
  return NextResponse.json({ success: true }, { status: 201 });
}

