// Aggressive Debugger - Shows everything and tries all clicking methods
// Copy and paste this into your browser console while on the live stat tracker page

(async function aggressiveDebugger() {
  console.log('🔍 Starting Aggressive Debugger');
  console.log('===============================');
  
  const results = [];
  let clickCount = 0;
  
  function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    results.push({ timestamp, type, message });
  }

  // Multiple click methods to try
  function clickMethod1(element) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
    clickCount++;
  }

  function clickMethod2(element) {
    const event = new MouseEvent('mousedown', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
    
    setTimeout(() => {
      const event2 = new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event2);
    }, 10);
    clickCount++;
  }

  function clickMethod3(element) {
    element.click();
    clickCount++;
  }

  function clickMethod4(element) {
    const event = new Event('click', {
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
    clickCount++;
  }

  // Try all click methods
  function tryAllClickMethods(element, description) {
    log(`Trying to click: ${description}`, 'info');
    
    try {
      clickMethod1(element);
      log(`✅ Method 1 (MouseEvent) succeeded`, 'success');
      return true;
    } catch (e) {
      log(`❌ Method 1 failed: ${e.message}`, 'error');
    }

    try {
      clickMethod2(element);
      log(`✅ Method 2 (mousedown/mouseup) succeeded`, 'success');
      return true;
    } catch (e) {
      log(`❌ Method 2 failed: ${e.message}`, 'error');
    }

    try {
      clickMethod3(element);
      log(`✅ Method 3 (element.click()) succeeded`, 'success');
      return true;
    } catch (e) {
      log(`❌ Method 3 failed: ${e.message}`, 'error');
    }

    try {
      clickMethod4(element);
      log(`✅ Method 4 (Event) succeeded`, 'success');
      return true;
    } catch (e) {
      log(`❌ Method 4 failed: ${e.message}`, 'error');
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

    // Step 3: Debug - List ALL elements on the page
    log('Step 3: Debugging - Listing ALL elements on the page...');
    
    // Get all possible clickable elements
    const allElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.offsetParent !== null && // Visible
      el.textContent && // Has text
      el.textContent.trim().length > 0 && // Not empty
      el.textContent.trim().length < 100 // Not too long
    );

    log(`Found ${allElements.length} total visible elements with text:`, 'info');
    
    // Group by tag type
    const elementsByTag = {};
    allElements.forEach(el => {
      const tag = el.tagName;
      if (!elementsByTag[tag]) elementsByTag[tag] = [];
      elementsByTag[tag].push(el);
    });

    Object.keys(elementsByTag).forEach(tag => {
      log(`${tag}: ${elementsByTag[tag].length} elements`, 'info');
    });

    // Show first 20 elements
    allElements.slice(0, 20).forEach((el, index) => {
      log(`Element ${index + 1}: "${el.textContent.trim()}" (${el.tagName})`, 'info');
    });

    // Step 4: Look for specific stat-related elements
    log('Step 4: Looking for stat-related elements...');
    
    const statKeywords = ['2pt', '3pt', 'ft', 'assist', 'rebound', 'steal', 'block', 'turnover', 'made', 'miss', 'point', 'goal'];
    const statElements = [];
    
    statKeywords.forEach(keyword => {
      const elements = allElements.filter(el => 
        el.textContent.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (elements.length > 0) {
        log(`Found ${elements.length} elements containing "${keyword}":`, 'info');
        elements.forEach((el, index) => {
          log(`  ${index + 1}: "${el.textContent.trim()}" (${el.tagName})`, 'info');
          statElements.push(el);
        });
      }
    });

    // Step 5: Try clicking on stat elements
    log('Step 5: Trying to click on stat elements...');
    
    if (statElements.length > 0) {
      // Try clicking the first few stat elements
      for (let i = 0; i < Math.min(5, statElements.length); i++) {
        const element = statElements[i];
        const success = tryAllClickMethods(element, `"${element.textContent.trim()}" (${element.tagName})`);
        
        if (success) {
          log(`✅ Successfully clicked element ${i + 1}`, 'success');
        } else {
          log(`❌ Failed to click element ${i + 1}`, 'error');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      log('❌ No stat elements found', 'error');
    }

    // Step 6: Try clicking on any button-like elements
    log('Step 6: Trying to click on button-like elements...');
    
    const buttonLikeElements = allElements.filter(el => 
      el.tagName === 'BUTTON' ||
      el.tagName === 'A' ||
      el.getAttribute('role') === 'button' ||
      el.getAttribute('onclick') ||
      el.style.cursor === 'pointer' ||
      el.classList.contains('btn') ||
      el.classList.contains('button') ||
      el.classList.contains('clickable')
    );

    log(`Found ${buttonLikeElements.length} button-like elements:`, 'info');
    buttonLikeElements.forEach((el, index) => {
      log(`Button ${index + 1}: "${el.textContent.trim()}" (${el.tagName})`, 'info');
    });

    // Try clicking the first few button-like elements
    for (let i = 0; i < Math.min(3, buttonLikeElements.length); i++) {
      const element = buttonLikeElements[i];
      const success = tryAllClickMethods(element, `Button "${element.textContent.trim()}" (${element.tagName})`);
      
      if (success) {
        log(`✅ Successfully clicked button ${i + 1}`, 'success');
      } else {
        log(`❌ Failed to click button ${i + 1}`, 'error');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 7: Try clicking on any div elements (in case they're clickable)
    log('Step 7: Trying to click on div elements...');
    
    const divElements = allElements.filter(el => 
      el.tagName === 'DIV' &&
      el.textContent.trim().length < 20 && // Short text
      !el.textContent.toLowerCase().includes('home') &&
      !el.textContent.toLowerCase().includes('opp') &&
      !el.textContent.toLowerCase().includes('score')
    );

    log(`Found ${divElements.length} potential clickable div elements:`, 'info');
    divElements.slice(0, 10).forEach((el, index) => {
      log(`Div ${index + 1}: "${el.textContent.trim()}"`, 'info');
    });

    // Try clicking the first few div elements
    for (let i = 0; i < Math.min(3, divElements.length); i++) {
      const element = divElements[i];
      const success = tryAllClickMethods(element, `Div "${element.textContent.trim()}"`);
      
      if (success) {
        log(`✅ Successfully clicked div ${i + 1}`, 'success');
      } else {
        log(`❌ Failed to click div ${i + 1}`, 'error');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Step 8: Check for any changes in the UI
    log('Step 8: Checking for any changes in the UI...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Look for score changes
    const scoreElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('HOME') && el.textContent.includes('OPP')
    );

    if (scoreElements.length > 0) {
      log(`✅ Found score display: ${scoreElements[0].textContent}`, 'success');
    } else {
      log('⚠️ No score display found', 'warning');
    }

    // Look for play-by-play changes
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
    log('📊 AGGRESSIVE DEBUGGER SUMMARY', 'info');
    log('==============================', 'info');
    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.type === 'success').length;
    const failedSteps = results.filter(r => r.type === 'error').length;
    const warnings = results.filter(r => r.type === 'warning').length;
    
    log(`Total clicks attempted: ${clickCount}`, 'info');
    log(`Total elements found: ${allElements.length}`, 'info');
    log(`Stat elements found: ${statElements.length}`, 'info');
    log(`Button-like elements found: ${buttonLikeElements.length}`, 'info');
    log(`Total checks: ${totalSteps}`, 'info');
    log(`✅ Passed: ${passedSteps}`, 'success');
    log(`❌ Failed: ${failedSteps}`, failedSteps > 0 ? 'error' : 'info');
    log(`⚠️ Warnings: ${warnings}`, warnings > 0 ? 'warning' : 'info');

    if (failedSteps === 0) {
      log('🎉 Aggressive debugger completed successfully!', 'success');
    } else {
      log('💥 Some steps failed. Check the errors above for details.', 'error');
    }

    return {
      totalClicks: clickCount,
      totalElements: allElements.length,
      statElements: statElements.length,
      buttonElements: buttonLikeElements.length,
      totalSteps,
      passedSteps,
      failedSteps,
      warnings,
      results
    };

  } catch (error) {
    log(`💥 Aggressive debugger failed: ${error.message}`, 'error');
    console.error('Full error:', error);
    return { error: error.message, results };
  }
})();



