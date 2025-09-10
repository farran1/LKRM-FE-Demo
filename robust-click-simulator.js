// Robust Click Simulator - Handles different UI states
// Copy and paste this into your browser console

(async function robustClickSimulator() {
  console.log('🤖 Starting Robust Click Simulator');
  console.log('==================================');
  
  const results = [];
  
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    results.push({ timestamp, type, message });
  }

  // Helper function to wait for an element with multiple selectors
  function waitForElement(selectors, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
      
      for (const selector of selectorArray) {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
      }

      const observer = new MutationObserver((mutations, obs) => {
        for (const selector of selectorArray) {
          const element = document.querySelector(selector);
          if (element) {
            obs.disconnect();
            resolve(element);
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`None of the selectors ${selectorArray.join(', ')} found within ${timeout}ms`));
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

  try {
    // Step 1: Check current page
    log('Step 1: Checking current page...');
    if (!window.location.href.includes('live-stat-tracker')) {
      log('Navigating to live stat tracker...', 'info');
      window.location.href = '/live-stat-tracker';
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    log('✅ On live stat tracker page', 'success');

    // Step 2: Wait for page to load
    log('Step 2: Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    log('✅ Page loaded', 'success');

    // Step 3: Debug - List all available elements
    log('Step 3: Debugging - Listing available elements...');
    const allButtons = document.querySelectorAll('button');
    const allSelects = document.querySelectorAll('.ant-select, select');
    const allInputs = document.querySelectorAll('input');
    
    log(`Found ${allButtons.length} buttons`, 'info');
    log(`Found ${allSelects.length} select elements`, 'info');
    log(`Found ${allInputs.length} input elements`, 'info');
    
    // List button text content
    allButtons.forEach((btn, index) => {
      if (btn.textContent.trim()) {
        log(`Button ${index}: "${btn.textContent.trim()}"`, 'info');
      }
    });

    // Step 4: Look for event selector with multiple possible selectors
    log('Step 4: Looking for event selector...');
    let eventSelector;
    try {
      eventSelector = await waitForElement([
        '.ant-select-selector',
        '.ant-select',
        'select',
        '[role="combobox"]',
        '.ant-input'
      ], 10000);
      log('✅ Found event selector', 'success');
    } catch (error) {
      log('❌ Could not find event selector: ' + error.message, 'error');
      log('Available selectors on page:', 'info');
      document.querySelectorAll('*').forEach(el => {
        if (el.className && el.className.includes('select')) {
          log(`Found element with class: ${el.className}`, 'info');
        }
      });
      throw error;
    }

    // Step 5: Click on event selector
    log('Step 5: Clicking event selector...');
    simulateClick(eventSelector);
    await new Promise(resolve => setTimeout(resolve, 2000));
    log('✅ Clicked event selector', 'success');

    // Step 6: Look for dropdown options with multiple selectors
    log('Step 6: Looking for dropdown options...');
    let dropdownOptions;
    try {
      dropdownOptions = await waitForElement([
        '.ant-select-item-option',
        '.ant-select-item',
        '.ant-dropdown-menu-item',
        '.dropdown-item',
        '[role="option"]',
        '.option'
      ], 5000);
      log('✅ Found dropdown options', 'success');
    } catch (error) {
      log('❌ Could not find dropdown options: ' + error.message, 'error');
      
      // Debug: List all elements that might be dropdown options
      log('Debugging - Looking for potential dropdown elements:', 'info');
      const potentialOptions = document.querySelectorAll('*');
      potentialOptions.forEach(el => {
        if (el.textContent && el.textContent.length > 0 && el.textContent.length < 50) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            log(`Potential option: "${el.textContent.trim()}" (${el.tagName})`, 'info');
          }
        }
      });
      
      // Try to find any clickable elements
      const clickableElements = document.querySelectorAll('*');
      const clickableArray = Array.from(clickableElements).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               el.textContent && el.textContent.trim().length > 0 &&
               el.textContent.trim().length < 50;
      });
      
      log(`Found ${clickableArray.length} potentially clickable elements`, 'info');
      clickableArray.slice(0, 10).forEach((el, index) => {
        log(`Clickable ${index}: "${el.textContent.trim()}"`, 'info');
      });
      
      throw error;
    }

    // Step 7: Click on first available option
    log('Step 7: Selecting first event option...');
    const firstOption = document.querySelector('.ant-select-item-option') || 
                       document.querySelector('.ant-select-item') ||
                       document.querySelector('[role="option"]');
    
    if (firstOption) {
      simulateClick(firstOption);
      await new Promise(resolve => setTimeout(resolve, 2000));
      log('✅ Selected first event option', 'success');
    } else {
      log('❌ No options available in dropdown', 'error');
      throw new Error('No options available');
    }

    // Step 8: Look for start game button
    log('Step 8: Looking for start game button...');
    const allButtonsArray = Array.from(document.querySelectorAll('button'));
    const startButton = allButtonsArray.find(btn => 
      btn.textContent.toLowerCase().includes('start') || 
      btn.textContent.toLowerCase().includes('begin') ||
      btn.textContent.toLowerCase().includes('play') ||
      btn.textContent.toLowerCase().includes('go')
    );

    if (startButton) {
      log('✅ Found start game button', 'success');
      simulateClick(startButton);
      await new Promise(resolve => setTimeout(resolve, 2000));
      log('✅ Clicked start game button', 'success');
    } else {
      log('⚠️ No start game button found - looking for any button', 'warning');
      const anyButton = allButtonsArray.find(btn => btn.textContent.trim());
      if (anyButton) {
        log(`Clicking button: "${anyButton.textContent.trim()}"`, 'info');
        simulateClick(anyButton);
        await new Promise(resolve => setTimeout(resolve, 2000));
        log('✅ Clicked available button', 'success');
      }
    }

    // Step 9: Look for player buttons
    log('Step 9: Looking for player buttons...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const playerButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.match(/\d+/) && // Contains numbers
      btn.textContent.length < 10 && // Not too long
      !btn.textContent.toLowerCase().includes('start') &&
      !btn.textContent.toLowerCase().includes('stop') &&
      !btn.textContent.toLowerCase().includes('end')
    );

    if (playerButtons.length > 0) {
      log(`✅ Found ${playerButtons.length} player buttons`, 'success');
      
      // Click on a few player buttons
      for (let i = 0; i < Math.min(3, playerButtons.length); i++) {
        const button = playerButtons[i];
        log(`Clicking player button: ${button.textContent}`, 'info');
        simulateClick(button);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      log('✅ Simulated player events', 'success');
    } else {
      log('⚠️ No player buttons found', 'warning');
    }

    // Step 10: Check for score display
    log('Step 10: Looking for score display...');
    const scoreElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('HOME') && el.textContent.includes('OPP')
    );

    if (scoreElements.length > 0) {
      log(`✅ Found score display: ${scoreElements[0].textContent}`, 'success');
    } else {
      log('⚠️ No score display found', 'warning');
    }

    // Summary
    log('📊 ROBUST SIMULATION SUMMARY', 'info');
    log('============================', 'info');
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.type === 'success').length;
    const failedSteps = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total steps: ${totalSteps}`, 'info');
    log(`✅ Passed: ${passedSteps}`, 'success');
    log(`❌ Failed: ${failedSteps}`, failedSteps > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    return {
      totalSteps,
      passedSteps,
      failedSteps,
      warnings,
      results
    };

  } catch (error) {
    log(`💥 Simulation failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();
