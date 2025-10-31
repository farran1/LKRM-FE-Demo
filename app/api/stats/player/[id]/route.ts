import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

// Helper function to extract opponent name from event name when oppositionTeam is null
function extractOpponentFromEventName(eventName: string | null | undefined): string | null {
  if (!eventName) return null;
  
  // Common patterns to extract opponent name:
  // "Milton HS V. Williams HS" -> "Williams HS"
  // "JL Mann VS Dutch Fork HS" -> "Dutch Fork HS"
  // "Away Game vs. Westside High" -> "Westside High"
  // "Season Opener vs. Central High" -> "Central High"
  
  const patterns = [
    /\s+[Vv][Ss]\.?\s+(.+)/i,      // "VS" or "Vs" or "vs"
    /\s+[Vv]\.?\s+(.+)/i,           // "V" or "v" or "V."
    /\s+vs\.?\s+(.+)/i,             // "vs" or "vs."
    /\s+versus\s+(.+)/i,            // "versus"
  ];
  
  for (const pattern of patterns) {
    const match = eventName.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

// Helper function to get opponent name with fallbacks
function getOpponentName(event: any): string {
  // Priority 1: Use oppositionTeam if available
  if (event?.oppositionTeam) {
    return event.oppositionTeam;
  }
  
  // Priority 2: Extract from event name
  const extractedName = extractOpponentFromEventName(event?.name);
  if (extractedName) {
    return extractedName;
  }
  
  // Priority 3: Fallback to event name or "Unknown"
  return event?.name || 'Unknown';
}

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
    const season = searchParams.get('season') || '2025-26';
    const timeRange = searchParams.get('timeRange') || 'season';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const gameIdsParam = searchParams.get('gameIds');
    const selectedGameIds = gameIdsParam ? gameIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0) : [];

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
    } else if (timeRange === 'selectGames' && selectedGameIds.length > 0) {
      // For selectGames, we'll filter by session_id and game_id after fetching events
      // Set a wide date range to get all events, then filter by session_id/game_id
      // Note: selectedGameIds are session IDs from recordedGames API
      fromDate = null;
      toDate = null;
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
    
    // Also get session_ids for events without game_id to fetch their event info
    const sessionIds = Array.from(new Set((filteredEvents || []).map((e: any) => e.session_id).filter(Boolean)));
    let sessionIdToEvent: Record<string, any> = {};
    
    if (gameIds.length > 0) {
      try {
        let gamesQuery = (supabase as any)
          .from('events')
          .select('id, name, startTime, oppositionTeam')
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
    
    // Fetch event info for sessions (events without game_id)
    if (sessionIds.length > 0) {
      try {
        const { data: sessionsData, error: sessionsErr } = await (supabase as any)
          .from('live_game_sessions')
          .select('id, event_id, events(id, name, startTime, oppositionTeam)')
          .in('id', sessionIds);
        
        if (!sessionsErr && sessionsData) {
          sessionsData.forEach((session: any) => {
            if (session?.events) {
              sessionIdToEvent[String(session.id)] = session.events;
            }
          });
        }
      } catch (e) {
        console.warn('Sessions fetch exception:', e);
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
    // Handle events without game_id by grouping them by session_id (each session is a separate game entry)
    // For selectGames mode, only include events from selected games
    const eventsByGroup: Record<string, any[]> = {};
    (filteredEvents || []).forEach((ev: any) => {
      // If game_id exists, use it as the grouping key
      // If game_id is null, use session_id instead so each session gets its own entry
      const gid = ev.game_id != null ? String(ev.game_id) : `session-${ev.session_id}`;
      
      // If selectGames mode is active, filter out events not in selectedGameIds
      // Note: selectedGameIds are actually session IDs from recordedGames
      if (timeRange === 'selectGames' && selectedGameIds.length > 0) {
        // Check if this event belongs to a selected session/game
        // selectedGameIds can be either session IDs or game IDs (depending on what was selected)
        const matchesBySession = ev.session_id != null && selectedGameIds.includes(String(ev.session_id));
        const matchesByGame = ev.game_id != null && selectedGameIds.includes(String(ev.game_id));
        
        if (!matchesBySession && !matchesByGame) {
          return; // Skip this event if it's not in the selected games/sessions
        }
      }
      
      (eventsByGroup[gid] ||= []).push(ev);
    });

    for (const [groupKey, evs] of Object.entries(eventsByGroup)) {
      // groupKey is either:
      // - A game_id string (e.g., "123")
      // - A session-based key (e.g., "session-39") for events without game_id
      const isSessionBased = groupKey.startsWith('session-');
      const groupGameId = isSessionBased ? null : groupKey;
      const sessionId = isSessionBased ? parseInt(groupKey.replace('session-', '')) : null;
      
      // Skip if this is a real game_id and it's not in allowedGameIds (excluded scrimmages)
      // But allow session-based events (no game_id) to be included
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
      
      // For session-based entries, get event info from session
      let sessionEvent = sessionId ? sessionIdToEvent[String(sessionId)] : null;
      
      // Determine game name using helper function
      let gameName: string;
      if (groupGameId && evGame) {
        // For games with game_id, use opponent name
        gameName = `vs ${getOpponentName(evGame)}`;
      } else if (sessionId && sessionEvent) {
        // For sessions, use opponent name from event
        gameName = `vs ${getOpponentName(sessionEvent)}`;
      } else if (groupGameId) {
        // Fallback for game_id without event data
        gameName = 'Game';
      } else {
        // Fallback for sessions without event data
        gameName = sessionId ? `Session ${sessionId}` : 'Practice/Scrimmage';
      }
      
      // Determine game date
      const gameDate = evGame?.startTime || sessionEvent?.startTime || evs[0]?.created_at;
      
      gameStats.push({
        gameId: groupGameId ? Number(groupGameId) : null,
        sessionId: sessionId,
        gameName: gameName,
        gameDate: gameDate,
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


