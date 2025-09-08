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

    // Format player stats with safe defaults
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
        },
        rebounds: {
          offensive: stat.offensiveRebounds || 0,
          defensive: stat.defensiveRebounds || 0
        },
        assists: stat.assists || 0,
        steals: stat.steals || 0,
        blocks: stat.blocks || 0,
        turnovers: stat.turnovers || 0,
        fouls: stat.fouls || 0,
        plusMinus: stat.plusMinus || 0
      };
    });

    // Sort players by points (descending)
    playerStats.sort((a, b) => b.points - a.points);

    // Generate mock play-by-play data
    const playByPlay = generateMockPlayByPlay(gameStats || [], game);

    // Calculate standout information
    const standoutInfo = calculateStandoutInfo(playerStats, teamTotals);

    // Generate lineup comparison data
    const lineupComparison = generateLineupComparison(gameStats || []);
    
    // Update lineup comparison with actual player names
    if (lineupComparison.starters) {
      lineupComparison.starters = lineupComparison.starters.map((starter, index) => {
        const stat = gameStats?.filter(s => (s.minutesPlayed || 0) > 20)[index];
        if (stat && stat.playerId) {
          const player = players[stat.playerId];
          return {
            ...starter,
            name: player?.name || 'Unknown Player'
          };
        }
        return starter;
      });
    }
    
    if (lineupComparison.bench) {
      lineupComparison.bench = lineupComparison.bench.map((benchPlayer, index) => {
        const stat = gameStats?.filter(s => (s.minutesPlayed || 0) <= 20)[index];
        if (stat && stat.playerId) {
          const player = players[stat.playerId];
          return {
            ...benchPlayer,
            name: player?.name || 'Unknown Player'
          };
        }
        return benchPlayer;
      });
    }

    // Calculate advanced metrics
    const advancedMetrics = calculateAdvancedMetrics(playerStats, teamTotals, gameStats || []);

    // Generate quarter breakdown (mock data for now)
    const quarterBreakdown = generateQuarterBreakdown(gameStats || [], game);

    // Generate strategic insights
    const strategicInsights = generateStrategicInsights(playerStats, gameStats || [], teamTotals);

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
      strategicInsights: strategicInsights
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
function generateMockPlayByPlay(gameStats: any[], game: any) {
  const plays: any[] = [];
  let currentScore = 0;
  let opponentScore = 0;
  
  // Generate plays based on actual game stats
  gameStats.forEach((stat, index) => {
    if (stat.points && stat.points > 0) {
      currentScore += stat.points;
      plays.push({
        time: `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        quarter: Math.floor(Math.random() * 4) + 1,
        description: `Player scored ${stat.points} point${stat.points > 1 ? 's' : ''}`,
        score: `${currentScore}-${opponentScore}`,
        type: 'scoring'
      });
    }
    
    if (stat.assists && stat.assists > 0) {
      plays.push({
        time: `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        quarter: Math.floor(Math.random() * 4) + 1,
        description: `Player recorded an assist`,
        score: `${currentScore}-${opponentScore}`,
        type: 'assist'
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

// Helper function to calculate standout information
function calculateStandoutInfo(playerStats: any[], teamTotals: any) {
  if (!playerStats || playerStats.length === 0) {
    return {
      topScorer: { name: 'None', points: 0 },
      topRebounder: { name: 'None', rebounds: 0 },
      topAssister: { name: 'None', assists: 0 },
      teamEfficiency: 0
    };
  }

  const topScorer = playerStats.reduce((max, player) => 
    player.points > max.points ? player : max, { points: 0, name: 'None' }
  );
  
  const topRebounder = playerStats.reduce((max, player) => 
    (player.rebounds.offensive + player.rebounds.defensive) > max.rebounds ? 
    { rebounds: player.rebounds.offensive + player.rebounds.defensive, name: player.name } : max, 
    { rebounds: 0, name: 'None' }
  );
  
  const topAssister = playerStats.reduce((max, player) => 
    player.assists > max.assists ? player : max, { assists: 0, name: 'None' }
  );

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

// NEW: Generate quarter breakdown
function generateQuarterBreakdown(gameStats: any[], game: any) {
  // Generate mock quarter data
  const quarterData = [1, 2, 3, 4].map(quarter => ({
    quarter: quarter,
    points: Math.floor(Math.random() * 20) + 10,
    fgPct: Math.floor(Math.random() * 30) + 40,
    turnovers: Math.floor(Math.random() * 4) + 1,
    fouls: Math.floor(Math.random() * 3) + 1,
    rebounds: Math.floor(Math.random() * 8) + 4,
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
