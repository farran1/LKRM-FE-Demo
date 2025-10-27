import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    const { playerId } = await params;
    const body = await request.json();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate required fields
    const { game_id, points, rebounds, assists, steals, blocks, turnovers, fouls } = body;
    
    if (!game_id) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    // Verify the game exists and user has permission
    const { data: game, error: gameError } = await (supabase as any)
      .from('games')
      .select(`
        id,
        event_id,
        events!inner (
          id,
          createdBy
        )
      `)
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Handle nested event relation (could be an array in some cases)
    const event = Array.isArray(game.events) ? game.events[0] : game.events;
    
    if (!event || event.createdBy !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this game' }, { status: 403 });
    }

    // Check if game stats record exists
    const { data: existingStats, error: statsError } = await (supabase as any)
      .from('game_stats')
      .select('*')
      .eq('game_id', game_id)
      .eq('player_id', parseInt(playerId))
      .single();

    const statsData = {
      game_id,
      player_id: parseInt(playerId),
      points: points || 0,
      rebounds: rebounds || 0,
      assists: assists || 0,
      steals: steals || 0,
      blocks: blocks || 0,
      turnovers: turnovers || 0,
      fouls: fouls || 0,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingStats) {
      // Update existing stats
      const { data: updatedStats, error: updateError } = await (supabase as any)
        .from('game_stats')
        .update(statsData)
        .eq('id', existingStats.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating game stats:', updateError);
        return NextResponse.json({ error: 'Failed to update game stats' }, { status: 500 });
      }
      result = updatedStats;
    } else {
      // Create new stats record
      const { data: newStats, error: insertError } = await (supabase as any)
        .from('game_stats')
        .insert(statsData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating game stats:', insertError);
        return NextResponse.json({ error: 'Failed to create game stats' }, { status: 500 });
      }
      result = newStats;
    }

    // Log the change for audit trail
    await (supabase as any)
      .from('audit_logs')
      .insert({
        userid: user.id,
        action: existingStats ? 'UPDATE_GAME_STATS' : 'CREATE_GAME_STATS',
        table: 'game_stats',
        recordId: result.id,
        oldData: existingStats,
        newData: result,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      });

    return NextResponse.json({ 
      stats: result,
      message: existingStats ? 'Game stats updated successfully' : 'Game stats created successfully'
    });
  } catch (error) {
    console.error('Error in PUT /game-stats/[playerId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
