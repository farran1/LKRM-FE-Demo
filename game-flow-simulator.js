// Game Flow Simulator - Clicks player then action in proper sequence
// Copy and paste this into your browser console while on the live stat tracker page

(async function gameFlowSimulator() {
  console.log('🏀 Starting Game Flow Simulator');
  console.log('===============================');
  console.log('This will simulate: Player Click → Action Click → Repeat');
  
  const results = [];
  let clickCount = 0;
  let eventCount = 0;
  
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
    clickCount++;
  }

  // Helper function to find player buttons (jersey numbers)
  function findPlayerButtons() {
    const playerButtons = Array.from(document.querySelectorAll('button, div, span')).filter(btn => 
      btn.offsetParent !== null && // Visible
      btn.textContent && // Has text
      btn.textContent.match(/^\d+$/) && // Only numbers
      btn.textContent.length <= 2 && // 1-2 digits (jersey numbers)
      !btn.textContent.includes('.')
    );
    
    return playerButtons;
  }

  // Helper function to find action buttons
  function findActionButtons() {
    const actionButtons = Array.from(document.querySelectorAll('button, div, span')).filter(btn => 
      btn.offsetParent !== null && // Visible
      btn.textContent && // Has text
      (btn.textContent.toLowerCase().includes('2pt') ||
       btn.textContent.toLowerCase().includes('3pt') ||
       btn.textContent.toLowerCase().includes('ft') ||
       btn.textContent.toLowerCase().includes('assist') ||
       btn.textContent.toLowerCase().includes('rebound') ||
       btn.textContent.toLowerCase().includes('steal') ||
       btn.textContent.toLowerCase().includes('block') ||
       btn.textContent.toLowerCase().includes('turnover') ||
       btn.textContent.toLowerCase().includes('made') ||
       btn.textContent.toLowerCase().includes('miss'))
    );
    
    return actionButtons;
  }

  // Helper function to simulate a game event
  async function simulateGameEvent(playerButton, actionButton, eventType) {
    eventCount++;
    const playerNumber = playerButton.textContent.trim();
    const actionText = actionButton.textContent.trim();
    
    log(`🏀 Event ${eventCount}: Player ${playerNumber} → ${actionText}`, 'info');
    
    // Step 1: Click the player
    log(`  Step 1: Clicking Player ${playerNumber}`, 'info');
    simulateClick(playerButton);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 2: Click the action
    log(`  Step 2: Clicking ${actionText}`, 'info');
    simulateClick(actionButton);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    log(`  ✅ Completed: Player ${playerNumber} ${actionText}`, 'success');
    
    return `Player ${playerNumber} ${actionText}`;
  }

  // Helper function to simulate opponent event
  async function simulateOpponentEvent(actionText) {
    eventCount++;
    
    log(`🏀 Event ${eventCount}: Opponent → ${actionText}`, 'info');
    
    // Look for opponent buttons
    const opponentButtons = Array.from(document.querySelectorAll('button, div, span')).filter(btn => 
      btn.offsetParent !== null &&
      btn.textContent &&
      (btn.textContent.toLowerCase().includes('opponent') ||
       btn.textContent.toLowerCase().includes('away') ||
       btn.textContent.toLowerCase().includes('opp'))
    );
    
    if (opponentButtons.length > 0) {
      log(`  Step 1: Clicking Opponent button`, 'info');
      simulateClick(opponentButtons[0]);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Look for action button
      const actionButtons = Array.from(document.querySelectorAll('button, div, span')).filter(btn => 
        btn.offsetParent !== null &&
        btn.textContent &&
        btn.textContent.toLowerCase().includes(actionText.toLowerCase())
      );
      
      if (actionButtons.length > 0) {
        log(`  Step 2: Clicking ${actionText}`, 'info');
        simulateClick(actionButtons[0]);
        await new Promise(resolve => setTimeout(resolve, 500));
        log(`  ✅ Completed: Opponent ${actionText}`, 'success');
        return `Opponent ${actionText}`;
      } else {
        log(`  ❌ Could not find ${actionText} button`, 'error');
        return null;
      }
    } else {
      log(`  ❌ Could not find Opponent button`, 'error');
      return null;
    }
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

    // Step 3: Find available players
    log('Step 3: Finding available players...');
    const playerButtons = findPlayerButtons();
    
    if (playerButtons.length === 0) {
      throw new Error('No player buttons found! Make sure players are selected.');
    }
    
    log(`✅ Found ${playerButtons.length} player buttons:`, 'success');
    playerButtons.forEach((btn, index) => {
      log(`  Player ${index + 1}: #${btn.textContent.trim()}`, 'info');
    });

    // Step 4: Find available actions
    log('Step 4: Finding available actions...');
    const actionButtons = findActionButtons();
    
    if (actionButtons.length === 0) {
      throw new Error('No action buttons found! Make sure the game is started.');
    }
    
    log(`✅ Found ${actionButtons.length} action buttons:`, 'success');
    actionButtons.forEach((btn, index) => {
      log(`  Action ${index + 1}: ${btn.textContent.trim()}`, 'info');
    });

    // Step 5: Simulate realistic game events
    log('Step 5: Starting realistic game simulation...');
    
    const gameEvents = [];
    
    // Define realistic game scenarios
    const scenarios = [
      // Quarter 1
      { player: 0, action: '2pt made', quarter: 1 },
      { player: 1, action: 'assist', quarter: 1 },
      { type: 'opponent', action: '2pt made', quarter: 1 },
      { player: 2, action: 'rebound', quarter: 1 },
      { player: 0, action: '3pt made', quarter: 1 },
      { player: 2, action: 'steal', quarter: 1 },
      { player: 1, action: '2pt made', quarter: 1 },
      { type: 'opponent', action: 'ft made', quarter: 1 },
      { player: 0, action: 'block', quarter: 1 },
      { player: 1, action: 'ft made', quarter: 1 },
      
      // Quarter 2
      { player: 2, action: '2pt made', quarter: 2 },
      { player: 0, action: 'assist', quarter: 2 },
      { type: 'opponent', action: '3pt made', quarter: 2 },
      { player: 1, action: 'rebound', quarter: 2 },
      { player: 2, action: 'turnover', quarter: 2 },
      { type: 'opponent', action: '2pt made', quarter: 2 },
      { player: 0, action: '2pt made', quarter: 2 },
      { player: 1, action: 'steal', quarter: 2 },
      { player: 2, action: '3pt made', quarter: 2 },
      { player: 0, action: 'ft made', quarter: 2 },
    ];

    log(`📋 Executing ${scenarios.length} game scenarios:`, 'info');
    
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      
      log(`\n--- Scenario ${i + 1} (Q${scenario.quarter}) ---`, 'info');
      
      if (scenario.type === 'opponent') {
        // Opponent event
        const result = await simulateOpponentEvent(scenario.action);
        if (result) {
          gameEvents.push(result);
        }
      } else {
        // Player event
        const playerIndex = Math.min(scenario.player, playerButtons.length - 1);
        const playerButton = playerButtons[playerIndex];
        
        // Find action button that matches
        const actionButton = actionButtons.find(btn => 
          btn.textContent.toLowerCase().includes(scenario.action.toLowerCase())
        );
        
        if (actionButton) {
          const result = await simulateGameEvent(playerButton, actionButton, scenario.action);
          gameEvents.push(result);
        } else {
          log(`❌ Could not find action button for: ${scenario.action}`, 'error');
        }
      }
      
      // Wait between events
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Step 6: Check results
    log('Step 6: Checking results...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for score changes
    const scoreElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('HOME') && el.textContent.includes('OPP')
    );

    if (scoreElements.length > 0) {
      log(`✅ Final Score: ${scoreElements[0].textContent}`, 'success');
    } else {
      log('⚠️ No score display found', 'warning');
    }

    // Look for play-by-play
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
      log(`✅ Play-by-play updated with ${playByPlayElements.length} entries`, 'success');
      playByPlayElements.slice(-5).forEach((el, index) => {
        log(`  Recent ${index + 1}: ${el.textContent.trim()}`, 'info');
      });
    } else {
      log('⚠️ No play-by-play found', 'warning');
    }

    // Summary
    log('\n📊 GAME FLOW SIMULATION SUMMARY', 'info');
    log('================================', 'info');
    log(`🏀 Game Events Executed:`, 'info');
    gameEvents.forEach((event, index) => {
      log(`  ${index + 1}. ${event}`, 'info');
    });
    
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.type === 'success').length;
    const failedSteps = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`\nTotal clicks performed: ${clickCount}`, 'info');
    log(`Total game events: ${eventCount}`, 'info');
    log(`Successful events: ${gameEvents.length}`, 'info');
    log(`Total checks: ${totalSteps}`, 'info');
    log(`✅ Passed: ${passedSteps}`, 'success');
    log(`❌ Failed: ${failedSteps}`, failedSteps > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedSteps === 0) {
      log('🎉 Game flow simulation completed successfully!', 'success');
      log('Check your live stat tracker for all the recorded events!', 'info');
    } else {
      log('💥 Some events failed. Check the errors above for details.', 'error');
    }

    return {
      totalClicks: clickCount,
      totalEvents: eventCount,
      successfulEvents: gameEvents.length,
      gameEvents: gameEvents,
      totalSteps,
      passedSteps,
      failedSteps,
      warnings,
      results
    };

  } catch (error) {
    log(`💥 Game flow simulation failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();



