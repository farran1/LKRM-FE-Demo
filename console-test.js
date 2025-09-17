// Live Stats Tracker Console Test
// Copy and paste this entire code into your browser console while on the live stat tracker page

(async function runLiveStatsTest() {
  console.log('🧪 Starting Live Stats Tracker Console Test');
  console.log('==========================================');
  
  const results = [];
  
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    results.push({ timestamp, type, message });
  }

  try {
    // Test 1: Check if we're on the right page
    log('Test 1: Checking page context...');
    if (!window.location.href.includes('live-stat-tracker')) {
      throw new Error('Please navigate to the live stat tracker page first');
    }
    log('✅ On live stat tracker page', 'success');

    // Test 2: Check if required functions exist
    log('Test 2: Checking for required functions...');
    if (typeof fetch === 'undefined') {
      throw new Error('Fetch API not available');
    }
    log('✅ Fetch API available', 'success');

    // Test 3: Test database connection
    log('Test 3: Testing database connection...');
    const dbTestResponse = await fetch('/api/live-stat-tracker?type=session&sessionKey=test');
    const dbTestData = await dbTestResponse.json();
    
    if (!dbTestResponse.ok) {
      log(`❌ Database connection failed: ${dbTestData.error || 'Unknown error'}`, 'error');
    } else {
      log('✅ Database connection successful', 'success');
    }

    // Test 4: Create a test session
    log('Test 4: Creating test session...');
    const sessionData = {
      eventId: 16,
      sessionKey: `console_test_${Date.now()}`,
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

    // Test 5: Record test events
    log('Test 5: Recording test events...');
    
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

    // Test 6: Verify database storage
    log('Test 6: Verifying database storage...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for processing
    
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
          log('❌ All events have null game_id - foreign key not being set!', 'error');
        } else {
          log(`✅ ${eventsWithGameId.length}/${storedEvents.length} events have valid game_id`, 'success');
        }
      }
    }

    // Test 7: Check current UI state
    log('Test 7: Checking UI state...');
    
    // Try to access React component state (if available)
    if (window.React && window.React.useState) {
      log('✅ React is available', 'success');
    } else {
      log('⚠️ React not directly accessible - UI state check limited', 'warning');
    }

    // Test 8: Calculate expected statistics
    log('Test 8: Calculating expected statistics...');
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
    log('📊 TEST SUMMARY', 'info');
    log('===============', 'info');
    const totalTests = results.length;
    const passedTests = results.filter(r => r.type === 'success').length;
    const failedTests = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total checks: ${totalTests}`, 'info');
    log(`✅ Passed: ${passedTests}`, 'success');
    log(`❌ Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedTests === 0) {
      log('🎉 All tests passed! Live stats tracker is working correctly.', 'success');
    } else {
      log('💥 Some tests failed. Check the errors above for details.', 'error');
    }

    // Return results for further analysis
    return {
      sessionId,
      gameId,
      recordedEvents,
      teamPoints,
      opponentPoints,
      results
    };

  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();



