// Test script to trigger live event aggregation
// This will aggregate the live events from session 49 into game stats

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function aggregateSession(sessionId) {
  try {
    console.log(`Aggregating session ${sessionId}...`);

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('live_game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session not found:', sessionError);
      return;
    }

    console.log('Found session:', session);

    // Get all live events for this session
    const { data: liveEvents, error: eventsError } = await supabase
      .from('live_game_events')
      .select('*')
      .eq('session_id', sessionId);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }

    console.log(`Found ${liveEvents.length} live events`);

    if (!liveEvents || liveEvents.length === 0) {
      console.log('No live events found, skipping aggregation');
      return;
    }

    // Create or get game record
    let gameId = session.game_id;

    if (!gameId) {
      console.log('Creating new game record...');
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          event_id: session.event_id,
          opponent: 'Opponent',
          home_score: 0,
          away_score: 0,
          game_date: new Date().toISOString(),
          created_by: session.created_by || 1,
          updated_by: session.created_by || 1
        })
        .select()
        .single();

      if (gameError) {
        console.error('Error creating game:', gameError);
        return;
      }

      gameId = game.id;
      console.log(`Created game ${gameId}`);

      // Update session with game_id
      await supabase
        .from('live_game_sessions')
        .update({ game_id: gameId })
        .eq('id', sessionId);
    }

    // Aggregate events by player and quarter
    const playerStats = {};
    const gameTotals = {
      team: { points: 0, fgm: 0, fga: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0 },
      opponent: { points: 0, fgm: 0, fga: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0 }
    };

    for (const event of liveEvents) {
      const isTeam = !event.is_opponent_event;
      const playerKey = event.player_id ? `${event.player_id}_${event.quarter}` : null;

      // Initialize player stats if not exists
      if (playerKey && !playerStats[playerKey]) {
        playerStats[playerKey] = {
          game_id: gameId,
          player_id: event.player_id,
          quarter: event.quarter,
          points: 0, fgm: 0, fga: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
          created_by: session.created_by || 1,
          updated_by: session.created_by || 1
        };
      }

      // Update stats based on event type
      const targetStats = isTeam ? gameTotals.team : gameTotals.opponent;
      const playerStat = playerKey ? playerStats[playerKey] : null;

      switch (event.event_type) {
        case 'fg_made':
          targetStats.points += 2;
          targetStats.fgm += 1;
          targetStats.fga += 1;
          if (playerStat) {
            playerStat.points += 2;
            playerStat.fgm += 1;
            playerStat.fga += 1;
          }
          break;
        case 'fg_missed':
          targetStats.fga += 1;
          if (playerStat) playerStat.fga += 1;
          break;
        case 'three_made':
          targetStats.points += 3;
          targetStats.fgm += 1;
          targetStats.fga += 1;
          if (playerStat) {
            playerStat.points += 3;
            playerStat.fgm += 1;
            playerStat.fga += 1;
          }
          break;
        case 'three_missed':
          targetStats.fga += 1;
          if (playerStat) playerStat.fga += 1;
          break;
        case 'ft_made':
          targetStats.points += 1;
          if (playerStat) playerStat.points += 1;
          break;
        case 'rebound':
          targetStats.rebounds += 1;
          if (playerStat) playerStat.rebounds += 1;
          break;
        case 'assist':
          targetStats.assists += 1;
          if (playerStat) playerStat.assists += 1;
          break;
        case 'steal':
          targetStats.steals += 1;
          if (playerStat) playerStat.steals += 1;
          break;
        case 'block':
          targetStats.blocks += 1;
          if (playerStat) playerStat.blocks += 1;
          break;
        case 'turnover':
          targetStats.turnovers += 1;
          if (playerStat) playerStat.turnovers += 1;
          break;
        case 'foul':
          targetStats.fouls += 1;
          if (playerStat) playerStat.fouls += 1;
          break;
      }
    }

    console.log('Game totals:', gameTotals);
    console.log('Player stats:', Object.keys(playerStats).length, 'players');

    // Insert aggregated stats
    const gameStatsRecords = Object.values(playerStats);
    if (gameStatsRecords.length > 0) {
      console.log('Clearing existing stats for game', gameId);
      await supabase
        .from('game_stats')
        .delete()
        .eq('game_id', gameId);

      console.log('Inserting new stats...');
      const { error: statsError } = await supabase
        .from('game_stats')
        .insert(gameStatsRecords);

      if (statsError) {
        console.error('Error inserting game stats:', statsError);
      } else {
        console.log(`✅ Inserted ${gameStatsRecords.length} player stat records`);
      }
    }

    // Update game with final scores
    console.log('Updating game with final scores...');
    await supabase
      .from('games')
      .update({
        home_score: gameTotals.team.points,
        away_score: gameTotals.opponent.points,
        result: gameTotals.team.points > gameTotals.opponent.points ? 'WIN' :
                gameTotals.team.points < gameTotals.opponent.points ? 'LOSS' : 'TIE',
        updated_at: new Date().toISOString(),
        updated_by: session.created_by || 1
      })
      .eq('id', gameId);

    console.log('✅ Aggregation complete!');
    console.log(`📊 Game ${gameId}: Team ${gameTotals.team.points} - Opponent ${gameTotals.opponent.points}`);

  } catch (error) {
    console.error('❌ Aggregation failed:', error);
  }
}

// Run aggregation for session 49 (which has the events we saw)
aggregateSession(49);
