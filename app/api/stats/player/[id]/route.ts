import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const playerId = parseInt(resolvedParams.id);
    
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || '2024-25';
    const timeRange = searchParams.get('timeRange') || 'season';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get player details
    const { data: player, error: playerError } = await (supabase as any)
      .from('players')
      .select(`
        *,
        position:positions(id, name, abbreviation)
      `)
      .eq('id', playerId)
      .eq('isActive', true)
      .single();

    if (playerError) {
      console.error('Error fetching player:', playerError);
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Build time bounds based on timeRange
    let fromDate: string | null = null;
    let toDate: string | null = null;

    if (timeRange === 'season') {
      // Derive season start from season string like "2024-25" -> use Aug 1st of first year
      const match = season.match(/^(\d{4})/);
      const startYear = match ? parseInt(match[1], 10) : new Date().getFullYear();
      fromDate = new Date(Date.UTC(startYear, 7, 1)).toISOString(); // Aug(7) 1 UTC
      toDate = new Date().toISOString();
    } else if (timeRange === 'last30days') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      fromDate = thirtyDaysAgo.toISOString();
      toDate = now.toISOString();
    } else if (timeRange === 'custom' && startDate && endDate) {
      // Use full-day bounds for custom range
      fromDate = new Date(startDate + 'T00:00:00Z').toISOString();
      toDate = new Date(endDate + 'T23:59:59.999Z').toISOString();
    } else {
      // Fallback: current season approximation if unspecified
      const now = new Date();
      const approxSeasonStart = new Date(Date.UTC(now.getUTCFullYear(), 7, 1)).toISOString();
      fromDate = approxSeasonStart;
      toDate = now.toISOString();
    }

    // Get live game events for this player (untyped client)
    let eventsQuery = (supabase as any)
      .from('live_game_events')
      .select('id, session_id, game_id, event_type, player_id, quarter, created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (fromDate) {
      eventsQuery = eventsQuery.gte('created_at', fromDate);
    }
    if (toDate) {
      eventsQuery = eventsQuery.lte('created_at', toDate);
    }

    let { data: filteredEvents, error: eventsError } = await eventsQuery as any;
    if (eventsError) {
      console.warn('Error fetching filtered events (proceeding with empty):', eventsError);
      filteredEvents = [] as any[];
    }

    // Respect time filters strictly; no unbounded fallback

    // Scrimmage exclusion is based on Events table via game_id
    const gameIds = Array.from(new Set((filteredEvents || []).map((e: any) => e.game_id))).filter(Boolean);
    let allowedGameIds = new Set<string>();
    let gameIdToEvent: Record<string, any> = {};
    if (gameIds.length > 0) {
      try {
        let gamesQuery = (supabase as any)
          .from('events')
          .select('id, name, startTime')
          .in('id', gameIds);

        // Apply time filters to the game start time so per-game log respects range
        if (fromDate) {
          gamesQuery = gamesQuery.gte('startTime', fromDate);
        }
        if (toDate) {
          gamesQuery = gamesQuery.lte('startTime', toDate);
        }

        const { data: gamesData, error: gamesErr } = await gamesQuery;
        if (gamesErr) {
          console.warn('Events fetch for scrimmage filter failed; proceeding without exclusion:', gamesErr);
        } else {
          (gamesData || []).forEach((g: any) => {
            if (!g?.name || !/scrimmage/i.test(g.name)) {
              allowedGameIds.add(String(g.id));
            }
            gameIdToEvent[String(g.id)] = g;
          });
        }
      } catch (e) {
        console.warn('Events fetch exception; proceeding without scrimmage exclusion:', e);
      }
    }

    // No sessions used; stats are computed from events only

    // Calculate player statistics
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
    const gamesPlayed = new Set();
    const gameStats: any[] = [];

    // Group strictly by game_id for per-game aggregates (avoids cross-game aggregation)
    const eventsByGroup: Record<string, any[]> = {};
    (filteredEvents || []).forEach((ev: any) => {
      const gid = ev.game_id != null ? String(ev.game_id) : null;
      if (!gid) {
        // If we cannot determine a game id for this event, skip it for per-game logs
        return;
      }
      (eventsByGroup[gid] ||= []).push(ev);
    });

    for (const [groupKey, evs] of Object.entries(eventsByGroup)) {
      // groupKey is the game_id string
      const groupGameId = groupKey;
      if (groupGameId && allowedGameIds.size > 0 && !allowedGameIds.has(groupGameId)) {
        continue;
      }
      let gamePoints = 0;
      let gameFgMade = 0;
      let gameFgAttempted = 0;
      let gameThreeMade = 0;
      let gameThreeAttempted = 0;
      let gameFtMade = 0;
      let gameFtAttempted = 0;
      let gameRebounds = 0;
      let gameAssists = 0;
      let gameSteals = 0;
      let gameBlocks = 0;
      let gameTurnovers = 0;
      let gameFouls = 0;

      evs.forEach((event: any) => {
        switch (event.event_type) {
          case 'fg_made':
            points += 2;
            gamePoints += 2;
            fgMade++;
            gameFgMade++;
            fgAttempted++;
            gameFgAttempted++;
            break;
          case 'fg_missed':
            fgAttempted++;
            gameFgAttempted++;
            break;
          case 'three_made':
            points += 3;
            gamePoints += 3;
            threeMade++;
            gameThreeMade++;
            threeAttempted++;
            gameThreeAttempted++;
            fgMade++;
            gameFgMade++;
            fgAttempted++;
            gameFgAttempted++;
            break;
          case 'three_missed':
            threeAttempted++;
            gameThreeAttempted++;
            fgAttempted++;
            gameFgAttempted++;
            break;
          case 'ft_made':
            points += 1;
            gamePoints += 1;
            ftMade++;
            gameFtMade++;
            ftAttempted++;
            gameFtAttempted++;
            break;
          case 'ft_missed':
            ftAttempted++;
            gameFtAttempted++;
            break;
          case 'rebound':
            rebounds++;
            gameRebounds++;
            break;
          case 'assist':
            assists++;
            gameAssists++;
            break;
          case 'steal':
            steals++;
            gameSteals++;
            break;
          case 'block':
            blocks++;
            gameBlocks++;
            break;
          case 'turnover':
            turnovers++;
            gameTurnovers++;
            break;
          case 'foul':
            fouls++;
            gameFouls++;
            break;
        }
      });

      gamesPlayed.add(groupKey);
      const evGame = groupGameId ? gameIdToEvent[groupGameId] : null;
      gameStats.push({
        gameId: Number(groupGameId),
        gameName: evGame?.name || 'Game',
        gameDate: evGame?.startTime || evs[0]?.created_at,
        points: gamePoints,
        fgMade: gameFgMade,
        fgAttempted: gameFgAttempted,
        threeMade: gameThreeMade,
        threeAttempted: gameThreeAttempted,
        ftMade: gameFtMade,
        ftAttempted: gameFtAttempted,
        rebounds: gameRebounds,
        assists: gameAssists,
        steals: gameSteals,
        blocks: gameBlocks,
        turnovers: gameTurnovers,
        fouls: gameFouls,
        fgPct: gameFgAttempted > 0 ? Math.round((gameFgMade / gameFgAttempted) * 100) : 0,
        threePct: gameThreeAttempted > 0 ? Math.round((gameThreeMade / gameThreeAttempted) * 100) : 0,
        ftPct: gameFtAttempted > 0 ? Math.round((gameFtMade / gameFtAttempted) * 100) : 0
      });
    }

    const games = gamesPlayed.size;

    // Calculate per-game averages
    const ppg = games > 0 ? Math.round((points / games) * 10) / 10 : 0;
    const apg = games > 0 ? Math.round((assists / games) * 10) / 10 : 0;
    const rpg = games > 0 ? Math.round((rebounds / games) * 10) / 10 : 0;
    const spg = games > 0 ? Math.round((steals / games) * 10) / 10 : 0;
    const bpg = games > 0 ? Math.round((blocks / games) * 10) / 10 : 0;
    const tpg = games > 0 ? Math.round((turnovers / games) * 10) / 10 : 0;
    const fpg = games > 0 ? Math.round((fouls / games) * 10) / 10 : 0;
    const fgPct = fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 100) : 0;
    const threePct = threeAttempted > 0 ? Math.round((threeMade / threeAttempted) * 100) : 0;
    const ftPct = ftAttempted > 0 ? Math.round((ftMade / ftAttempted) * 100) : 0;

    // Calculate recent performance (last 5 games)
    const recentGames = gameStats.slice(0, 5);
    const recentPoints = recentGames.map(game => game.points);
    const recentPpg = recentGames.length > 0 ? 
      Math.round((recentGames.reduce((sum, game) => sum + game.points, 0) / recentGames.length) * 10) / 10 : 0;

    // Determine trend
    let trend = 'steady';
    if (recentPpg > ppg + 2) trend = 'rapidly_improving';
    else if (recentPpg > ppg) trend = 'improving';
    else if (recentPpg < ppg - 2) trend = 'declining';

    const playerStats = {
      player: {
        id: player.id,
        name: player.name,
        firstName: player.first_name,
        lastName: player.last_name,
        position: player.position,
        jersey: player.jersey,
        jerseyNumber: player.jersey_number,
        schoolYear: player.school_year,
        height: player.height,
        weight: player.weight,
        phoneNumber: player.phoneNumber,
        email: player.email,
        avatar: player.avatar,
        birthDate: player.birthDate,
        isActive: player.isActive,
        createdAt: player.created_at,
        updatedAt: player.updated_at
      },
      season: season,
      timeRange: timeRange,
      games: games,
      totals: {
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
        fouls
      },
      averages: {
        ppg,
        apg,
        rpg,
        spg,
        bpg,
        tpg,
        fpg
      },
      percentages: {
        fgPct,
        threePct,
        ftPct
      },
      recent: {
        points: recentPoints,
        ppg: recentPpg,
        trend
      },
      gameStats: gameStats,
      // debug fields to verify filtering
      debug: {
        timeRange,
        fromDate,
        toDate,
        eventCount: (filteredEvents || []).length
      }
    };

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('Error in player stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


