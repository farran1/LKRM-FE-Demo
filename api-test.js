// Simple API Test - Test the fixed API
// Copy and paste this into your browser console

(async function apiTest() {
  console.log('🔧 Testing Fixed API');
  console.log('===================');
  
  const results = [];
  
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    results.push({ timestamp, type, message });
  }

  try {
    // Test 1: Test the session endpoint with non-existent session
    log('Test 1: Testing session endpoint with non-existent session...');
    const sessionResponse = await fetch('/api/live-stat-tracker?type=session&sessionKey=test');
    const sessionData = await sessionResponse.json();
    
    if (sessionResponse.ok) {
      log('✅ API is now responding correctly', 'success');
      log(`Response: ${JSON.stringify(sessionData)}`, 'info');
    } else {
      log(`❌ API still has issues: ${sessionData.error}`, 'error');
    }

    // Test 2: Create a real session
    log('Test 2: Creating a real session...');
    const createSessionResponse = await fetch('/api/live-stat-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-session',
        data: {
          eventId: 16,
          sessionKey: `api_test_${Date.now()}`,
          gameState: {
            quarter: 1,
            homeScore: 0,
            awayScore: 0,
            opponentScore: 0,
            isPlaying: false
          },
          createdBy: 1
        }
      })
    });

    const createSessionData = await createSessionResponse.json();
    
    if (createSessionData.success) {
      log('✅ Session created successfully', 'success');
      log(`Session ID: ${createSessionData.data.id}`, 'info');
      log(`Game ID: ${createSessionData.data.game_id}`, 'info');
      
      // Test 3: Record an event
      log('Test 3: Recording an event...');
      const eventResponse = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-event',
          data: {
            sessionId: createSessionData.data.id,
            playerId: 18,
            eventType: 'fg_made',
            eventValue: 2,
            quarter: 1,
            gameTime: 0,
            isOpponentEvent: false,
            opponentJersey: null,
            metadata: {}
          }
        })
      });

      const eventData = await eventResponse.json();
      
      if (eventData.success) {
        log('✅ Event recorded successfully', 'success');
        log(`Event ID: ${eventData.data.id}`, 'info');
        log(`Event game_id: ${eventData.data.game_id}`, 'info');
      } else {
        log(`❌ Event recording failed: ${eventData.error}`, 'error');
      }
    } else {
      log(`❌ Session creation failed: ${createSessionData.error}`, 'error');
    }

    // Summary
    log('📊 API TEST SUMMARY', 'info');
    log('===================', 'info');
    const totalTests = results.length;
    const passedTests = results.filter(r => r.type === 'success').length;
    const failedTests = results.filter(r => r.type === 'error').length;
    
    log(`Total tests: ${totalTests}`, 'info');
    log(`✅ Passed: ${passedTests}`, 'success');
    log(`❌ Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'info');

    if (failedTests === 0) {
      log('🎉 API is working correctly!', 'success');
    } else {
      log('💥 API still has issues.', 'error');
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      results
    };

  } catch (error) {
    log(`💥 API test failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();



