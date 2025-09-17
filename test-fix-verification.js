// Test Fix Verification - Run this after the API fix
// Copy and paste this into your browser console

(async function testFixVerification() {
  console.log('🔧 Testing Fix Verification');
  console.log('===========================');
  
  const results = [];
  
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    results.push({ timestamp, type, message });
  }

  try {
    // Test 1: Create a new session with the fixed API
    log('Test 1: Creating new session with fixed API...');
    const sessionData = {
      eventId: 16,
      sessionKey: `fix_test_${Date.now()}`,
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
    
    if (gameId === null) {
      log('❌ GameID is still null - fix did not work!', 'error');
    } else {
      log(`✅ GameID is now set: ${gameId} - fix worked!`, 'success');
    }

    // Test 2: Record events and verify game_id is saved
    log('Test 2: Recording events with game_id...');
    
    const testEvents = [
      {
        sessionId: sessionId,
        playerId: 18,
        eventType: 'fg_made',
        eventValue: 2,
        quarter: 1,
        gameTime: 0,
        isOpponentEvent: false,
        opponentJersey: null,
        metadata: {}
      },
      {
        sessionId: sessionId,
        playerId: null,
        eventType: 'fg_made',
        eventValue: 2,
        quarter: 1,
        gameTime: 0,
        isOpponentEvent: true,
        opponentJersey: '5',
        metadata: {}
      }
    ];

    const recordedEvents = [];
    for (const event of testEvents) {
      const eventResponse = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-event',
          data: event
        })
      });

      const eventResult = await eventResponse.json();
      
      if (!eventResult.success) {
        log(`❌ Event recording failed: ${eventResult.error}`, 'error');
      } else {
        recordedEvents.push(eventResult.data);
        log(`✅ Event recorded: ${event.eventType} (${event.isOpponentEvent ? 'Opponent' : 'Team'})`, 'success');
      }
    }

    // Test 3: Verify database storage with game_id
    log('Test 3: Verifying database storage with game_id...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const verifyResponse = await fetch(`/api/live-stat-tracker?type=session&sessionKey=${sessionData.sessionKey}`);
    const verifyData = await verifyResponse.json();
    
    if (!verifyData.success) {
      log(`❌ Failed to retrieve session data: ${verifyData.error}`, 'error');
    } else {
      const storedEvents = verifyData.data.live_game_events || [];
      log(`✅ Found ${storedEvents.length} events in database`, 'success');
      
      if (storedEvents.length === 0) {
        log('❌ No events found in database - events not being saved!', 'error');
      } else {
        const eventsWithGameId = storedEvents.filter(e => e.game_id !== null);
        if (eventsWithGameId.length === 0) {
          log('❌ All events still have null game_id - fix did not work!', 'error');
        } else {
          log(`✅ ${eventsWithGameId.length}/${storedEvents.length} events now have valid game_id - fix worked!`, 'success');
        }
      }
    }

    // Test 4: Check if analytics will work now
    log('Test 4: Checking if analytics will work now...');
    const teamEvents = recordedEvents.filter(e => !e.is_opponent_event);
    const opponentEvents = recordedEvents.filter(e => e.is_opponent_event);
    
    const teamPoints = teamEvents.reduce((sum, e) => {
      if (e.event_type === 'three_made') return sum + 3;
      if (e.event_type === 'ft_made') return sum + 1;
      if (e.event_type === 'fg_made') return sum + (e.event_value || 2);
      return sum;
    }, 0);
    
    const opponentPoints = opponentEvents.reduce((sum, e) => {
      if (e.event_type === 'three_made') return sum + 3;
      if (e.event_type === 'ft_made') return sum + 1;
      if (e.event_type === 'fg_made') return sum + (e.event_value || 2);
      return sum;
    }, 0);
    
    log(`Expected team points: ${teamPoints}`, 'info');
    log(`Expected opponent points: ${opponentPoints}`, 'info');
    log(`Expected display: HOME ${teamPoints} - ${opponentPoints} OPP`, 'info');

    // Summary
    log('📊 FIX VERIFICATION SUMMARY', 'info');
    log('===========================', 'info');
    const totalTests = results.length;
    const passedTests = results.filter(r => r.type === 'success').length;
    const failedTests = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total checks: ${totalTests}`, 'info');
    log(`✅ Passed: ${passedTests}`, 'success');
    log(`❌ Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedTests === 0) {
      log('🎉 Fix verification passed! The game_id issue is resolved.', 'success');
    } else {
      log('💥 Fix verification failed. The game_id issue still exists.', 'error');
    }

    return {
      sessionId,
      gameId,
      recordedEvents,
      teamPoints,
      opponentPoints,
      results
    };

  } catch (error) {
    log(`💥 Fix verification failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();



