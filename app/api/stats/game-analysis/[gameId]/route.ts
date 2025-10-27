import { NextRequest, NextResponse } from 'next/server';
import { createServerClientWithAuth } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    const { client: supabase, user } = await createServerClientWithAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const gameId = parseInt(resolvedParams.gameId);
    
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    // Get the specific game session
    const { data: session, error: sessionError } = await (supabase as any)
      .from('live_game_sessions')
      .select(`
        id,
        game_id,
        game_state,
        created_at,
        event_id,
        events (
          name,
          startTime,
          eventTypeId,
          oppositionTeam
        ),
        live_game_events!inner (
          id,
          event_type,
          player_id,
          opponent_jersey,
          quarter,
          event_value,
          is_opponent_event,
          metadata,
          created_at
        )
      `)
      .eq('id', gameId)
      .is('live_game_events.deleted_at', null)
      .single();

    if (sessionError) {
      console.error('Error fetching session:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get all players for the analysis
    const { data: players, error: playersError } = await (supabase as any)
      .from('players')
      .select(`
        *,
        position:positions(id, name, abbreviation)
      `)
      .order('first_name');

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }

    // Calculate game statistics from events instead of game state
    const gameState = session.game_state || {};
    let teamScore = 0;
    let opponentScore = 0;
    
    // Calculate scores from events
    session.live_game_events?.forEach((event: any) => {
      if (event.is_opponent_event) {
        // Opponent events
        switch (event.event_type) {
          case 'fg_made':
            opponentScore += 2;
            break;
          case 'three_made':
            opponentScore += 3;
            break;
          case 'ft_made':
            opponentScore += 1;
            break;
        }
      } else {
        // Team events
        switch (event.event_type) {
          case 'fg_made':
            teamScore += 2;
            break;
          case 'three_made':
            teamScore += 3;
            break;
          case 'ft_made':
            teamScore += 1;
            break;
        }
      }
    });
    
    const margin = teamScore - opponentScore;
    const result = margin > 0 ? 'W' : margin < 0 ? 'L' : 'T';

    // Calculate player statistics for this game
    const playerStats = players?.map((player: any) => {
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
      let plusMinus = 0;

      // Track when player is on court for plus/minus calculation
      let isOnCourt = true; // Assume player starts on court
      let courtEntryTime = null;
      let teamScoreWhenEntered = 0;
      let opponentScoreWhenEntered = 0;
      let currentTeamScore = 0;
      let currentOpponentScore = 0;
      let hasSubstitutionEvents = false;

      // Sort events by timestamp to process chronologically
      const sortedEvents = [...(session.live_game_events || [])].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });

      // Process events chronologically
      sortedEvents.forEach((event: any) => {
        // Track score changes for plus/minus calculation
        if (!event.is_opponent_event) {
          // Team scored
          switch (event.event_type) {
            case 'fg_made':
              currentTeamScore += 2;
              break;
            case 'three_made':
              currentTeamScore += 3;
              break;
            case 'ft_made':
              currentTeamScore += 1;
              break;
          }
        } else {
          // Opponent scored
          switch (event.event_type) {
            case 'fg_made':
              currentOpponentScore += 2;
              break;
            case 'three_made':
              currentOpponentScore += 3;
              break;
            case 'ft_made':
              currentOpponentScore += 1;
              break;
          }
        }

        // Handle substitution events
        if (event.event_type === 'substitution') {
          hasSubstitutionEvents = true;
          const metadata = event.metadata || {};
          const playerIn = metadata.playerIn;
          const playerOut = metadata.playerOut;
          
          if (playerIn === player.id) {
            // Player entering court
            isOnCourt = true;
            courtEntryTime = new Date(event.created_at).getTime();
            teamScoreWhenEntered = currentTeamScore;
            opponentScoreWhenEntered = currentOpponentScore;
          } else if (playerOut === player.id) {
            // Player leaving court
            if (isOnCourt) {
              // Calculate plus/minus for this stint
              const stintPlusMinus = (currentTeamScore - teamScoreWhenEntered) - (currentOpponentScore - opponentScoreWhenEntered);
              plusMinus += stintPlusMinus;
            }
            isOnCourt = false;
            courtEntryTime = null;
          }
        }

        // Process player-specific events
        if (event.player_id === player.id) {
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

      // Calculate final plus/minus
      if (!hasSubstitutionEvents) {
        // Player played entire game, plus/minus is total game margin
        plusMinus = currentTeamScore - currentOpponentScore;
      } else if (isOnCourt && courtEntryTime !== null) {
        // Player is still on court at the end, calculate final stint plus/minus
        const finalStintPlusMinus = (currentTeamScore - teamScoreWhenEntered) - (currentOpponentScore - opponentScoreWhenEntered);
        plusMinus += finalStintPlusMinus;
      }

      const fgPct = fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 100) : 0;
      const threePct = threeAttempted > 0 ? Math.round((threeMade / threeAttempted) * 100) : 0;
      const ftPct = ftAttempted > 0 ? Math.round((ftMade / ftAttempted) * 100) : 0;

      return {
        id: player.id,
        name: player.first_name && player.last_name 
          ? `${player.first_name} ${player.last_name}`
          : player.name || 'Unknown Player',
        position: player.position?.abbreviation || 'N/A',
        number: player.jersey_number || player.jersey || '0',
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
        fgPct,
        threePct,
        ftPct,
        plusMinus
      };
    }) || [];

    // Calculate quarter breakdown
    const quarterStats = [1, 2, 3, 4].map(quarter => {
      let quarterPoints = 0;
      let quarterOpponentPoints = 0;
      let quarterFgMade = 0;
      let quarterFgAttempted = 0;
      let quarterTurnovers = 0;

      session.live_game_events?.forEach((event: any) => {
        if (event.quarter === quarter) {
          if (event.is_opponent_event) {
            // Calculate opponent points based on event type
            switch (event.event_type) {
              case 'fg_made':
                quarterOpponentPoints += 2;
                break;
              case 'three_made':
                quarterOpponentPoints += 3;
                break;
              case 'ft_made':
                quarterOpponentPoints += 1;
                break;
            }
          } else {
            // Calculate team points based on event type
            switch (event.event_type) {
              case 'fg_made':
                quarterPoints += 2;
                quarterFgMade++;
                quarterFgAttempted++;
                break;
              case 'fg_missed':
                quarterFgAttempted++;
                break;
              case 'three_made':
                quarterPoints += 3;
                quarterFgMade++;
                quarterFgAttempted++;
                break;
              case 'three_missed':
                quarterFgAttempted++;
                break;
              case 'ft_made':
                quarterPoints += 1;
                break;
              case 'ft_missed':
                // No points for missed free throws
                break;
              case 'turnover':
                quarterTurnovers++;
                break;
            }
          }
        }
      });

      const quarterFgPct = quarterFgAttempted > 0 ? Math.round((quarterFgMade / quarterFgAttempted) * 100) : 0;

      return {
        quarter,
        points: quarterPoints, // Changed from teamPoints to points for frontend compatibility
        teamPoints: quarterPoints,
        opponentPoints: quarterOpponentPoints,
        margin: quarterPoints - quarterOpponentPoints,
        fgPct: quarterFgPct,
        turnovers: quarterTurnovers,
        timeouts: 0 // Default value, could be calculated from events if needed
      };
    });

    // Calculate team totals
    const teamTotals = {
      points: teamScore,
      opponentPoints: opponentScore,
      margin,
      fgMade: playerStats.reduce((sum: number, p: any) => sum + p.fgMade, 0),
      fgAttempted: playerStats.reduce((sum: number, p: any) => sum + p.fgAttempted, 0),
      threeMade: playerStats.reduce((sum: number, p: any) => sum + p.threeMade, 0),
      threeAttempted: playerStats.reduce((sum: number, p: any) => sum + p.threeAttempted, 0),
      ftMade: playerStats.reduce((sum: number, p: any) => sum + p.ftMade, 0),
      ftAttempted: playerStats.reduce((sum: number, p: any) => sum + p.ftAttempted, 0),
      rebounds: playerStats.reduce((sum: number, p: any) => sum + p.rebounds, 0),
      assists: playerStats.reduce((sum: number, p: any) => sum + p.assists, 0),
      steals: playerStats.reduce((sum: number, p: any) => sum + p.steals, 0),
      blocks: playerStats.reduce((sum: number, p: any) => sum + p.blocks, 0),
      turnovers: playerStats.reduce((sum: number, p: any) => sum + p.turnovers, 0),
      fouls: playerStats.reduce((sum: number, p: any) => sum + p.fouls, 0)
    };

    const fgPct = teamTotals.fgAttempted > 0 ? Math.round((teamTotals.fgMade / teamTotals.fgAttempted) * 100) : 0;
    const threePct = teamTotals.threeAttempted > 0 ? Math.round((teamTotals.threeMade / teamTotals.threeAttempted) * 100) : 0;
    const ftPct = teamTotals.ftAttempted > 0 ? Math.round((teamTotals.ftMade / teamTotals.ftAttempted) * 100) : 0;

    // Calculate opponent statistics
    let opponentFgMade = 0;
    let opponentFgAttempted = 0;
    let opponentThreeMade = 0;
    let opponentThreeAttempted = 0;
    let opponentFtMade = 0;
    let opponentFtAttempted = 0;
    let opponentRebounds = 0;
    let opponentAssists = 0;
    let opponentSteals = 0;
    let opponentBlocks = 0;
    let opponentTurnovers = 0;
    let opponentFouls = 0;

    session.live_game_events?.forEach((event: any) => {
      if (event.is_opponent_event) {
        switch (event.event_type) {
          case 'fg_made':
            opponentFgMade++;
            opponentFgAttempted++;
            break;
          case 'fg_missed':
            opponentFgAttempted++;
            break;
          case 'three_made':
            opponentThreeMade++;
            opponentThreeAttempted++;
            opponentFgMade++;
            opponentFgAttempted++;
            break;
          case 'three_missed':
            opponentThreeAttempted++;
            opponentFgAttempted++;
            break;
          case 'ft_made':
            opponentFtMade++;
            opponentFtAttempted++;
            break;
          case 'ft_missed':
            opponentFtAttempted++;
            break;
          case 'rebound':
            opponentRebounds++;
            break;
          case 'assist':
            opponentAssists++;
            break;
          case 'steal':
            opponentSteals++;
            break;
          case 'block':
            opponentBlocks++;
            break;
          case 'turnover':
            opponentTurnovers++;
            break;
          case 'foul':
            opponentFouls++;
            break;
        }
      }
    });

    // Calculate opponent player statistics by jersey number
    const opponentPlayerMap = new Map();
    
    session.live_game_events?.forEach((event: any) => {
      if (event.is_opponent_event && event.opponent_jersey) {
        const jersey = event.opponent_jersey;
        if (!opponentPlayerMap.has(jersey)) {
          opponentPlayerMap.set(jersey, {
            name: `Player #${jersey}`,
            position: 'Unknown',
            number: jersey,
            points: 0,
            fgMade: 0,
            fgAttempted: 0,
            threeMade: 0,
            threeAttempted: 0,
            ftMade: 0,
            ftAttempted: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fouls: 0
          });
        }
        
        const player = opponentPlayerMap.get(jersey);
        switch (event.event_type) {
          case 'fg_made':
            player.points += 2;
            player.fgMade++;
            player.fgAttempted++;
            break;
          case 'fg_missed':
            player.fgAttempted++;
            break;
          case 'three_made':
            player.points += 3;
            player.threeMade++;
            player.threeAttempted++;
            player.fgMade++;
            player.fgAttempted++;
            break;
          case 'three_missed':
            player.threeAttempted++;
            player.fgAttempted++;
            break;
          case 'ft_made':
            player.points += 1;
            player.ftMade++;
            player.ftAttempted++;
            break;
          case 'ft_missed':
            player.ftAttempted++;
            break;
          case 'rebound':
            player.rebounds++;
            break;
          case 'assist':
            player.assists++;
            break;
          case 'steal':
            player.steals++;
            break;
          case 'block':
            player.blocks++;
            break;
          case 'turnover':
            player.turnovers++;
            break;
          case 'foul':
            player.fouls++;
            break;
        }
      }
    });

    // Convert map to array and calculate percentages
    const opponentPlayerStats = Array.from(opponentPlayerMap.values()).map(player => {
      const fgPct = player.fgAttempted > 0 ? Math.round((player.fgMade / player.fgAttempted) * 100) : 0;
      const threePct = player.threeAttempted > 0 ? Math.round((player.threeMade / player.threeAttempted) * 100) : 0;
      const ftPct = player.ftAttempted > 0 ? Math.round((player.ftMade / player.ftAttempted) * 100) : 0;

      return {
        ...player,
        fgPct,
        threePct,
        ftPct
      };
    }).filter(p => p.points > 0 || p.rebounds > 0 || p.assists > 0 || p.steals > 0 || p.blocks > 0 || p.turnovers > 0 || p.fouls > 0);

    const opponentStats = {
      fieldGoals: {
        made: opponentFgMade,
        attempted: opponentFgAttempted,
        percentage: opponentFgAttempted > 0 ? Math.round((opponentFgMade / opponentFgAttempted) * 100) : 0
      },
      threePointers: {
        made: opponentThreeMade,
        attempted: opponentThreeAttempted,
        percentage: opponentThreeAttempted > 0 ? Math.round((opponentThreeMade / opponentThreeAttempted) * 100) : 0
      },
      freeThrows: {
        made: opponentFtMade,
        attempted: opponentFtAttempted,
        percentage: opponentFtAttempted > 0 ? Math.round((opponentFtMade / opponentFtAttempted) * 100) : 0
      },
      rebounds: {
        offensive: Math.floor(opponentRebounds * 0.3), // Estimate
        defensive: Math.floor(opponentRebounds * 0.7)  // Estimate
      },
      assists: opponentAssists,
      steals: opponentSteals,
      blocks: opponentBlocks,
      turnovers: opponentTurnovers,
      fouls: opponentFouls,
      pointsInPaint: Math.floor(opponentScore * 0.4), // Estimate
      secondChancePoints: Math.floor(opponentScore * 0.1), // Estimate
      pointsOffTurnovers: Math.floor(opponentScore * 0.2), // Estimate
      benchPoints: Math.floor(opponentScore * 0.3) // Estimate
    };

    // Game analysis data
    const gameAnalysis = {
      gameId: gameId,
      actualGameId: session.game_id, // Add the actual game ID from the session
      eventId: session.event_id, // Add the event ID from the session
      opponent: session.events?.oppositionTeam || 'Unknown',
      date: session.events?.startTime || session.created_at,
      result,
      score: `${teamScore}-${opponentScore}`,
      margin,
      teamTotals: {
        ...teamTotals,
        fgPct,
        threePct,
        ftPct
      },
      opponentStats,
      opponentPlayerStats,
      playerStats: playerStats.filter((p: any) => p.points > 0 || p.rebounds > 0 || p.assists > 0 || p.steals > 0 || p.blocks > 0 || p.turnovers > 0 || p.fouls > 0),
      quarterBreakdown: {
        quarters: quarterStats,
        firstHalf: {
          points: quarterStats.slice(0, 2).reduce((sum, q) => sum + q.points, 0),
          fgPct: Math.round(quarterStats.slice(0, 2).reduce((sum, q) => sum + q.fgPct, 0) / 2),
          turnovers: quarterStats.slice(0, 2).reduce((sum, q) => sum + q.turnovers, 0)
        },
        secondHalf: {
          points: quarterStats.slice(2, 4).reduce((sum, q) => sum + q.points, 0),
          fgPct: Math.round(quarterStats.slice(2, 4).reduce((sum, q) => sum + q.fgPct, 0) / 2),
          turnovers: quarterStats.slice(2, 4).reduce((sum, q) => sum + q.turnovers, 0)
        },
        analysis: {
          consistency: quarterStats.length > 0 ? Math.round(100 - (quarterStats.reduce((sum, q) => sum + Math.abs(q.margin), 0) / quarterStats.length)) : 0,
          strongestQuarter: quarterStats.length > 0 ? quarterStats.reduce((max, q) => q.points > max.points ? q : max, quarterStats[0]).quarter : 1,
          weakestQuarter: quarterStats.length > 0 ? quarterStats.reduce((min, q) => q.points < min.points ? q : min, quarterStats[0]).quarter : 1
        }
      },
      events: session.live_game_events || [],
      gameState
    };

    return NextResponse.json(gameAnalysis);
  } catch (error) {
    console.error('Error in game analysis API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
