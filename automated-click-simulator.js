// Automated Click Simulator for Live Stats Tracker
// Copy and paste this into your browser console while on the live stat tracker page

(async function automatedClickSimulator() {
  console.log('🤖 Starting Automated Click Simulator');
  console.log('=====================================');
  
  const results = [];
  
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    results.push({ timestamp, type, message });
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

  // Helper function to simulate a click
  function simulateClick(element) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  }

  // Helper function to simulate typing
  function simulateTyping(element, text) {
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  try {
    // Step 1: Navigate to live stat tracker if not already there
    log('Step 1: Checking current page...');
    if (!window.location.href.includes('live-stat-tracker')) {
      log('Navigating to live stat tracker...', 'info');
      window.location.href = '/live-stat-tracker';
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    log('✅ On live stat tracker page', 'success');

    // Step 2: Wait for page to load
    log('Step 2: Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    log('✅ Page loaded', 'success');

    // Step 3: Look for event selector dropdown
    log('Step 3: Looking for event selector...');
    let eventSelector;
    try {
      eventSelector = await waitForElement('.ant-select-selector', 10000);
      log('✅ Found event selector dropdown', 'success');
    } catch (error) {
      log('❌ Could not find event selector dropdown', 'error');
      throw error;
    }

    // Step 4: Click on event selector to open dropdown
    log('Step 4: Opening event selector dropdown...');
    simulateClick(eventSelector);
    await new Promise(resolve => setTimeout(resolve, 1000));
    log('✅ Clicked event selector', 'success');

    // Step 5: Look for dropdown options
    log('Step 5: Looking for dropdown options...');
    let dropdownOptions;
    try {
      dropdownOptions = await waitForElement('.ant-select-item-option', 5000);
      log('✅ Found dropdown options', 'success');
    } catch (error) {
      log('❌ Could not find dropdown options', 'error');
      throw error;
    }

    // Step 6: Click on first available option
    log('Step 6: Selecting first event option...');
    const firstOption = document.querySelector('.ant-select-item-option');
    if (firstOption) {
      simulateClick(firstOption);
      await new Promise(resolve => setTimeout(resolve, 2000));
      log('✅ Selected first event option', 'success');
    } else {
      log('❌ No options available in dropdown', 'error');
      throw new Error('No options available');
    }

    // Step 7: Look for "Start Game" or similar button
    log('Step 7: Looking for start game button...');
    let startButton;
    try {
      // Try multiple possible selectors for start button
      const possibleSelectors = [
        'button[type="button"]',
        '.ant-btn',
        'button:contains("Start")',
        'button:contains("Begin")',
        'button:contains("Play")'
      ];
      
      for (const selector of possibleSelectors) {
        const buttons = document.querySelectorAll(selector);
        for (const button of buttons) {
          if (button.textContent.toLowerCase().includes('start') || 
              button.textContent.toLowerCase().includes('begin') ||
              button.textContent.toLowerCase().includes('play')) {
            startButton = button;
            break;
          }
        }
        if (startButton) break;
      }

      if (!startButton) {
        // If no specific start button found, look for any button
        startButton = document.querySelector('button[type="button"]');
      }

      if (startButton) {
        log('✅ Found start game button', 'success');
      } else {
        log('❌ Could not find start game button', 'error');
        throw new Error('Start button not found');
      }
    } catch (error) {
      log('❌ Error finding start button: ' + error.message, 'error');
      throw error;
    }

    // Step 8: Click start game button
    log('Step 8: Starting the game...');
    simulateClick(startButton);
    await new Promise(resolve => setTimeout(resolve, 2000));
    log('✅ Clicked start game button', 'success');

    // Step 9: Look for player buttons or stat tracking interface
    log('Step 9: Looking for player buttons...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const playerButtons = document.querySelectorAll('button');
    const playerButtonsArray = Array.from(playerButtons).filter(btn => 
      btn.textContent.match(/\d+/) && // Contains numbers (jersey numbers)
      btn.textContent.length < 10 && // Not too long
      !btn.textContent.toLowerCase().includes('start') &&
      !btn.textContent.toLowerCase().includes('stop') &&
      !btn.textContent.toLowerCase().includes('end')
    );

    if (playerButtonsArray.length > 0) {
      log(`✅ Found ${playerButtonsArray.length} potential player buttons`, 'success');
      
      // Step 10: Click on a few player buttons to simulate events
      log('Step 10: Simulating player events...');
      for (let i = 0; i < Math.min(3, playerButtonsArray.length); i++) {
        const button = playerButtonsArray[i];
        log(`Clicking player button: ${button.textContent}`, 'info');
        simulateClick(button);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      log('✅ Simulated player events', 'success');
    } else {
      log('⚠️ No player buttons found - may need to look for different interface', 'warning');
    }

    // Step 11: Look for opponent event buttons
    log('Step 11: Looking for opponent event buttons...');
    const opponentButtons = document.querySelectorAll('button');
    const opponentButtonsArray = Array.from(opponentButtons).filter(btn => 
      btn.textContent.toLowerCase().includes('opponent') ||
      btn.textContent.toLowerCase().includes('away') ||
      btn.textContent.toLowerCase().includes('visitor')
    );

    if (opponentButtonsArray.length > 0) {
      log(`✅ Found ${opponentButtonsArray.length} opponent buttons`, 'success');
      
      // Click on opponent buttons
      for (let i = 0; i < Math.min(2, opponentButtonsArray.length); i++) {
        const button = opponentButtonsArray[i];
        log(`Clicking opponent button: ${button.textContent}`, 'info');
        simulateClick(button);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      log('✅ Simulated opponent events', 'success');
    } else {
      log('⚠️ No opponent buttons found', 'warning');
    }

    // Step 12: Check for score display
    log('Step 12: Looking for score display...');
    const scoreElements = document.querySelectorAll('*');
    const scoreTexts = Array.from(scoreElements).map(el => el.textContent).filter(text => 
      text.includes('HOME') && text.includes('OPP') && text.includes('-')
    );

    if (scoreTexts.length > 0) {
      log(`✅ Found score display: ${scoreTexts[0]}`, 'success');
    } else {
      log('⚠️ No score display found', 'warning');
    }

    // Step 13: Test the API directly
    log('Step 13: Testing API directly...');
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
    log('📊 AUTOMATED SIMULATION SUMMARY', 'info');
    log('===============================', 'info');
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.type === 'success').length;
    const failedSteps = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total steps: ${totalSteps}`, 'info');
    log(`✅ Passed: ${passedSteps}`, 'success');
    log(`❌ Failed: ${failedSteps}`, failedSteps > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedSteps === 0) {
      log('🎉 Automated simulation completed successfully!', 'success');
    } else {
      log('💥 Some steps failed. Check the errors above for details.', 'error');
    }

    return {
      totalSteps,
      passedSteps,
      failedSteps,
      warnings,
      results
    };

  } catch (error) {
    log(`💥 Automated simulation failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();
