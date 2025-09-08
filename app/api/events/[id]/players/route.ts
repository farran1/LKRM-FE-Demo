import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAPI } from '@/services/supabase-api';

const supabaseAPI = new SupabaseAPI();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Get players associated with this event
    const players = await supabaseAPI.getPlayersByEvent(eventId);
    
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching event players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event players' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id);
    const body = await request.json();
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Add player to event
    const result = await supabaseAPI.addPlayerToEvent(eventId, body.playerId, body.status);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding player to event:', error);
    return NextResponse.json(
      { error: 'Failed to add player to event' },
      { status: 500 }
    );
  }
}
