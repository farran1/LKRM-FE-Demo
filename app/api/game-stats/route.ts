import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAPI } from '../../../src/services/supabase-api';

const supabaseAPI = new SupabaseAPI();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const gameId = searchParams.get('gameId');
    
    if (!eventId && !gameId) {
      return NextResponse.json(
        { error: 'eventId or gameId is required' },
        { status: 400 }
      );
    }

    let stats;
    if (eventId) {
      // Get stats for a specific event
      stats = await supabaseAPI.getGameStatsByEvent(parseInt(eventId));
    } else if (gameId) {
      // Get stats for a specific game
      stats = await supabaseAPI.getGameStatsByGame(parseInt(gameId));
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game stats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.eventId || !body.playerId || !body.statType) {
      return NextResponse.json(
        { error: 'eventId, playerId, and statType are required' },
        { status: 400 }
      );
    }

    // Create or update game stat
    const result = await supabaseAPI.createOrUpdateGameStat(body);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating game stat:', error);
    return NextResponse.json(
      { error: 'Failed to create/update game stat' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Stat ID is required' },
        { status: 400 }
      );
    }

    const result = await supabaseAPI.updateGameStat(body.id, body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating game stat:', error);
    return NextResponse.json(
      { error: 'Failed to update game stat' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Stat ID is required' },
        { status: 400 }
      );
    }

    await supabaseAPI.deleteGameStat(parseInt(id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game stat:', error);
    return NextResponse.json(
      { error: 'Failed to delete game stat' },
      { status: 500 }
    );
  }
}
