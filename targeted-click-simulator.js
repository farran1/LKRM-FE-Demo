// Targeted Click Simulator - Handles the specific UI state we found
// Copy and paste this into your browser console

(async function targetedClickSimulator() {
  console.log('🎯 Starting Targeted Click Simulator');
  console.log('====================================');
  
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    log('✅ Page loaded', 'success');

    // Step 3: Find the specific select element we identified
    log('Step 3: Finding the event selector...');
    const selectElement = document.querySelector('.ant-select.ant-select-outlined');
    if (!selectElement) {
      throw new Error('Could not find the select element');
    }
    log('✅ Found select element', 'success');

    // Step 4: Click on the select element to open dropdown
    log('Step 4: Clicking select element to open dropdown...');
    simulateClick(selectElement);
    await new Promise(resolve => setTimeout(resolve, 1000));
    log('✅ Clicked select element', 'success');

    // Step 5: Wait for dropdown to appear and remove hidden class
    log('Step 5: Waiting for dropdown to appear...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if dropdown is now visible
    const dropdown = document.querySelector('.ant-select-dropdown');
    if (dropdown) {
      const isHidden = dropdown.classList.contains('ant-select-dropdown-hidden');
      log(`Dropdown found - hidden: ${isHidden}`, 'info');
      
      if (isHidden) {
        log('Dropdown is still hidden, trying to force it open...', 'info');
        // Try clicking the input inside the select
        const input = selectElement.querySelector('input');
        if (input) {
          simulateClick(input);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Step 6: Look for dropdown options
    log('Step 6: Looking for dropdown options...');
    const options = document.querySelectorAll('.ant-select-item-option, .ant-select-item');
    
    if (options.length > 0) {
      log(`✅ Found ${options.length} dropdown options`, 'success');
      
      // List the options
      options.forEach((option, index) => {
        log(`Option ${index}: "${option.textContent.trim()}"`, 'info');
      });
      
      // Click on the first option
      log('Step 7: Selecting first option...');
      simulateClick(options[0]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      log('✅ Selected first option', 'success');
    } else {
      log('❌ No dropdown options found', 'error');
      
      // Debug: Check what's in the dropdown
      const dropdown = document.querySelector('.ant-select-dropdown');
      if (dropdown) {
        log('Dropdown content:', 'info');
        log(dropdown.innerHTML, 'info');
      }
      
      // Try alternative approach - look for any clickable elements
      const clickableElements = document.querySelectorAll('*');
      const clickableArray = Array.from(clickableElements).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               el.textContent && el.textContent.trim().length > 0 &&
               el.textContent.trim().length < 50 &&
               !el.textContent.toLowerCase().includes('create new event');
      });
      
      log(`Found ${clickableArray.length} potentially clickable elements`, 'info');
      clickableArray.slice(0, 5).forEach((el, index) => {
        log(`Clickable ${index}: "${el.textContent.trim()}"`, 'info');
      });
      
      throw new Error('No dropdown options available');
    }

    // Step 8: Look for start game button
    log('Step 8: Looking for start game button...');
    const allButtons = document.querySelectorAll('button');
    const startButton = Array.from(allButtons).find(btn => 
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
      const anyButton = Array.from(allButtons).find(btn => 
        btn.textContent.trim() && 
        !btn.textContent.toLowerCase().includes('create new event')
      );
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
      !btn.textContent.toLowerCase().includes('end') &&
      !btn.textContent.toLowerCase().includes('create')
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
    log('📊 TARGETED SIMULATION SUMMARY', 'info');
    log('==============================', 'info');
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



