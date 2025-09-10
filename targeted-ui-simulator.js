// Targeted UI Simulator - Handles player selection and actual stat clicking
// Copy and paste this into your browser console while on the live stat tracker page

(async function targetedUISimulator() {
  console.log('🎯 Starting Targeted UI Simulator');
  console.log('==================================');
  
  const results = [];
  let clickCount = 0;
  
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

  // Helper function to find and click player buttons
  async function findAndClickPlayerButtons() {
    // Look for player buttons (jersey numbers)
    const playerButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.match(/\d+/) && // Contains numbers
      btn.textContent.length < 10 && // Not too long
      btn.offsetParent !== null && // Visible
      !btn.textContent.toLowerCase().includes('start') &&
      !btn.textContent.toLowerCase().includes('stop') &&
      !btn.textContent.toLowerCase().includes('end') &&
      !btn.textContent.toLowerCase().includes('create') &&
      !btn.textContent.toLowerCase().includes('save') &&
      !btn.textContent.toLowerCase().includes('cancel')
    );

    if (playerButtons.length > 0) {
      log(`Found ${playerButtons.length} player buttons`, 'info');
      
      // List all player buttons
      playerButtons.forEach((btn, index) => {
        log(`Player ${index + 1}: "${btn.textContent.trim()}"`, 'info');
      });
      
      return playerButtons;
    } else {
      log('❌ No player buttons found', 'error');
      return [];
    }
  }

  // Helper function to find and click stat buttons
  async function findAndClickStatButtons(statType, maxClicks = 1) {
    // Look for buttons that might contain the stat type
    const allButtons = Array.from(document.querySelectorAll('button, div, span')).filter(btn => 
      btn.offsetParent !== null && // Visible
      btn.textContent && // Has text
      btn.textContent.toLowerCase().includes(statType.toLowerCase())
    );

    if (allButtons.length > 0) {
      log(`Found ${allButtons.length} "${statType}" buttons`, 'info');
      
      for (let i = 0; i < Math.min(maxClicks, allButtons.length); i++) {
        const button = allButtons[i];
        log(`Clicking "${statType}" button: ${button.textContent}`, 'info');
        simulateClick(button);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return true;
    }
    
    // Try alternative patterns
    const alternatives = {
      '2pt': ['2', 'two', 'field goal', 'fg', 'made', 'miss'],
      '3pt': ['3', 'three', '3-point', '3pt'],
      'ft': ['free throw', 'foul shot', 'ft'],
      'assist': ['assist', 'pass', 'ast'],
      'rebound': ['rebound', 'board', 'reb'],
      'steal': ['steal', 'stl'],
      'block': ['block', 'blk'],
      'turnover': ['turnover', 'to', 'tov']
    };

    const altNames = alternatives[statType.toLowerCase()] || [];
    for (const altName of altNames) {
      const altButtons = Array.from(document.querySelectorAll('button, div, span')).filter(btn => 
        btn.offsetParent !== null &&
        btn.textContent &&
        btn.textContent.toLowerCase().includes(altName)
      );
      
      if (altButtons.length > 0) {
        log(`Found ${altButtons.length} "${altName}" buttons (alternative for ${statType})`, 'info');
        
        for (let i = 0; i < Math.min(maxClicks, altButtons.length); i++) {
          const button = altButtons[i];
          log(`Clicking "${altName}" button: ${button.textContent}`, 'info');
          simulateClick(button);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        return true;
      }
    }
    
    return false;
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

    // Step 3: Look for event selector and select an event
    log('Step 3: Looking for event selector...');
    const selectElement = document.querySelector('.ant-select.ant-select-outlined');
    if (selectElement) {
      log('✅ Found event selector', 'success');
      
      // Click to open dropdown
      simulateClick(selectElement);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for dropdown options
      const options = document.querySelectorAll('.ant-select-item-option, .ant-select-item');
      if (options.length > 0) {
        log(`Found ${options.length} event options`, 'info');
        simulateClick(options[0]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        log('✅ Selected first event', 'success');
      } else {
        log('⚠️ No event options found', 'warning');
      }
    } else {
      log('❌ Event selector not found', 'error');
    }

    // Step 4: Look for start game button
    log('Step 4: Looking for start game button...');
    const startButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.toLowerCase().includes('start') ||
      btn.textContent.toLowerCase().includes('begin') ||
      btn.textContent.toLowerCase().includes('play')
    );

    if (startButtons.length > 0) {
      log(`Found ${startButtons.length} start buttons`, 'info');
      simulateClick(startButtons[0]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      log('✅ Clicked start game button', 'success');
    } else {
      log('⚠️ No start game button found', 'warning');
    }

    // Step 5: Find and select players
    log('Step 5: Looking for player buttons...');
    const playerButtons = await findAndClickPlayerButtons();
    
    if (playerButtons.length === 0) {
      log('❌ No players found - cannot proceed with stat simulation', 'error');
      throw new Error('No players found');
    }

    // Step 6: Simulate realistic game clicking with player selection
    log('Step 6: Starting realistic game simulation with player selection...');
    
    // Define realistic game sequences
    const gameSequences = [
      { action: '2pt', count: 8, delay: 500 },
      { action: '3pt', count: 4, delay: 600 },
      { action: 'ft', count: 6, delay: 300 },
      { action: 'assist', count: 5, delay: 400 },
      { action: 'rebound', count: 8, delay: 350 },
      { action: 'steal', count: 3, delay: 450 },
      { action: 'block', count: 2, delay: 500 },
      { action: 'turnover', count: 4, delay: 400 },
    ];

    // Execute game sequences
    for (const sequence of gameSequences) {
      log(`Executing sequence: ${sequence.action} (${sequence.count} times)`, 'info');
      
      for (let i = 0; i < sequence.count; i++) {
        // First select a random player
        const randomPlayer = playerButtons[Math.floor(Math.random() * playerButtons.length)];
        log(`Selecting player: ${randomPlayer.textContent}`, 'info');
        simulateClick(randomPlayer);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Then try to click the stat button
        const clicked = await findAndClickStatButtons(sequence.action, 1);
        if (!clicked) {
          log(`⚠️ Could not find button for ${sequence.action}`, 'warning');
        }
        
        await new Promise(resolve => setTimeout(resolve, sequence.delay));
      }
    }

    // Step 7: Look for opponent buttons and click them
    log('Step 7: Looking for opponent buttons...');
    const opponentButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.toLowerCase().includes('opponent') ||
      btn.textContent.toLowerCase().includes('away') ||
      btn.textContent.toLowerCase().includes('visitor') ||
      btn.textContent.toLowerCase().includes('opp')
    );

    if (opponentButtons.length > 0) {
      log(`Found ${opponentButtons.length} opponent buttons`, 'info');
      
      // Click opponent buttons for some events
      const opponentSequences = [
        { action: '2pt', count: 5 },
        { action: '3pt', count: 2 },
        { action: 'ft', count: 3 },
        { action: 'assist', count: 3 },
        { action: 'rebound', count: 4 }
      ];

      for (const sequence of opponentSequences) {
        for (let i = 0; i < sequence.count; i++) {
          // Try to find opponent-specific buttons
          const oppButtons = opponentButtons.filter(btn => 
            btn.textContent.toLowerCase().includes(sequence.action.toLowerCase())
          );
          
          if (oppButtons.length > 0) {
            simulateClick(oppButtons[0]);
            await new Promise(resolve => setTimeout(resolve, 400));
          } else {
            // Try alternative approach - click any opponent button
            const randomOppButton = opponentButtons[Math.floor(Math.random() * opponentButtons.length)];
            simulateClick(randomOppButton);
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
      }
      
      log('✅ Clicked opponent buttons', 'success');
    } else {
      log('⚠️ No opponent buttons found', 'warning');
    }

    // Step 8: Check for score display
    log('Step 8: Looking for score display...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const scoreElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('HOME') && el.textContent.includes('OPP')
    );

    if (scoreElements.length > 0) {
      log(`✅ Found score display: ${scoreElements[0].textContent}`, 'success');
    } else {
      log('⚠️ No score display found', 'warning');
    }

    // Step 9: Check for play-by-play
    log('Step 9: Looking for play-by-play...');
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
      playByPlayElements.slice(0, 5).forEach((el, index) => {
        log(`Play-by-play ${index + 1}: "${el.textContent.trim()}"`, 'info');
      });
    } else {
      log('⚠️ No play-by-play found', 'warning');
    }

    // Step 10: Debug - List all available buttons
    log('Step 10: Debugging - Listing all available buttons...');
    const allButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.offsetParent !== null && // Visible
      btn.textContent.trim() // Has text
    );

    log(`Found ${allButtons.length} total visible buttons:`, 'info');
    allButtons.forEach((btn, index) => {
      log(`Button ${index + 1}: "${btn.textContent.trim()}"`, 'info');
    });

    // Summary
    log('📊 TARGETED UI SIMULATION SUMMARY', 'info');
    log('==================================', 'info');
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.type === 'success').length;
    const failedSteps = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total clicks performed: ${clickCount}`, 'info');
    log(`Total checks: ${totalSteps}`, 'info');
    log(`✅ Passed: ${passedSteps}`, 'success');
    log(`❌ Failed: ${failedSteps}`, failedSteps > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedSteps === 0) {
      log('🎉 Targeted UI simulation completed successfully!', 'success');
      log('Check the live stat tracker UI to see the results of all the clicking.', 'info');
    } else {
      log('💥 Some steps failed. Check the errors above for details.', 'error');
    }

    return {
      totalClicks: clickCount,
      totalSteps,
      passedSteps,
      failedSteps,
      warnings,
      playerButtons: playerButtons.length,
      results
    };

  } catch (error) {
    log(`💥 Targeted UI simulation failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();
