// Automated Basketball Game Simulator
// Generates realistic stats and tracks everything in Supabase
// Copy and paste this into your browser console while on the live stat tracker page

(async function automatedGameSimulator() {
  console.log('🏀 Starting Automated Basketball Game Simulator');
  console.log('===============================================');
  
  const results = [];
  const gameStats = {
    homeTeam: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0 },
    opponent: { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0, fgMade: 0, fgAttempted: 0, threeMade: 0, threeAttempted: 0, ftMade: 0, ftAttempted: 0 }
  };
  
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    results.push({ timestamp, type, message });
  }

  // Helper function to simulate a click
  function simulateClick(element) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  }

  // Helper function to wait for an element
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  // Generate realistic basketball stats
  function generateGameStats() {
    const stats = {
      homeTeam: {
        points: Math.floor(Math.random() * 80) + 60, // 60-140 points
        rebounds: Math.floor(Math.random() * 20) + 30, // 30-50 rebounds
        assists: Math.floor(Math.random() * 15) + 15, // 15-30 assists
        steals: Math.floor(Math.random() * 8) + 5, // 5-13 steals
        blocks: Math.floor(Math.random() * 6) + 3, // 3-9 blocks
        turnovers: Math.floor(Math.random() * 12) + 8, // 8-20 turnovers
        fgMade: 0,
        fgAttempted: 0,
        threeMade: 0,
        threeAttempted: 0,
        ftMade: 0,
        ftAttempted: 0
      },
      opponent: {
        points: Math.floor(Math.random() * 80) + 60, // 60-140 points
        rebounds: Math.floor(Math.random() * 20) + 30, // 30-50 rebounds
        assists: Math.floor(Math.random() * 15) + 15, // 15-30 assists
        steals: Math.floor(Math.random() * 8) + 5, // 5-13 steals
        blocks: Math.floor(Math.random() * 6) + 3, // 3-9 blocks
        turnovers: Math.floor(Math.random() * 12) + 8, // 8-20 turnovers
        fgMade: 0,
        fgAttempted: 0,
        threeMade: 0,
        threeAttempted: 0,
        ftMade: 0,
        ftAttempted: 0
      }
    };

    // Calculate field goal attempts and makes
    stats.homeTeam.fgAttempted = Math.floor(stats.homeTeam.points / 1.2) + Math.floor(Math.random() * 20);
    stats.homeTeam.fgMade = Math.floor(stats.homeTeam.fgAttempted * (0.4 + Math.random() * 0.2)); // 40-60% FG%
    
    stats.opponent.fgAttempted = Math.floor(stats.opponent.points / 1.2) + Math.floor(Math.random() * 20);
    stats.opponent.fgMade = Math.floor(stats.opponent.fgAttempted * (0.4 + Math.random() * 0.2)); // 40-60% FG%

    // Calculate three-point attempts and makes
    stats.homeTeam.threeAttempted = Math.floor(stats.homeTeam.fgAttempted * (0.25 + Math.random() * 0.15)); // 25-40% of FG attempts
    stats.homeTeam.threeMade = Math.floor(stats.homeTeam.threeAttempted * (0.3 + Math.random() * 0.2)); // 30-50% 3PT%
    
    stats.opponent.threeAttempted = Math.floor(stats.opponent.fgAttempted * (0.25 + Math.random() * 0.15));
    stats.opponent.threeMade = Math.floor(stats.opponent.threeAttempted * (0.3 + Math.random() * 0.2));

    // Calculate free throw attempts and makes
    stats.homeTeam.ftAttempted = Math.floor(stats.homeTeam.points * 0.3) + Math.floor(Math.random() * 10);
    stats.homeTeam.ftMade = Math.floor(stats.homeTeam.ftAttempted * (0.7 + Math.random() * 0.2)); // 70-90% FT%
    
    stats.opponent.ftAttempted = Math.floor(stats.opponent.points * 0.3) + Math.floor(Math.random() * 10);
    stats.opponent.ftMade = Math.floor(stats.opponent.ftAttempted * (0.7 + Math.random() * 0.2));

    return stats;
  }

  // Generate individual events from stats
  function generateEventsFromStats(stats, isOpponent = false) {
    const events = [];
    const team = isOpponent ? 'opponent' : 'homeTeam';
    const playerJerseys = isOpponent ? ['5', '12', '23', '34', '42'] : ['1', '3', '7', '11', '15', '21', '24', '33'];
    
    // Generate field goal events
    for (let i = 0; i < stats[team].fgMade; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'fg_made',
        eventValue: Math.random() > 0.3 ? 2 : 3, // 70% 2PT, 30% 3PT
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720) // 0-720 seconds (12 minutes)
      });
    }

    // Generate field goal misses
    for (let i = 0; i < stats[team].fgAttempted - stats[team].fgMade; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'fg_miss',
        eventValue: Math.random() > 0.3 ? 2 : 3,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    // Generate three-point events
    for (let i = 0; i < stats[team].threeMade; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'three_made',
        eventValue: 3,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    // Generate free throw events
    for (let i = 0; i < stats[team].ftMade; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'ft_made',
        eventValue: 1,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    // Generate other stat events
    for (let i = 0; i < stats[team].assists; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'assist',
        eventValue: 1,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    for (let i = 0; i < stats[team].rebounds; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'rebound',
        eventValue: 1,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    for (let i = 0; i < stats[team].steals; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'steal',
        eventValue: 1,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    for (let i = 0; i < stats[team].blocks; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'block',
        eventValue: 1,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    for (let i = 0; i < stats[team].turnovers; i++) {
      const playerId = isOpponent ? null : playerJerseys[Math.floor(Math.random() * playerJerseys.length)];
      const opponentJersey = isOpponent ? playerJerseys[Math.floor(Math.random() * playerJerseys.length)] : null;
      
      events.push({
        eventType: 'turnover',
        eventValue: 1,
        playerId: playerId,
        isOpponentEvent: isOpponent,
        opponentJersey: opponentJersey,
        quarter: Math.floor(Math.random() * 4) + 1,
        gameTime: Math.floor(Math.random() * 720)
      });
    }

    return events;
  }

  try {
    // Step 1: Check if we're on the tracker page
    log('Step 1: Checking if we\'re on the tracker page...');
    if (!window.location.href.includes('live-stat-tracker')) {
      throw new Error('Please navigate to the live stat tracker page first');
    }
    log('✅ On live stat tracker page', 'success');

    // Step 2: Generate realistic game stats
    log('Step 2: Generating realistic game stats...');
    const targetStats = generateGameStats();
    log(`Target Home Team Stats: ${targetStats.homeTeam.points} pts, ${targetStats.homeTeam.rebounds} reb, ${targetStats.homeTeam.assists} ast`, 'info');
    log(`Target Opponent Stats: ${targetStats.opponent.points} pts, ${targetStats.opponent.rebounds} reb, ${targetStats.opponent.assists} ast`, 'info');

    // Step 3: Create a new session
    log('Step 3: Creating new game session...');
    const sessionData = {
      eventId: 16,
      sessionKey: `simulated_game_${Date.now()}`,
      gameState: {
        quarter: 1,
        homeScore: 0,
        awayScore: 0,
        opponentScore: 0,
        isPlaying: false
      },
      createdBy: 1
    };

    const sessionResponse = await fetch('/api/live-stat-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-session',
        data: sessionData
      })
    });

    const sessionResult = await sessionResponse.json();
    
    if (!sessionResult.success) {
      throw new Error(`Session creation failed: ${sessionResult.error}`);
    }

    const sessionId = sessionResult.data.id;
    const gameId = sessionResult.data.game_id;
    log(`✅ Session created - ID: ${sessionId}, GameID: ${gameId}`, 'success');

    // Step 4: Generate events from stats
    log('Step 4: Generating events from stats...');
    const homeEvents = generateEventsFromStats(targetStats, false);
    const opponentEvents = generateEventsFromStats(targetStats, true);
    const allEvents = [...homeEvents, ...opponentEvents];
    
    // Shuffle events to simulate realistic game flow
    allEvents.sort(() => Math.random() - 0.5);
    
    log(`Generated ${homeEvents.length} home team events`, 'info');
    log(`Generated ${opponentEvents.length} opponent events`, 'info');
    log(`Total events: ${allEvents.length}`, 'info');

    // Step 5: Record all events to database
    log('Step 5: Recording events to database...');
    let recordedEvents = 0;
    let failedEvents = 0;

    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i];
      
      try {
        const eventResponse = await fetch('/api/live-stat-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'record-event',
            data: {
              sessionId: sessionId,
              playerId: event.playerId,
              eventType: event.eventType,
              eventValue: event.eventValue,
              quarter: event.quarter,
              gameTime: event.gameTime,
              isOpponentEvent: event.isOpponentEvent,
              opponentJersey: event.opponentJersey,
              metadata: {}
            }
          })
        });

        const eventResult = await eventResponse.json();
        
        if (eventResult.success) {
          recordedEvents++;
          
          // Update our tracking stats
          const team = event.isOpponentEvent ? 'opponent' : 'homeTeam';
          if (event.eventType === 'fg_made') {
            gameStats[team].points += event.eventValue;
            gameStats[team].fgMade++;
            gameStats[team].fgAttempted++;
          } else if (event.eventType === 'fg_miss') {
            gameStats[team].fgAttempted++;
          } else if (event.eventType === 'three_made') {
            gameStats[team].points += 3;
            gameStats[team].threeMade++;
            gameStats[team].threeAttempted++;
          } else if (event.eventType === 'ft_made') {
            gameStats[team].points += 1;
            gameStats[team].ftMade++;
            gameStats[team].ftAttempted++;
          } else if (event.eventType === 'assist') {
            gameStats[team].assists++;
          } else if (event.eventType === 'rebound') {
            gameStats[team].rebounds++;
          } else if (event.eventType === 'steal') {
            gameStats[team].steals++;
          } else if (event.eventType === 'block') {
            gameStats[team].blocks++;
          } else if (event.eventType === 'turnover') {
            gameStats[team].turnovers++;
          }
        } else {
          failedEvents++;
          log(`❌ Event ${i + 1} failed: ${eventResult.error}`, 'error');
        }
      } catch (error) {
        failedEvents++;
        log(`❌ Event ${i + 1} error: ${error.message}`, 'error');
      }

      // Add small delay to prevent overwhelming the API
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    log(`✅ Recorded ${recordedEvents} events successfully`, 'success');
    if (failedEvents > 0) {
      log(`⚠️ ${failedEvents} events failed`, 'warning');
    }

    // Step 6: Verify database storage
    log('Step 6: Verifying database storage...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const verifyResponse = await fetch(`/api/live-stat-tracker?type=session&sessionKey=${sessionData.sessionKey}`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.success) {
      const storedEvents = verifyData.data.live_game_events || [];
      log(`✅ Found ${storedEvents.length} events in database`, 'success');
      
      const eventsWithGameId = storedEvents.filter(e => e.game_id !== null);
      log(`✅ ${eventsWithGameId.length}/${storedEvents.length} events have valid game_id`, 'success');
    } else {
      log(`❌ Failed to retrieve session data: ${verifyData.error}`, 'error');
    }

    // Step 7: Calculate final statistics
    log('Step 7: Calculating final statistics...');
    const finalScore = `HOME ${gameStats.homeTeam.points} - ${gameStats.opponent.points} OPP`;
    log(`Final Score: ${finalScore}`, 'info');
    
    log(`Home Team Final Stats:`, 'info');
    log(`  Points: ${gameStats.homeTeam.points}`, 'info');
    log(`  Rebounds: ${gameStats.homeTeam.rebounds}`, 'info');
    log(`  Assists: ${gameStats.homeTeam.assists}`, 'info');
    log(`  Steals: ${gameStats.homeTeam.steals}`, 'info');
    log(`  Blocks: ${gameStats.homeTeam.blocks}`, 'info');
    log(`  Turnovers: ${gameStats.homeTeam.turnovers}`, 'info');
    log(`  FG: ${gameStats.homeTeam.fgMade}/${gameStats.homeTeam.fgAttempted} (${Math.round((gameStats.homeTeam.fgMade / gameStats.homeTeam.fgAttempted) * 100)}%)`, 'info');
    
    log(`Opponent Final Stats:`, 'info');
    log(`  Points: ${gameStats.opponent.points}`, 'info');
    log(`  Rebounds: ${gameStats.opponent.rebounds}`, 'info');
    log(`  Assists: ${gameStats.opponent.assists}`, 'info');
    log(`  Steals: ${gameStats.opponent.steals}`, 'info');
    log(`  Blocks: ${gameStats.opponent.blocks}`, 'info');
    log(`  Turnovers: ${gameStats.opponent.turnovers}`, 'info');
    log(`  FG: ${gameStats.opponent.fgMade}/${gameStats.opponent.fgAttempted} (${Math.round((gameStats.opponent.fgMade / gameStats.opponent.fgAttempted) * 100)}%)`, 'info');

    // Summary
    log('📊 GAME SIMULATION SUMMARY', 'info');
    log('===========================', 'info');
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.type === 'success').length;
    const failedSteps = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total events generated: ${allEvents.length}`, 'info');
    log(`Events recorded successfully: ${recordedEvents}`, 'info');
    log(`Events failed: ${failedEvents}`, 'info');
    log(`Success rate: ${Math.round((recordedEvents / allEvents.length) * 100)}%`, 'info');
    
    log(`Total checks: ${totalSteps}`, 'info');
    log(`✅ Passed: ${passedSteps}`, 'success');
    log(`❌ Failed: ${failedSteps}`, failedSteps > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedSteps === 0) {
      log('🎉 Game simulation completed successfully!', 'success');
      log('Check your Supabase database to verify all data was saved correctly.', 'info');
    } else {
      log('💥 Some steps failed. Check the errors above for details.', 'error');
    }

    return {
      sessionId,
      gameId,
      totalEvents: allEvents.length,
      recordedEvents,
      failedEvents,
      finalScore,
      gameStats,
      results
    };

  } catch (error) {
    log(`💥 Game simulation failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();



