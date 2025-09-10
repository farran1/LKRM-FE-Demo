// Live Stat Tracker Test - For when you're already on the tracker page
// Copy and paste this into your browser console while on the live stat tracker page

(async function trackerTest() {
  console.log('🏀 Starting Live Stat Tracker Test');
  console.log('==================================');
  
  const results = [];
  
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

  try {
    // Step 1: Check if we're on the tracker page
    log('Step 1: Checking if we\'re on the tracker page...');
    if (!window.location.href.includes('live-stat-tracker')) {
      throw new Error('Please navigate to the live stat tracker page first');
    }
    log('✅ On live stat tracker page', 'success');

    // Step 2: Wait for page to load
    log('Step 2: Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    log('✅ Page loaded', 'success');

    // Step 3: Look for player buttons (jersey numbers)
    log('Step 3: Looking for player buttons...');
    const allButtons = document.querySelectorAll('button');
    const playerButtons = Array.from(allButtons).filter(btn => 
      btn.textContent.match(/\d+/) && // Contains numbers
      btn.textContent.length < 10 && // Not too long
      !btn.textContent.toLowerCase().includes('start') &&
      !btn.textContent.toLowerCase().includes('stop') &&
      !btn.textContent.toLowerCase().includes('end') &&
      !btn.textContent.toLowerCase().includes('create') &&
      !btn.textContent.toLowerCase().includes('save') &&
      !btn.textContent.toLowerCase().includes('cancel')
    );

    if (playerButtons.length > 0) {
      log(`✅ Found ${playerButtons.length} player buttons`, 'success');
      
      // List the player buttons
      playerButtons.forEach((btn, index) => {
        log(`Player ${index}: "${btn.textContent.trim()}"`, 'info');
      });
    } else {
      log('❌ No player buttons found', 'error');
      log('Available buttons:', 'info');
      allButtons.forEach((btn, index) => {
        if (btn.textContent.trim()) {
          log(`Button ${index}: "${btn.textContent.trim()}"`, 'info');
        }
      });
      throw new Error('No player buttons found');
    }

    // Step 4: Look for stat tracking buttons (2PT, 3PT, FT, etc.)
    log('Step 4: Looking for stat tracking buttons...');
    const statButtons = Array.from(allButtons).filter(btn => 
      btn.textContent.toLowerCase().includes('2pt') ||
      btn.textContent.toLowerCase().includes('3pt') ||
      btn.textContent.toLowerCase().includes('ft') ||
      btn.textContent.toLowerCase().includes('assist') ||
      btn.textContent.toLowerCase().includes('rebound') ||
      btn.textContent.toLowerCase().includes('steal') ||
      btn.textContent.toLowerCase().includes('block') ||
      btn.textContent.toLowerCase().includes('turnover') ||
      btn.textContent.toLowerCase().includes('made') ||
      btn.textContent.toLowerCase().includes('miss')
    );

    if (statButtons.length > 0) {
      log(`✅ Found ${statButtons.length} stat tracking buttons`, 'success');
      
      // List the stat buttons
      statButtons.forEach((btn, index) => {
        log(`Stat ${index}: "${btn.textContent.trim()}"`, 'info');
      });
    } else {
      log('⚠️ No stat tracking buttons found', 'warning');
    }

    // Step 5: Look for opponent buttons
    log('Step 5: Looking for opponent buttons...');
    const opponentButtons = Array.from(allButtons).filter(btn => 
      btn.textContent.toLowerCase().includes('opponent') ||
      btn.textContent.toLowerCase().includes('away') ||
      btn.textContent.toLowerCase().includes('visitor') ||
      btn.textContent.toLowerCase().includes('opp')
    );

    if (opponentButtons.length > 0) {
      log(`✅ Found ${opponentButtons.length} opponent buttons`, 'success');
      
      // List the opponent buttons
      opponentButtons.forEach((btn, index) => {
        log(`Opponent ${index}: "${btn.textContent.trim()}"`, 'info');
      });
    } else {
      log('⚠️ No opponent buttons found', 'warning');
    }

    // Step 6: Simulate some stat tracking
    log('Step 6: Simulating stat tracking...');
    
    // Click on a few player buttons
    for (let i = 0; i < Math.min(3, playerButtons.length); i++) {
      const button = playerButtons[i];
      log(`Clicking player button: ${button.textContent}`, 'info');
      simulateClick(button);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    log('✅ Simulated player button clicks', 'success');

    // Click on stat buttons if available
    if (statButtons.length > 0) {
      for (let i = 0; i < Math.min(2, statButtons.length); i++) {
        const button = statButtons[i];
        log(`Clicking stat button: ${button.textContent}`, 'info');
        simulateClick(button);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      log('✅ Simulated stat button clicks', 'success');
    }

    // Click on opponent buttons if available
    if (opponentButtons.length > 0) {
      for (let i = 0; i < Math.min(2, opponentButtons.length); i++) {
        const button = opponentButtons[i];
        log(`Clicking opponent button: ${button.textContent}`, 'info');
        simulateClick(button);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      log('✅ Simulated opponent button clicks', 'success');
    }

    // Step 7: Check for score display
    log('Step 7: Looking for score display...');
    const scoreElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('HOME') && el.textContent.includes('OPP')
    );

    if (scoreElements.length > 0) {
      log(`✅ Found score display: ${scoreElements[0].textContent}`, 'success');
    } else {
      log('⚠️ No score display found', 'warning');
    }

    // Step 8: Check for play-by-play
    log('Step 8: Looking for play-by-play...');
    const playByPlayElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && (
        el.textContent.includes('Player') ||
        el.textContent.includes('Assist') ||
        el.textContent.includes('Made') ||
        el.textContent.includes('Miss') ||
        el.textContent.includes('Rebound')
      )
    );

    if (playByPlayElements.length > 0) {
      log(`✅ Found play-by-play elements`, 'success');
      playByPlayElements.slice(0, 3).forEach((el, index) => {
        log(`Play-by-play ${index}: "${el.textContent.trim()}"`, 'info');
      });
    } else {
      log('⚠️ No play-by-play found', 'warning');
    }

    // Step 9: Test API directly
    log('Step 9: Testing API directly...');
    try {
      const testResponse = await fetch('/api/live-stat-tracker?type=session&sessionKey=test');
      const testData = await testResponse.json();
      
      if (testResponse.ok) {
        log('✅ API is responding', 'success');
      } else {
        log(`❌ API error: ${testData.error}`, 'error');
      }
    } catch (error) {
      log(`❌ API test failed: ${error.message}`, 'error');
    }

    // Summary
    log('📊 TRACKER TEST SUMMARY', 'info');
    log('========================', 'info');
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.type === 'success').length;
    const failedSteps = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total checks: ${totalSteps}`, 'info');
    log(`✅ Passed: ${passedSteps}`, 'success');
    log(`❌ Failed: ${failedSteps}`, failedSteps > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedSteps === 0) {
      log('🎉 Tracker test completed successfully!', 'success');
    } else {
      log('💥 Some tests failed. Check the errors above for details.', 'error');
    }

    return {
      totalSteps,
      passedSteps,
      failedSteps,
      warnings,
      playerButtons: playerButtons.length,
      statButtons: statButtons.length,
      opponentButtons: opponentButtons.length,
      results
    };

  } catch (error) {
    log(`💥 Tracker test failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();
