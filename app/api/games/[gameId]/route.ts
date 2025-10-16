/*
import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    console.log('Games API PUT called');
    const { client: supabase, user } = await createServerClientWithAuth(request);
    const { gameId } = await params;
    console.log('GameId:', gameId);
    const body = await request.json();
    console.log('Request body:', body);
    
    console.log('User auth result:', { user: user?.id });
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the game exists and user has permission
    console.log('Looking up game:', gameId);
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        event_id,
        events!inner (
          id,
          createdBy
        )
      `)
      .eq('id', gameId)
      .single();

    console.log('Game lookup result:', { game: game?.id, error: gameError?.message });

    if (gameError || !game) {
      console.log('Game not found:', gameError);
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    console.log('Checking permissions - user:', user.id, 'game creator:', game.events.createdBy);
    if (game.events.createdBy !== user.id) {
      console.log('Permission denied');
      return NextResponse.json({ error: 'Unauthorized to edit this game' }, { status: 403 });
    }

    // Validate the update data
    const allowedFields = [
      'home_score',
      'away_score', 
      'result',
      'notes'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add audit information
    updateData.updated_at = new Date().toISOString();

    // Update the game
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating game:', updateError);
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }

    // Log the change for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        userid: user.id,
        action: 'UPDATE_GAME',
        table: 'games',
        recordId: parseInt(gameId),
        oldData: game,
        newData: updatedGame,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      });

    return NextResponse.json({ 
      game: updatedGame,
      message: 'Game updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /games/[gameId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/

// Games PUT API temporarily disabled
export async function PUT() {
  return new Response('Box score editing temporarily disabled', { status: 503 });
}