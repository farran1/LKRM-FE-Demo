// UI Click Simulator - Actually clicks buttons on the live stat tracker
// Copy and paste this into your browser console while on the live stat tracker page

(async function uiClickSimulator() {
  console.log('🖱️ Starting UI Click Simulator');
  console.log('===============================');
  
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

  // Helper function to find and click buttons
  async function findAndClickButtons(buttonText, maxClicks = 3) {
    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.toLowerCase().includes(buttonText.toLowerCase()) &&
      btn.offsetParent !== null // Only visible buttons
    );
    
    if (buttons.length > 0) {
      log(`Found ${buttons.length} "${buttonText}" buttons`, 'info');
      
      for (let i = 0; i < Math.min(maxClicks, buttons.length); i++) {
        const button = buttons[i];
        log(`Clicking "${buttonText}" button: ${button.textContent}`, 'info');
        simulateClick(button);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      return true;
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

    // Step 5: Simulate realistic game clicking
    log('Step 5: Starting realistic game simulation...');
    
    // Define realistic game sequences
    const gameSequences = [
      // Sequence 1: Field goals
      { action: '2PT Made', count: 8, delay: 500 },
      { action: '2PT Miss', count: 3, delay: 400 },
      { action: '3PT Made', count: 4, delay: 600 },
      { action: '3PT Miss', count: 2, delay: 500 },
      
      // Sequence 2: Free throws
      { action: 'FT Made', count: 6, delay: 300 },
      { action: 'FT Miss', count: 1, delay: 300 },
      
      // Sequence 3: Other stats
      { action: 'Assist', count: 5, delay: 400 },
      { action: 'Rebound', count: 8, delay: 350 },
      { action: 'Steal', count: 3, delay: 450 },
      { action: 'Block', count: 2, delay: 500 },
      { action: 'Turnover', count: 4, delay: 400 },
      
      // Sequence 4: More field goals
      { action: '2PT Made', count: 6, delay: 500 },
      { action: '3PT Made', count: 3, delay: 600 },
      { action: '2PT Miss', count: 4, delay: 400 },
      
      // Sequence 5: Final stats
      { action: 'Assist', count: 3, delay: 400 },
      { action: 'Rebound', count: 5, delay: 350 },
      { action: 'FT Made', count: 4, delay: 300 },
    ];

    // Execute game sequences
    for (const sequence of gameSequences) {
      log(`Executing sequence: ${sequence.action} (${sequence.count} times)`, 'info');
      
      for (let i = 0; i < sequence.count; i++) {
        const clicked = await findAndClickButtons(sequence.action, 1);
        if (!clicked) {
          // Try alternative button names
          const alternatives = {
            '2PT Made': ['2pt', 'two', 'field goal', 'fg'],
            '2PT Miss': ['2pt miss', 'two miss', 'field goal miss', 'fg miss'],
            '3PT Made': ['3pt', 'three', '3-point'],
            '3PT Miss': ['3pt miss', 'three miss', '3-point miss'],
            'FT Made': ['ft', 'free throw', 'foul shot'],
            'FT Miss': ['ft miss', 'free throw miss', 'foul shot miss'],
            'Assist': ['assist', 'pass'],
            'Rebound': ['rebound', 'board'],
            'Steal': ['steal', 'takeaway'],
            'Block': ['block', 'rejection'],
            'Turnover': ['turnover', 'to']
          };
          
          const altNames = alternatives[sequence.action] || [];
          let found = false;
          
          for (const altName of altNames) {
            if (await findAndClickButtons(altName, 1)) {
              found = true;
              break;
            }
          }
          
          if (!found) {
            log(`⚠️ Could not find button for ${sequence.action}`, 'warning');
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, sequence.delay));
      }
    }

    // Step 6: Look for opponent buttons and click them
    log('Step 6: Looking for opponent buttons...');
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
        { action: '2PT Made', count: 5 },
        { action: '3PT Made', count: 2 },
        { action: 'FT Made', count: 3 },
        { action: 'Assist', count: 3 },
        { action: 'Rebound', count: 4 }
      ];

      for (const sequence of opponentSequences) {
        for (let i = 0; i < sequence.count; i++) {
          // Try to find opponent-specific buttons
          const oppButtons = opponentButtons.filter(btn => 
            btn.textContent.toLowerCase().includes(sequence.action.toLowerCase().split(' ')[0])
          );
          
          if (oppButtons.length > 0) {
            simulateClick(oppButtons[0]);
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
      }
      
      log('✅ Clicked opponent buttons', 'success');
    } else {
      log('⚠️ No opponent buttons found', 'warning');
    }

    // Step 7: Check for score display
    log('Step 7: Looking for score display...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
      playByPlayElements.slice(0, 5).forEach((el, index) => {
        log(`Play-by-play ${index + 1}: "${el.textContent.trim()}"`, 'info');
      });
    } else {
      log('⚠️ No play-by-play found', 'warning');
    }

    // Step 9: Look for any remaining clickable buttons
    log('Step 9: Looking for any remaining clickable buttons...');
    const allButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.offsetParent !== null && // Visible
      btn.textContent.trim() && // Has text
      !btn.textContent.toLowerCase().includes('start') &&
      !btn.textContent.toLowerCase().includes('stop') &&
      !btn.textContent.toLowerCase().includes('end') &&
      !btn.textContent.toLowerCase().includes('create')
    );

    if (allButtons.length > 0) {
      log(`Found ${allButtons.length} additional clickable buttons`, 'info');
      
      // Click a few more random buttons
      for (let i = 0; i < Math.min(5, allButtons.length); i++) {
        const randomButton = allButtons[Math.floor(Math.random() * allButtons.length)];
        log(`Clicking random button: ${randomButton.textContent}`, 'info');
        simulateClick(randomButton);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Summary
    log('📊 UI CLICK SIMULATION SUMMARY', 'info');
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
      log('🎉 UI click simulation completed successfully!', 'success');
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
    log(`💥 UI click simulation failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();
