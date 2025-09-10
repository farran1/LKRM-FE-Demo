import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    if (!url || !anon) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Supabase environment variables are missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, anon);
    const { gameId: gameIdStr } = await params;
    const gameId = parseInt(gameIdStr);

    if (isNaN(gameId)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    console.log(`Fetching game analysis for game ID: ${gameId}`);

    // First, check if the game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) {
      console.error('Error fetching game:', gameError);
      return NextResponse.json(
        { error: `Game not found: ${gameError.message}` },
        { status: 404 }
      );
    }

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    console.log('Game found:', game);

    // Get game stats for this game with player information
    const { data: gameStats, error: statsError } = await supabase
      .from('game_stats')
      .select('*')
      .eq('gameId', gameId);

    if (statsError) {
      console.error('Error fetching game stats:', statsError);
      // Don't fail completely, just return empty stats
      console.log('Continuing with empty game stats');
    }

    console.log(`Found ${gameStats?.length || 0} game stats records`);

    // Check if we have any data to work with
    if (!gameStats || gameStats.length === 0) {
      console.log('No game stats found, returning minimal data');
      return NextResponse.json({
        gameInfo: {
          id: game.id,
          opponent: game.opponent || 'Unknown',
          date: game.gameDate,
          type: game.isPlayoffs ? 'Playoff' : 'Game',
          result: game.result === 'WIN' ? 'W' : game.result === 'LOSS' ? 'L' : 'T',
          score: game.homeScore && game.awayScore ? `${game.homeScore}-${game.awayScore}` : 'N/A',
          location: 'Home',
          season: game.season || '2024-25'
        },
        teamStats: {
          points: 0,
          fieldGoals: { made: 0, attempted: 0, percentage: 0 },
          threePointers: { made: 0, attempted: 0, percentage: 0 },
          freeThrows: { made: 0, attempted: 0, percentage: 0 },
          rebounds: { offensive: 0, defensive: 0, total: 0 },
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fouls: 0,
          minutesPlayed: 0
        },
        playerStats: [],
        playByPlay: [],
        standoutInfo: {
          topScorer: { name: 'None', points: 0 },
          topRebounder: { name: 'None', rebounds: 0 },
          topAssister: { name: 'None', assists: 0 },
          teamEfficiency: 0
        },
        lineupComparison: {
          starters: [],
          bench: []
        },
        advancedMetrics: generateEmptyAdvancedMetrics(),
        quarterBreakdown: generateEmptyQuarterBreakdown(),
        strategicInsights: generateEmptyStrategicInsights()
      });
    }

    // Get player information separately to avoid join issues
    let players: any = {};
    if (gameStats && gameStats.length > 0) {
      const playerIds = gameStats
        .map(stat => stat.playerId)
        .filter(id => id !== null && id !== undefined);
      
      if (playerIds.length > 0) {
        try {
          const { data: playersData } = await supabase
            .from('players')
            .select('id, name, jersey, positionId')
            .in('id', playerIds);
          
          if (playersData) {
            playersData.forEach(player => {
              players[player.id] = player;
            });
          }
        } catch (error) {
          console.log('Could not fetch players, continuing without player names');
        }
      }
    }

    // Get positions for player information
    let positions: any = {};
    try {
      const { data: positionsData } = await supabase
        .from('positions')
        .select('id, name, abbreviation');
      
      if (positionsData) {
        positionsData.forEach(pos => {
          positions[pos.id] = pos;
        });
      }
    } catch (error) {
      console.log('Could not fetch positions, continuing without position names');
    }

    // Calculate team totals with safe defaults
    const teamTotals = (gameStats || []).reduce((acc, stat) => ({
      points: acc.points + (stat.points || 0),
      fieldGoalsMade: acc.fieldGoalsMade + (stat.fieldGoalsMade || 0),
      fieldGoalsAttempted: acc.fieldGoalsAttempted + (stat.fieldGoalsAttempted || 0),
      threePointsMade: acc.threePointsMade + (stat.threePointsMade || 0),
      threePointsAttempted: acc.threePointsAttempted + (stat.threePointsAttempted || 0),
      freeThrowsMade: acc.freeThrowsMade + (stat.freeThrowsMade || 0),
      freeThrowsAttempted: acc.freeThrowsAttempted + (stat.freeThrowsAttempted || 0),
      rebounds: acc.rebounds + (stat.rebounds || 0),
      offensiveRebounds: acc.offensiveRebounds + (stat.offensiveRebounds || 0),
      defensiveRebounds: acc.defensiveRebounds + (stat.defensiveRebounds || 0),
      assists: acc.assists + (stat.assists || 0),
      steals: acc.steals + (stat.steals || 0),
      blocks: acc.blocks + (stat.blocks || 0),
      turnovers: acc.turnovers + (stat.turnovers || 0),
      fouls: acc.fouls + (stat.fouls || 0),
      minutesPlayed: acc.minutesPlayed + (stat.minutesPlayed || 0)
    }), {
      points: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointsMade: 0,
      threePointsAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      rebounds: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
      minutesPlayed: 0
    });

    // Calculate percentages safely
    const fgPct = teamTotals.fieldGoalsAttempted > 0 ? 
      Math.round((teamTotals.fieldGoalsMade / teamTotals.fieldGoalsAttempted) * 1000) / 10 : 0;
    const threePct = teamTotals.threePointsAttempted > 0 ? 
      Math.round((teamTotals.threePointsMade / teamTotals.threePointsAttempted) * 1000) / 10 : 0;
    const ftPct = teamTotals.freeThrowsAttempted > 0 ? 
      Math.round((teamTotals.freeThrowsMade / teamTotals.freeThrowsAttempted) * 1000) / 10 : 0;

    // Format player stats with safe defaults - Box Score format
    const playerStats = (gameStats || []).map(stat => {
      const player = players[stat.playerId] || {};
      const position = positions[player.positionId] || {};
      
      return {
        id: stat.playerId || stat.id,
        name: player.name || 'Unknown Player',
        position: position.name || 'Unknown',
        number: player.jersey || 'N/A',
        minutes: stat.minutesPlayed || 0,
        points: stat.points || 0,
        // Box score format - flattened structure
        rebounds: (stat.offensiveRebounds || 0) + (stat.defensiveRebounds || 0),
        assists: stat.assists || 0,
        steals: stat.steals || 0,
        blocks: stat.blocks || 0,
        turnovers: stat.turnovers || 0,
        fouls: stat.fouls || 0,
        plusMinus: stat.plusMinus || 0,
        // Field goal stats for efficiency calculation
        fgMade: stat.fieldGoalsMade || 0,
        fgAttempted: stat.fieldGoalsAttempted || 0,
        ftMade: stat.freeThrowsMade || 0,
        ftAttempted: stat.freeThrowsAttempted || 0,
        // Keep nested structure for compatibility
        fieldGoals: {
          made: stat.fieldGoalsMade || 0,
          attempted: stat.fieldGoalsAttempted || 0
        },
        threePointers: {
          made: stat.threePointsMade || 0,
          attempted: stat.threePointsAttempted || 0
        },
        freeThrows: {
          made: stat.freeThrowsMade || 0,
          attempted: stat.freeThrowsAttempted || 0
        }
      };
    });

    // Sort players by points (descending)
    playerStats.sort((a, b) => b.points - a.points);

    // Generate mock play-by-play data
    const playByPlay = await generateRealPlayByPlay(supabase, gameId);

    // Calculate standout information
    const standoutInfo = calculateStandoutInfo(playerStats, teamTotals);

    // Generate lineup comparison data
    // Lineup comparison - commented out
    // const lineupComparison = generateLineupComparison(gameStats || []);
    const lineupComparison = null; // Lineup comparison disabled
    
    // Update lineup comparison with actual player names - commented out
    // if (lineupComparison.starters) {
    //   lineupComparison.starters = lineupComparison.starters.map((starter, index) => {
    //     const stat = gameStats?.filter(s => (s.minutesPlayed || 0) > 20)[index];
    //     if (stat && stat.playerId) {
    //       const player = players[stat.playerId];
    //       return {
    //         ...starter,
    //         name: player?.name || 'Unknown Player'
    //       };
    //     }
    //     return starter;
    //   });
    // }
    
    // if (lineupComparison.bench) {
    //   lineupComparison.bench = lineupComparison.bench.map((benchPlayer, index) => {
    //     const stat = gameStats?.filter(s => (s.minutesPlayed || 0) <= 20)[index];
    //     if (stat && stat.playerId) {
    //       const player = players[stat.playerId];
    //       return {
    //         ...benchPlayer,
    //         name: player?.name || 'Unknown Player'
    //       };
    //     }
    //     return benchPlayer;
    //   });
    // }

    // Calculate advanced metrics
    const advancedMetrics = calculateAdvancedMetrics(playerStats, teamTotals, gameStats || []);

    // Derive opponent stats (best-effort from game scores; other fields default to 0)
    let opponentPoints = 0;
    if (typeof game.homeScore === 'number' && typeof game.awayScore === 'number') {
      // If our computed team points equals one of the stored scores, use the other as opponent
      if (teamTotals.points === game.homeScore) opponentPoints = game.awayScore;
      else if (teamTotals.points === game.awayScore) opponentPoints = game.homeScore;
      else opponentPoints = Math.max(game.homeScore, game.awayScore); // fallback
    }
    const opponentStats = {
      points: opponentPoints || 0,
      fieldGoals: { made: 0, attempted: 0, percentage: 0 },
      threePointers: { made: 0, attempted: 0, percentage: 0 },
      freeThrows: { made: 0, attempted: 0, percentage: 0 },
      rebounds: { offensive: 0, defensive: 0, total: 0 },
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0
    };

    // Generate quarter breakdown (mock data for now)
    const quarterBreakdown = await generateQuarterBreakdown(supabase, gameId);

    // Generate strategic insights - commented out
    // const strategicInsights = generateStrategicInsights(playerStats, gameStats || [], teamTotals);
    const strategicInsights = null; // Strategic insights disabled

    const gameAnalysisData = {
      gameInfo: {
        id: game.id,
        opponent: game.opponent || 'Unknown',
        date: game.gameDate,
        type: game.isPlayoffs ? 'Playoff' : 'Game',
        result: game.result === 'WIN' ? 'W' : game.result === 'LOSS' ? 'L' : 'T',
        score: game.homeScore && game.awayScore ? `${game.homeScore}-${game.awayScore}` : 'N/A',
        location: 'Home',
        season: game.season || '2024-25'
      },
      teamStats: {
        points: teamTotals.points,
        fieldGoals: {
          made: teamTotals.fieldGoalsMade,
          attempted: teamTotals.fieldGoalsAttempted,
          percentage: fgPct
        },
        threePointers: {
          made: teamTotals.threePointsMade,
          attempted: teamTotals.threePointsAttempted,
          percentage: threePct
        },
        freeThrows: {
          made: teamTotals.freeThrowsMade,
          attempted: teamTotals.freeThrowsAttempted,
          percentage: ftPct
        },
        rebounds: {
          offensive: teamTotals.offensiveRebounds,
          defensive: teamTotals.defensiveRebounds,
          total: teamTotals.rebounds
        },
        assists: teamTotals.assists,
        steals: teamTotals.steals,
        blocks: teamTotals.blocks,
        turnovers: teamTotals.turnovers,
        fouls: teamTotals.fouls,
        minutesPlayed: teamTotals.minutesPlayed
      },
      playerStats: playerStats,
      playByPlay: playByPlay,
      standoutInfo: standoutInfo,
      lineupComparison: lineupComparison,
      advancedMetrics: advancedMetrics,
      quarterBreakdown: quarterBreakdown,
      strategicInsights: strategicInsights,
      opponentStats: opponentStats
    };

    console.log('Successfully generated game analysis data');
    console.log('Game info:', gameAnalysisData.gameInfo);
    console.log('Team stats:', gameAnalysisData.teamStats);
    console.log('Player stats count:', gameAnalysisData.playerStats.length);
    console.log('Play by play count:', gameAnalysisData.playByPlay.length);
    console.log('Standout info:', gameAnalysisData.standoutInfo);
    console.log('Lineup comparison:', gameAnalysisData.lineupComparison);
    console.log('Advanced metrics:', gameAnalysisData.advancedMetrics);
    
    return NextResponse.json(gameAnalysisData);

  } catch (error) {
    console.error('Unexpected error in game analysis API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Helper function to generate mock play-by-play data
// Generate real play-by-play data from live_game_events
async function generateRealPlayByPlay(supabase: any, gameId: number) {
  try {
    // First, try to get live game events
    const { data: liveEvents, error: liveError } = await supabase
      .from('live_game_events')
      .select(`
        *,
        players(name, jersey),
        live_game_sessions!inner(
          game_id
        )
      `)
      .eq('live_game_sessions.game_id', gameId)
      .order('quarter', { ascending: true })
      .order('game_time', { ascending: true });

    if (liveError) {
      console.error('Error fetching live game events:', liveError);
      return generateMockPlayByPlay([], {});
    }

    if (liveEvents && liveEvents.length > 0) {
      return processLiveEvents(liveEvents);
    }

    // If no live events, try to generate from game stats
    const { data: gameStats, error: statsError } = await supabase
      .from('game_stats')
      .select(`
        *,
        players(name, jersey)
      `)
      .eq('gameId', gameId);

    if (statsError) {
      console.error('Error fetching game stats:', statsError);
      return generateMockPlayByPlay([], {});
    }

    if (gameStats && gameStats.length > 0) {
      return generatePlayByPlayFromStats(gameStats);
    }

    // Fallback to mock data
    return generateMockPlayByPlay([], {});
  } catch (error) {
    console.error('Error in generateRealPlayByPlay:', error);
    return generateMockPlayByPlay([], {});
  }
}

// Process live game events into play-by-play format
function processLiveEvents(events: any[]) {
  const plays: any[] = [];
  let teamScore = 0;
  let opponentScore = 0;

  events.forEach((event) => {
    const timeString = formatGameTime(event.game_time);
    const playerName = event.players?.name || `Player ${event.players?.jersey || event.player_id}`;
    const jersey = event.players?.jersey || '';
    const playerDisplay = jersey ? `${playerName} (#${jersey})` : playerName;

    let description = '';
    let type = event.event_type;

    switch (event.event_type) {
      case 'points':
        const points = event.event_value || 0;
        if (event.is_opponent_event) {
          opponentScore += points;
          description = `Opponent ${playerDisplay} scored ${points} point${points > 1 ? 's' : ''}`;
        } else {
          teamScore += points;
          description = `${playerDisplay} scored ${points} point${points > 1 ? 's' : ''}`;
        }
        break;
      case 'rebound':
        const rebounds = event.event_value || 1;
        description = `${playerDisplay} grabbed ${rebounds} rebound${rebounds > 1 ? 's' : ''}`;
        break;
      case 'assist':
        const assists = event.event_value || 1;
        description = `${playerDisplay} recorded ${assists} assist${assists > 1 ? 's' : ''}`;
        break;
      case 'steal':
        const steals = event.event_value || 1;
        description = `${playerDisplay} made ${steals} steal${steals > 1 ? 's' : ''}`;
        break;
      case 'block':
        const blocks = event.event_value || 1;
        description = `${playerDisplay} blocked ${blocks} shot${blocks > 1 ? 's' : ''}`;
        break;
      case 'turnover':
        const turnovers = event.event_value || 1;
        description = `${playerDisplay} committed ${turnovers} turnover${turnovers > 1 ? 's' : ''}`;
        break;
      case 'foul':
        const fouls = event.event_value || 1;
        description = `${playerDisplay} committed ${fouls} foul${fouls > 1 ? 's' : ''}`;
        break;
      default:
        description = `${playerDisplay} - ${event.event_type}`;
    }

    plays.push({
      time: timeString,
      quarter: event.quarter,
      description: description,
      score: `${teamScore}-${opponentScore}`,
      type: type,
      player: playerDisplay,
      isOpponent: event.is_opponent_event || false
    });
  });

  return plays;
}

// Generate play-by-play from game stats (fallback)
function generatePlayByPlayFromStats(gameStats: any[]) {
  const plays: any[] = [];
  let teamScore = 0;
  let opponentScore = 0;

  gameStats.forEach((stat) => {
    const playerName = stat.players?.name || `Player ${stat.players?.jersey || stat.player_id}`;
    const jersey = stat.players?.jersey || '';
    const playerDisplay = jersey ? `${playerName} (#${jersey})` : playerName;

    // Generate scoring plays
    if (stat.points && stat.points > 0) {
      teamScore += stat.points;
      plays.push({
        time: formatGameTime(Math.floor(Math.random() * 720)), // Random time in quarter
        quarter: stat.quarter || Math.floor(Math.random() * 4) + 1,
        description: `${playerDisplay} scored ${stat.points} point${stat.points > 1 ? 's' : ''}`,
        score: `${teamScore}-${opponentScore}`,
        type: 'scoring',
        player: playerDisplay,
        isOpponent: false
      });
    }

    // Generate other stat plays
    if (stat.assists && stat.assists > 0) {
      plays.push({
        time: formatGameTime(Math.floor(Math.random() * 720)),
        quarter: stat.quarter || Math.floor(Math.random() * 4) + 1,
        description: `${playerDisplay} recorded ${stat.assists} assist${stat.assists > 1 ? 's' : ''}`,
        score: `${teamScore}-${opponentScore}`,
        type: 'assist',
        player: playerDisplay,
        isOpponent: false
      });
    }

    if (stat.rebounds && stat.rebounds > 0) {
      plays.push({
        time: formatGameTime(Math.floor(Math.random() * 720)),
        quarter: stat.quarter || Math.floor(Math.random() * 4) + 1,
        description: `${playerDisplay} grabbed ${stat.rebounds} rebound${stat.rebounds > 1 ? 's' : ''}`,
        score: `${teamScore}-${opponentScore}`,
        type: 'rebound',
        player: playerDisplay,
        isOpponent: false
      });
    }

    if (stat.steals && stat.steals > 0) {
      plays.push({
        time: formatGameTime(Math.floor(Math.random() * 720)),
        quarter: stat.quarter || Math.floor(Math.random() * 4) + 1,
        description: `${playerDisplay} made ${stat.steals} steal${stat.steals > 1 ? 's' : ''}`,
        score: `${teamScore}-${opponentScore}`,
        type: 'steal',
        player: playerDisplay,
        isOpponent: false
      });
    }

    if (stat.blocks && stat.blocks > 0) {
      plays.push({
        time: formatGameTime(Math.floor(Math.random() * 720)),
        quarter: stat.quarter || Math.floor(Math.random() * 4) + 1,
        description: `${playerDisplay} blocked ${stat.blocks} shot${stat.blocks > 1 ? 's' : ''}`,
        score: `${teamScore}-${opponentScore}`,
        type: 'block',
        player: playerDisplay,
        isOpponent: false
      });
    }

    if (stat.turnovers && stat.turnovers > 0) {
      plays.push({
        time: formatGameTime(Math.floor(Math.random() * 720)),
        quarter: stat.quarter || Math.floor(Math.random() * 4) + 1,
        description: `${playerDisplay} committed ${stat.turnovers} turnover${stat.turnovers > 1 ? 's' : ''}`,
        score: `${teamScore}-${opponentScore}`,
        type: 'turnover',
        player: playerDisplay,
        isOpponent: false
      });
    }
  });

  // Sort plays by quarter and time
  plays.sort((a, b) => {
    if (a.quarter !== b.quarter) return a.quarter - b.quarter;
    return a.time.localeCompare(b.time);
  });

  return plays;
}

// Format game time from seconds to MM:SS
function formatGameTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Mock play-by-play fallback
function generateMockPlayByPlay(gameStats: any[], game: any) {
  const plays: any[] = [];
  let currentScore = 0;
  let opponentScore = 0;
  
  // Sample player names for more realistic play-by-play
  const playerNames = [
    'Marcus Johnson', 'Alex Thompson', 'Jordan Smith', 'Chris Davis', 'Mike Wilson',
    'Tyler Brown', 'Ryan Miller', 'Kevin Garcia', 'Jake Martinez', 'Sam Anderson'
  ];
  
  // Generate plays for each quarter
  for (let quarter = 1; quarter <= 4; quarter++) {
    const quarterPlays = [];
    
    // Generate 8-12 plays per quarter
    const playsInQuarter = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < playsInQuarter; i++) {
      const timeInQuarter = 12 - (i * (12 / playsInQuarter)) + Math.random() * 2;
      const minutes = Math.floor(timeInQuarter);
      const seconds = Math.floor((timeInQuarter - minutes) * 60);
      const timeString = `${minutes}:${String(seconds).padStart(2, '0')}`;
      
      const playerName = playerNames[Math.floor(Math.random() * playerNames.length)];
      const isTeamPlay = Math.random() > 0.3; // 70% team plays, 30% opponent plays
      
      const playTypes = ['points', 'assist', 'rebound', 'steal', 'block', 'turnover', 'foul'];
      const playType = playTypes[Math.floor(Math.random() * playTypes.length)];
      
      let description = '';
      let points = 0;
      
      switch (playType) {
        case 'points':
          points = Math.random() > 0.7 ? 3 : (Math.random() > 0.5 ? 2 : 1);
          if (isTeamPlay) {
            currentScore += points;
            description = `${playerName} scored ${points} point${points > 1 ? 's' : ''}`;
          } else {
            opponentScore += points;
            description = `Opponent ${playerName} scored ${points} point${points > 1 ? 's' : ''}`;
          }
          break;
        case 'assist':
          description = isTeamPlay ? `${playerName} recorded an assist` : `Opponent ${playerName} recorded an assist`;
          break;
        case 'rebound':
          description = isTeamPlay ? `${playerName} grabbed a rebound` : `Opponent ${playerName} grabbed a rebound`;
          break;
        case 'steal':
          description = isTeamPlay ? `${playerName} made a steal` : `Opponent ${playerName} made a steal`;
          break;
        case 'block':
          description = isTeamPlay ? `${playerName} blocked a shot` : `Opponent ${playerName} blocked a shot`;
          break;
        case 'turnover':
          description = isTeamPlay ? `${playerName} committed a turnover` : `Opponent ${playerName} committed a turnover`;
          break;
        case 'foul':
          description = isTeamPlay ? `${playerName} committed a foul` : `Opponent ${playerName} committed a foul`;
          break;
      }
      
      quarterPlays.push({
        time: timeString,
        quarter: quarter,
        description: description,
        score: `${currentScore}-${opponentScore}`,
        type: playType,
        player: playerName,
        isOpponent: !isTeamPlay
      });
    }
    
    // Sort quarter plays by time (descending)
    quarterPlays.sort((a, b) => b.time.localeCompare(a.time));
    plays.push(...quarterPlays);
  }

  // Sort all plays by quarter and time
  plays.sort((a, b) => {
    if (a.quarter !== b.quarter) return a.quarter - b.quarter;
    return b.time.localeCompare(a.time); // Most recent first
  });

  return plays;
}

// Helper function to calculate LKRM Leaders information
function calculateStandoutInfo(playerStats: any[], teamTotals: any) {
  if (!playerStats || playerStats.length === 0) {
    return {
      topScorer: { name: 'None', points: 0 },
      topRebounder: { name: 'None', rebounds: 0 },
      topAssister: { name: 'None', assists: 0 },
      mostSteals: { name: 'None', steals: 0 },
      highestFgPoints: { name: 'None', fgPoints: 0 },
      highest3ptPoints: { name: 'None', threePointPoints: 0 },
      highestFtPoints: { name: 'None', ftPoints: 0 },
      teamEfficiency: 0
    };
  }

  const topScorer = playerStats.reduce((max, player) => 
    player.points > max.points ? player : max, { points: 0, name: 'None' }
  );
  
  const topRebounder = playerStats.reduce((max, player) => 
    player.rebounds > max.rebounds ? 
    { rebounds: player.rebounds, name: player.name } : max, 
    { rebounds: 0, name: 'None' }
  );
  
  const topAssister = playerStats.reduce((max, player) => 
    player.assists > max.assists ? player : max, { assists: 0, name: 'None' }
  );

  const mostSteals = playerStats.reduce((max, player) => 
    player.steals > max.steals ? player : max, { steals: 0, name: 'None' }
  );

  const highestFgPoints = playerStats.reduce((max, player) => {
    const fgPoints = (player.fgMade || 0) * 2;
    return fgPoints > max.fgPoints ? { fgPoints, name: player.name } : max;
  }, { fgPoints: 0, name: 'None' });

  const highest3ptPoints = playerStats.reduce((max, player) => {
    const threePointPoints = (player.threePointers?.made || 0) * 3;
    return threePointPoints > max.threePointPoints ? { threePointPoints, name: player.name } : max;
  }, { threePointPoints: 0, name: 'None' });

  const highestFtPoints = playerStats.reduce((max, player) => {
    const ftPoints = player.ftMade || 0;
    return ftPoints > max.ftPoints ? { ftPoints, name: player.name } : max;
  }, { ftPoints: 0, name: 'None' });

  return {
    topScorer: {
      name: topScorer.name,
      points: topScorer.points
    },
    topRebounder: {
      name: topRebounder.name,
      rebounds: topRebounder.rebounds
    },
    topAssister: {
      name: topAssister.name,
      assists: topAssister.assists
    },
    mostSteals: {
      name: mostSteals.name,
      steals: mostSteals.steals
    },
    highestFgPoints: {
      name: highestFgPoints.name,
      fgPoints: highestFgPoints.fgPoints
    },
    highest3ptPoints: {
      name: highest3ptPoints.name,
      threePointPoints: highest3ptPoints.threePointPoints
    },
    highestFtPoints: {
      name: highestFtPoints.name,
      ftPoints: highestFtPoints.ftPoints
    },
    teamEfficiency: teamTotals.fieldGoalsAttempted > 0 ? 
      Math.round((teamTotals.points / teamTotals.fieldGoalsAttempted) * 100) / 100 : 0
  };
}

// Helper function to generate lineup comparison data
function generateLineupComparison(gameStats: any[]) {
  if (!gameStats || gameStats.length === 0) {
    return {
      starters: [],
      bench: []
    };
  }

  // Group players by minutes played to simulate lineups
  const starters = gameStats
    .filter(stat => (stat.minutesPlayed || 0) > 20)
    .slice(0, 5);
  
  const bench = gameStats
    .filter(stat => (stat.minutesPlayed || 0) <= 20)
    .slice(0, 5);

  return {
    starters: starters.map(stat => ({
      name: 'Player', // We'll get the actual name from the parent function
      minutes: stat.minutesPlayed || 0,
      plusMinus: stat.plusMinus || 0,
      efficiency: stat.points > 0 ? Math.round((stat.points / (stat.minutesPlayed || 1)) * 100) / 100 : 0
    })),
    bench: bench.map(stat => ({
      name: 'Player', // We'll get the actual name from the parent function
      minutes: stat.minutesPlayed || 0,
      plusMinus: stat.plusMinus || 0,
      efficiency: stat.points > 0 ? Math.round((stat.points / (stat.minutesPlayed || 1)) * 100) / 100 : 0
    }))
  };
}

// NEW: Calculate advanced metrics for coaches
function calculateAdvancedMetrics(playerStats: any[], teamTotals: any, gameStats: any[]) {
  if (!playerStats || playerStats.length === 0) {
    return generateEmptyAdvancedMetrics();
  }

  // Calculate team efficiency metrics
  const totalPossessions = teamTotals.fieldGoalsAttempted + 0.44 * teamTotals.freeThrowsAttempted + teamTotals.turnovers;
  const pointsPerPossession = totalPossessions > 0 ? teamTotals.points / totalPossessions : 0;
  
  // Calculate true shooting percentage
  const trueShootingPercentage = totalPossessions > 0 ? 
    (teamTotals.points / (2 * totalPossessions)) * 100 : 0;

  // Calculate field goal and free throw percentages for this function
  const fgPct = teamTotals.fieldGoalsAttempted > 0 ? 
    Math.round((teamTotals.fieldGoalsMade / teamTotals.fieldGoalsAttempted) * 1000) / 10 : 0;
  const ftPct = teamTotals.freeThrowsAttempted > 0 ? 
    Math.round((teamTotals.freeThrowsMade / teamTotals.freeThrowsAttempted) * 1000) / 10 : 0;

  // Calculate player efficiency ratings
  const playerEfficiencyRatings = playerStats.map(player => {
    const minutes = player.minutes || 1;
    const offensiveRating = player.fieldGoals.attempted > 0 ? 
      (player.points * 100) / (player.fieldGoals.attempted + 0.44 * player.freeThrows.attempted + player.turnovers) : 0;
    
    const defensiveRating = minutes > 0 ? 
      ((player.steals + player.blocks) / minutes) * 100 : 0;
    
    const trueShooting = (player.fieldGoals.attempted + 0.44 * player.freeThrows.attempted) > 0 ?
      player.points / (2 * (player.fieldGoals.attempted + 0.44 * player.freeThrows.attempted)) * 100 : 0;
    
    const usageRate = minutes > 0 ? 
      ((player.fieldGoals.attempted + 0.44 * player.freeThrows.attempted + player.turnovers) / minutes) * 100 : 0;

    return {
      playerId: player.id,
      name: player.name,
      offensiveRating: Math.round(offensiveRating * 100) / 100,
      defensiveRating: Math.round(defensiveRating * 100) / 100,
      trueShootingPercentage: Math.round(trueShooting * 100) / 100,
      usageRate: Math.round(usageRate * 100) / 100,
      efficiency: Math.round((offensiveRating + defensiveRating) * 100) / 100
    };
  });

  // Sort by overall efficiency
  playerEfficiencyRatings.sort((a, b) => b.efficiency - a.efficiency);

  // Calculate position-based metrics
  const positionMetrics = calculatePositionMetrics(playerStats);

  // Calculate clutch performance (mock data for now)
  const clutchPerformance = {
    fourthQuarter: {
      fgPct: Math.max(0, fgPct - Math.random() * 10), // Simulate pressure impact
      turnovers: Math.round(teamTotals.turnovers * 0.3), // Assume 30% in 4th quarter
      freeThrowPct: Math.max(0, ftPct - Math.random() * 15)
    },
    lastTwoMinutes: {
      fgPct: Math.max(0, fgPct - Math.random() * 15),
      turnovers: Math.round(teamTotals.turnovers * 0.1),
      freeThrowPct: Math.max(0, ftPct - Math.random() * 20)
    }
  };

  return {
    teamEfficiency: {
      pointsPerPossession: Math.round(pointsPerPossession * 1000) / 1000,
      trueShootingPercentage: Math.round(trueShootingPercentage * 100) / 100,
      offensiveEfficiency: Math.round((teamTotals.points / totalPossessions) * 100) / 100,
      defensiveEfficiency: Math.round(((teamTotals.opponentPoints || 0) / totalPossessions) * 100) / 100,
      pace: Math.round((totalPossessions * 40) / (teamTotals.minutesPlayed || 1))
    },
    playerEfficiencyRatings: playerEfficiencyRatings,
    positionMetrics: positionMetrics,
    clutchPerformance: clutchPerformance,
    reboundingEfficiency: {
      offensive: teamTotals.offensiveRebounds / (teamTotals.offensiveRebounds + (teamTotals.defensiveRebounds || 0)) * 100,
      defensive: teamTotals.defensiveRebounds / (teamTotals.defensiveRebounds + (teamTotals.offensiveRebounds || 0)) * 100
    }
  };
}

// NEW: Calculate position-based metrics
function calculatePositionMetrics(playerStats: any[]) {
  const positions = {
    guards: { count: 0, points: 0, assists: 0, turnovers: 0, fgPct: 0, totalFgAttempted: 0, totalFgMade: 0 },
    forwards: { count: 0, points: 0, rebounds: 0, fgPct: 0, totalFgAttempted: 0, totalFgMade: 0 },
    centers: { count: 0, points: 0, rebounds: 0, blocks: 0, fgPct: 0, totalFgAttempted: 0, totalFgMade: 0 }
  };

  playerStats.forEach(player => {
    const position = player.position?.toLowerCase() || '';
    
    if (position.includes('guard') || position.includes('pg') || position.includes('sg')) {
      positions.guards.count++;
      positions.guards.points += player.points;
      positions.guards.assists += player.assists;
      positions.guards.turnovers += player.turnovers;
      positions.guards.totalFgAttempted += player.fieldGoals.attempted;
      positions.guards.totalFgMade += player.fieldGoals.made;
    } else if (position.includes('forward') || position.includes('sf') || position.includes('pf')) {
      positions.forwards.count++;
      positions.forwards.points += player.points;
      positions.forwards.rebounds += (player.rebounds.offensive + player.rebounds.defensive);
      positions.forwards.totalFgAttempted += player.fieldGoals.attempted;
      positions.forwards.totalFgMade += player.fieldGoals.made;
    } else if (position.includes('center') || position.includes('c')) {
      positions.centers.count++;
      positions.centers.points += player.points;
      positions.centers.rebounds += (player.rebounds.offensive + player.rebounds.defensive);
      positions.centers.blocks += player.blocks;
      positions.centers.totalFgAttempted += player.fieldGoals.attempted;
      positions.centers.totalFgMade += player.fieldGoals.made;
    }
  });

  // Calculate percentages
  Object.keys(positions).forEach(pos => {
    const position = pos as keyof typeof positions;
    if (positions[position].totalFgAttempted > 0) {
      positions[position].fgPct = Math.round((positions[position].totalFgMade / positions[position].totalFgAttempted) * 1000) / 10;
    }
  });

  return positions;
}

// Mock quarter data fallback
function generateMockQuarterData() {
  const quarterData = [1, 2, 3, 4].map(quarter => ({
    quarter: quarter,
    points: Math.floor(Math.random() * 20) + 10,
    fgPct: Math.floor(Math.random() * 30) + 40,
    turnovers: Math.floor(Math.random() * 4) + 1,
    fouls: Math.floor(Math.random() * 3) + 1,
    rebounds: Math.floor(Math.random() * 8) + 4,
    timeouts: Math.floor(Math.random() * 3), // 0-2 timeouts per quarter (realistic range)
    momentum: Math.random() > 0.5 ? 'positive' : 'negative'
  }));

  // Calculate half performance
  const firstHalf = {
    points: quarterData[0].points + quarterData[1].points,
    fgPct: Math.round(((quarterData[0].fgPct + quarterData[1].fgPct) / 2) * 100) / 100,
    turnovers: quarterData[0].turnovers + quarterData[1].turnovers
  };

  const secondHalf = {
    points: quarterData[2].points + quarterData[3].points,
    fgPct: Math.round(((quarterData[2].fgPct + quarterData[3].fgPct) / 2) * 100) / 100,
    turnovers: quarterData[2].turnovers + quarterData[3].turnovers
  };

  return {
    quarters: quarterData,
    firstHalf: firstHalf,
    secondHalf: secondHalf,
    analysis: {
      strongestQuarter: quarterData.reduce((max, q) => q.points > max.points ? q : max).quarter,
      weakestQuarter: quarterData.reduce((min, q) => q.points < min.points ? q : min).quarter,
      consistency: Math.round((1 - (Math.max(...quarterData.map(q => q.points)) - Math.min(...quarterData.map(q => q.points))) / Math.max(...quarterData.map(q => q.points))) * 100)
    }
  };
}

// NEW: Generate quarter breakdown
async function generateQuarterBreakdown(supabase: any, gameId: number) {
  // Fetch real quarter data from game_quarter_totals table
  const { data: quarterTotals, error: quarterError } = await supabase
    .from('game_quarter_totals')
    .select('*')
    .eq('gameid', gameId)  // Note: column name is lowercase 'gameid'
    .order('quarter', { ascending: true });

  if (quarterError) {
    console.error('Error fetching quarter totals:', quarterError);
    // Fallback to mock data if quarter totals don't exist
    return generateMockQuarterData();
  }

  // If no quarter data exists, generate mock data
  if (!quarterTotals || quarterTotals.length === 0) {
    console.log('No quarter totals found, generating mock data');
    return generateMockQuarterData();
  }

  // Process real quarter data
  const quarterData = quarterTotals.map((quarter: any) => {
    // Note: Field goal percentage calculation would need fgm/fga data which isn't in this table
    // For now, we'll use a placeholder or calculate from other available data
    const fgPct = 0; // Placeholder since fgm/fga not available in this table structure
    return {
      quarter: quarter.quarter,
      points: quarter.points || 0,
      fgPct: fgPct,
      turnovers: quarter.tov || 0,
      fouls: quarter.pf || 0,
      rebounds: quarter.reb || 0,
      assists: quarter.ast || 0,
      steals: quarter.stl || 0,
      blocks: quarter.blk || 0,
      timeouts: quarter.timeouts || 0, // Now using real timeouts data from database
      momentum: 'neutral' // Will be calculated based on performance
    };
  });

  // Fill in missing quarters with zeros
  for (let i = 1; i <= 4; i++) {
    if (!quarterData.find((q: any) => q.quarter === i)) {
      quarterData.push({
        quarter: i,
        points: 0,
        fgPct: 0,
        turnovers: 0,
        fouls: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        timeouts: 0,
        momentum: 'neutral'
      });
    }
  }

  // Sort by quarter
  quarterData.sort((a: any, b: any) => a.quarter - b.quarter);

  // Calculate half performance
  const firstHalf = {
    points: quarterData[0].points + quarterData[1].points,
    fgPct: Math.round(((quarterData[0].fgPct + quarterData[1].fgPct) / 2) * 100) / 100,
    turnovers: quarterData[0].turnovers + quarterData[1].turnovers
  };

  const secondHalf = {
    points: quarterData[2].points + quarterData[3].points,
    fgPct: Math.round(((quarterData[2].fgPct + quarterData[3].fgPct) / 2) * 100) / 100,
    turnovers: quarterData[2].turnovers + quarterData[3].turnovers
  };

  return {
    quarters: quarterData,
    firstHalf: firstHalf,
    secondHalf: secondHalf,
    analysis: {
      strongestQuarter: quarterData.reduce((max: any, q: any) => q.points > max.points ? q : max).quarter,
      weakestQuarter: quarterData.reduce((min: any, q: any) => q.points < min.points ? q : min).quarter,
      consistency: Math.round((1 - (Math.max(...quarterData.map((q: any) => q.points)) - Math.min(...quarterData.map((q: any) => q.points))) / Math.max(...quarterData.map((q: any) => q.points))) * 100)
    }
  };
}

// NEW: Generate strategic insights
function generateStrategicInsights(playerStats: any[], gameStats: any[], teamTotals: any) {
  if (!playerStats || playerStats.length === 0) {
    return generateEmptyStrategicInsights();
  }

  // Lineup effectiveness analysis
  const lineupEffectiveness = analyzeLineupEffectiveness(gameStats);

  // Substitution patterns
  const substitutionPatterns = {
    averageStintLength: Math.round(teamTotals.minutesPlayed / playerStats.length),
    substitutionFrequency: 'moderate', // This would be calculated from actual substitution data
    restPeriods: generateMockRestPeriods(playerStats)
  };

  // Game flow analysis
  const gameFlow = {
    largestLead: Math.floor(Math.random() * 15) + 5,
    largestDeficit: Math.floor(Math.random() * 10) + 2,
    momentumShifts: Math.floor(Math.random() * 4) + 2,
    scoringRuns: generateMockScoringRuns()
  };

  // Defensive insights
  const defensiveInsights = {
    stealsToTurnoversRatio: teamTotals.turnovers > 0 ? Math.round((teamTotals.steals / teamTotals.turnovers) * 100) / 100 : 0,
    blocksPerGame: teamTotals.blocks,
    defensiveReboundPercentage: teamTotals.defensiveRebounds / (teamTotals.defensiveRebounds + (teamTotals.offensiveRebounds || 0)) * 100,
    foulsPerMinute: Math.round((teamTotals.fouls / teamTotals.minutesPlayed) * 1000) / 1000
  };

  return {
    lineupEffectiveness: lineupEffectiveness,
    substitutionPatterns: substitutionPatterns,
    gameFlow: gameFlow,
    defensiveInsights: defensiveInsights,
    recommendations: generateRecommendations(playerStats, teamTotals)
  };
}

// NEW: Analyze lineup effectiveness
function analyzeLineupEffectiveness(gameStats: any[]) {
  // Mock lineup analysis - in reality, this would analyze actual lineup combinations
  const lineups = [
    {
      players: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5'],
      plusMinus: Math.floor(Math.random() * 20) - 10,
      minutes: Math.floor(Math.random() * 8) + 4,
      efficiency: Math.random() > 0.5 ? 'high' : 'medium'
    },
    {
      players: ['Player6', 'Player7', 'Player8', 'Player9', 'Player10'],
      plusMinus: Math.floor(Math.random() * 15) - 7,
      minutes: Math.floor(Math.random() * 6) + 3,
      efficiency: Math.random() > 0.5 ? 'medium' : 'low'
    }
  ];

  return {
    mostEffective: lineups.filter(l => l.efficiency === 'high'),
    leastEffective: lineups.filter(l => l.efficiency === 'low'),
    averagePlusMinus: Math.round(lineups.reduce((sum, l) => sum + l.plusMinus, 0) / lineups.length * 100) / 100
  };
}

// NEW: Generate mock rest periods
function generateMockRestPeriods(playerStats: any[]) {
  return playerStats.slice(0, 3).map(player => ({
    player: player.name,
    restStart: `${Math.floor(Math.random() * 6) + 2}:00`,
    restEnd: `${Math.floor(Math.random() * 4) + 1}:30`,
    duration: Math.floor(Math.random() * 3) + 1
  }));
}

// NEW: Generate mock scoring runs
function generateMockScoringRuns() {
  return [
    {
      startTime: '8:30',
      endTime: '6:45',
      points: Math.floor(Math.random() * 8) + 4,
      opponentPoints: Math.floor(Math.random() * 3),
      momentum: 'gained'
    },
    {
      startTime: '4:15',
      endTime: '2:30',
      points: Math.floor(Math.random() * 6) + 3,
      opponentPoints: Math.floor(Math.random() * 2),
      momentum: 'gained'
    }
  ];
}

// NEW: Generate recommendations
function generateRecommendations(playerStats: any[], teamTotals: any) {
  const recommendations = [];

  if (teamTotals.fieldGoalsAttempted > 0 && (teamTotals.fieldGoalsMade / teamTotals.fieldGoalsAttempted) < 0.4) {
    recommendations.push({
      category: 'Field Goal Shooting',
      priority: 'high',
      message: 'Improve field goal percentage - focus on shot selection and form',
      actionable: 'Implement shooting drills and emphasize high-percentage shots'
    });
  }

  if (teamTotals.threePointsAttempted > 0 && (teamTotals.threePointsMade / teamTotals.threePointsAttempted) < 0.3) {
    recommendations.push({
      category: 'Three Point Shooting',
      priority: 'medium',
      message: 'Three point percentage needs improvement',
      actionable: 'Practice three point shooting and work on proper form'
    });
  }

  if (teamTotals.turnovers > 15) {
    recommendations.push({
      category: 'Ball Control',
      priority: 'high',
      message: 'Reduce turnovers - focus on passing fundamentals and decision making',
      actionable: 'Practice passing drills and emphasize smart shot selection'
    });
  }

  if (teamTotals.freeThrowsAttempted > 0 && (teamTotals.freeThrowsMade / teamTotals.freeThrowsAttempted) < 0.7) {
    recommendations.push({
      category: 'Free Throw Shooting',
      priority: 'medium',
      message: 'Improve free throw percentage - this could have won/lost the game',
      actionable: 'Implement daily free throw practice routine'
    });
  }

  if (teamTotals.offensiveRebounds < teamTotals.defensiveRebounds * 0.3) {
    recommendations.push({
      category: 'Offensive Rebounding',
      priority: 'medium',
      message: 'Increase offensive rebounding to create second-chance opportunities',
      actionable: 'Focus on boxing out and positioning drills'
    });
  }

  return recommendations;
}

// NEW: Generate empty advanced metrics
function generateEmptyAdvancedMetrics() {
  return {
    teamEfficiency: {
      pointsPerPossession: 0,
      trueShootingPercentage: 0,
      offensiveEfficiency: 0,
      defensiveEfficiency: 0,
      pace: 0
    },
    playerEfficiencyRatings: [],
    positionMetrics: {
      guards: { count: 0, points: 0, assists: 0, turnovers: 0, fgPct: 0 },
      forwards: { count: 0, points: 0, rebounds: 0, fgPct: 0 },
      centers: { count: 0, points: 0, rebounds: 0, blocks: 0, fgPct: 0 }
    },
    clutchPerformance: {
      fourthQuarter: { fgPct: 0, turnovers: 0, freeThrowPct: 0 },
      lastTwoMinutes: { fgPct: 0, turnovers: 0, freeThrowPct: 0 }
    },
    reboundingEfficiency: {
      offensive: 0,
      defensive: 0
    }
  };
}

// NEW: Generate empty quarter breakdown
function generateEmptyQuarterBreakdown() {
  return {
    quarters: [],
    firstHalf: { points: 0, fgPct: 0, turnovers: 0 },
    secondHalf: { points: 0, fgPct: 0, turnovers: 0 },
    analysis: {
      strongestQuarter: 0,
      weakestQuarter: 0,
      consistency: 0
    }
  };
}

// NEW: Generate empty strategic insights
function generateEmptyStrategicInsights() {
  return {
    lineupEffectiveness: {
      mostEffective: [],
      leastEffective: [],
      averagePlusMinus: 0
    },
    substitutionPatterns: {
      averageStintLength: 0,
      substitutionFrequency: 'unknown',
      restPeriods: []
    },
    gameFlow: {
      largestLead: 0,
      largestDeficit: 0,
      momentumShifts: 0,
      scoringRuns: []
    },
    defensiveInsights: {
      stealsToTurnoversRatio: 0,
      blocksPerGame: 0,
      defensiveReboundPercentage: 0,
      foulsPerMinute: 0
    },
    recommendations: []
  };
}
