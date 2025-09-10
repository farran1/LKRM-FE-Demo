// Simple Stat Clicker - Assumes players are already selected
// Copy and paste this into your browser console while on the live stat tracker page
// AFTER you have manually selected your players

(async function simpleStatClicker() {
  console.log('🏀 Starting Simple Stat Clicker');
  console.log('===============================');
  console.log('⚠️ Make sure you have already selected your players!');
  
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

  // Helper function to find and click stat buttons
  async function findAndClickStatButtons(statType, maxClicks = 1) {
    // Look for buttons that might contain the stat type
    const allButtons = Array.from(document.querySelectorAll('button, div, span, a')).filter(btn => 
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
      const altButtons = Array.from(document.querySelectorAll('button, div, span, a')).filter(btn => 
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    log('✅ Page loaded', 'success');

    // Step 3: Debug - List all available clickable elements
    log('Step 3: Debugging - Listing all available clickable elements...');
    const allClickable = Array.from(document.querySelectorAll('button, div, span, a')).filter(btn => 
      btn.offsetParent !== null && // Visible
      btn.textContent && // Has text
      btn.textContent.trim().length > 0 && // Not empty
      btn.textContent.trim().length < 50 // Not too long
    );

    log(`Found ${allClickable.length} total clickable elements:`, 'info');
    allClickable.forEach((btn, index) => {
      log(`Element ${index + 1}: "${btn.textContent.trim()}" (${btn.tagName})`, 'info');
    });

    // Step 4: Simulate realistic game clicking
    log('Step 4: Starting realistic game simulation...');
    
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
        const clicked = await findAndClickStatButtons(sequence.action, 1);
        if (!clicked) {
          log(`⚠️ Could not find button for ${sequence.action}`, 'warning');
        }
        
        await new Promise(resolve => setTimeout(resolve, sequence.delay));
      }
    }

    // Step 5: Look for opponent buttons and click them
    log('Step 5: Looking for opponent buttons...');
    const opponentButtons = Array.from(document.querySelectorAll('button, div, span, a')).filter(btn => 
      btn.offsetParent !== null &&
      btn.textContent &&
      (btn.textContent.toLowerCase().includes('opponent') ||
       btn.textContent.toLowerCase().includes('away') ||
       btn.textContent.toLowerCase().includes('visitor') ||
       btn.textContent.toLowerCase().includes('opp'))
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

    // Step 6: Check for score display
    log('Step 6: Looking for score display...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const scoreElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('HOME') && el.textContent.includes('OPP')
    );

    if (scoreElements.length > 0) {
      log(`✅ Found score display: ${scoreElements[0].textContent}`, 'success');
    } else {
      log('⚠️ No score display found', 'warning');
    }

    // Step 7: Check for play-by-play
    log('Step 7: Looking for play-by-play...');
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

    // Summary
    log('📊 SIMPLE STAT CLICKER SUMMARY', 'info');
    log('==============================', 'info');
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
      log('🎉 Simple stat clicker completed successfully!', 'success');
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
      results
    };

  } catch (error) {
    log(`💥 Simple stat clicker failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();
