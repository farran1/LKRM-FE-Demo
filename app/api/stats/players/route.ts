import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024-25';
    const timeRange = searchParams.get('timeRange') || 'season';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gameIdsParam = searchParams.get('gameIds');
    const selectedIds = gameIdsParam ? gameIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0) : [];

    // Get all players
    const { data: players, error: playersError } = await (supabase as any)
      .from('players' as any)
      .select(`
        *,
        position:positions(id, name, abbreviation)
      `)
      .order('name');

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }

    // Build date filter based on timeRange
    let dateFilter = '2024-01-01'; // Default season start
    if (timeRange === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = thirtyDaysAgo.toISOString().split('T')[0];
    } else if (timeRange === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = sevenDaysAgo.toISOString().split('T')[0];
    } else if (timeRange === 'custom' && startDate && endDate) {
      dateFilter = startDate;
    }

    // Get live game events for the season with proper date filtering
    let sessionsQuery = (supabase as any)
      .from('live_game_sessions' as any)
      .select(`
        id,
        created_at,
        events (
          name,
          startTime
        ),
        live_game_events (
          event_type,
          player_id,
          opponent_jersey,
          created_at
        )
      `)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: false });

    if (timeRange === 'selectGames' && selectedIds.length > 0) {
      sessionsQuery = (sessionsQuery as any).in('id', selectedIds as any);
    }

    // Add end date filter if provided
    if (timeRange === 'custom' && endDate) {
      sessionsQuery = sessionsQuery.lte('created_at', endDate);
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 });
    }

    // Calculate player statistics
    const playerStats = (players as any[])?.map((player: any) => {
      let points = 0;
      let fgMade = 0;
      let fgAttempted = 0;
      let threeMade = 0;
      let threeAttempted = 0;
      let ftMade = 0;
      let ftAttempted = 0;
      let rebounds = 0;
      let assists = 0;
      let steals = 0;
      let blocks = 0;
      let turnovers = 0;
      let fouls = 0;
      let games = 0;

      // Track games played
      const gamesPlayed = new Set();

      (sessions as any[])?.forEach((session: any) => {
        let playedInGame = false;
        
        session.live_game_events?.forEach((event: any) => {
          if (event.player_id === player.id) {
            playedInGame = true;
            
            switch (event.event_type) {
              case 'fg_made':
                points += 2;
                fgMade++;
                fgAttempted++;
                break;
              case 'fg_missed':
                fgAttempted++;
                break;
              case 'three_made':
                points += 3;
                threeMade++;
                threeAttempted++;
                fgMade++;
                fgAttempted++;
                break;
              case 'three_missed':
                threeAttempted++;
                fgAttempted++;
                break;
              case 'ft_made':
                points += 1;
                ftMade++;
                ftAttempted++;
                break;
              case 'ft_missed':
                ftAttempted++;
                break;
              case 'rebound':
                rebounds++;
                break;
              case 'assist':
                assists++;
                break;
              case 'steal':
                steals++;
                break;
              case 'block':
                blocks++;
                break;
              case 'turnover':
                turnovers++;
                break;
              case 'foul':
                fouls++;
                break;
            }
          }
        });

        if (playedInGame) {
          gamesPlayed.add(session.id);
        }
      });

      games = gamesPlayed.size;

      // Calculate per-game averages
      const ppg = games > 0 ? Math.round((points / games) * 10) / 10 : 0;
      const apg = games > 0 ? Math.round((assists / games) * 10) / 10 : 0;
      const rpg = games > 0 ? Math.round((rebounds / games) * 10) / 10 : 0;
      const spg = games > 0 ? Math.round((steals / games) * 10) / 10 : 0;
      const fgPct = fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 100) : 0;
      const threePct = threeAttempted > 0 ? Math.round((threeMade / threeAttempted) * 100) : 0;
      const ftPct = ftAttempted > 0 ? Math.round((ftMade / ftAttempted) * 100) : 0;

      // Calculate recent points per game for trend visualization
      const recentPoints: any[] = [];
      const sortedSessions = (sessions as any[])?.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) || [];
      
      // Get last 10 games for trend data
      const recentSessions = sortedSessions.slice(-10);
      
      recentSessions.forEach((session: any, index: number) => {
        let gamePoints = 0;
        let gameRebounds = 0;
        let gameAssists = 0;
        let gameSteals = 0;
        let gameBlocks = 0;
        let gameEvents = 0;
        
        session.live_game_events?.forEach((event: any) => {
          if (event.player_id === player.id && !event.is_opponent_event) {
            gameEvents++;
            
            switch (event.event_type) {
              case 'fg_made':
                gamePoints += 2;
                break;
              case 'three_made':
                gamePoints += 3;
                break;
              case 'ft_made':
                gamePoints += 1;
                break;
              case 'rebound':
                gameRebounds += 1;
                break;
              case 'assist':
                gameAssists += 1;
                break;
              case 'steal':
                gameSteals += 1;
                break;
              case 'block':
                gameBlocks += 1;
                break;
            }
          }
        });
        
        if (gameEvents > 0) {
          recentPoints.push({
            game: index + 1,
            gameName: session.events?.name || `Game ${index + 1}`,
            points: gamePoints,
            rebounds: gameRebounds,
            assists: gameAssists,
            steals: gameSteals,
            blocks: gameBlocks
          });
        }
      });

      // Determine trend based on points scored progression
      let trend = 'steady';
      let changePct = 0;
      
      if (recentPoints.length >= 2) {
        // Simple comparison: first game vs last game points
        const firstGamePoints = recentPoints[0].points;
        const lastGamePoints = recentPoints[recentPoints.length - 1].points;
        
        // Calculate percentage change
        if (firstGamePoints > 0) {
          changePct = Math.round(((lastGamePoints - firstGamePoints) / firstGamePoints) * 100);
        } else if (lastGamePoints > 0) {
          changePct = 100; // Went from 0 to some points
        } else {
          changePct = 0; // Both are 0
        }
        
        // Simple trend based on points change
        if (changePct > 25) trend = 'rapidly_improving';
        else if (changePct > 5) trend = 'improving';
        else if (changePct < -25) trend = 'declining';
        else trend = 'steady';
      } else if (recentPoints.length === 1) {
        // Single game - show as improving if they scored
        changePct = recentPoints[0].points > 0 ? 100 : 0;
        trend = recentPoints[0].points > 10 ? 'improving' : 'steady';
      } else {
        // No recent games - use overall PPG
        changePct = 0;
        if (ppg > 15) trend = 'rapidly_improving';
        else if (ppg > 10) trend = 'improving';
        else if (ppg < 5) trend = 'declining';
      }

      return {
        id: player.id,
        name: player.name,
        position: player.position?.abbreviation || 'N/A',
        number: player.jersey_number || player.jersey || 0,
        points,
        fgMade,
        fgAttempted,
        threeMade,
        threeAttempted,
        ftMade,
        ftAttempted,
        rebounds,
        assists,
        steals,
        blocks,
        turnovers,
        fouls,
        games,
        ppg,
        apg,
        rpg,
        spg,
        fgPct,
        threePct,
        ftPct,
        trend,
        changePct,
        recentPoints
      };
    }) || [];

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('Error in players stats API:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 });
  }
}
