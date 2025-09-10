// Enhanced Live Stat Tracker Test
// This test handles lineup setup and all the necessary steps

console.log('🏀 Starting Enhanced Live Stat Tracker Test...');

let results = { steps: 0, successes: 0, failures: 0 };
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, success = true) => {
  console.log(`${success ? '✅' : '❌'} ${message}`);
  results.steps++;
  if (success) results.successes++; else results.failures++;
};

const clickButton = async (text, exactMatch = false) => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const button = buttons.find(btn => {
    const btnText = btn.textContent.trim();
    return exactMatch ? btnText === text : btnText.includes(text);
  });
  
  if (button && !button.disabled) {
    button.click();
    log(`Clicked: ${text}`);
    await wait(1000);
    return true;
  } else {
    log(`Button not found or disabled: ${text}`, false);
    return false;
  }
};

const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        resolve(null);
      } else {
        setTimeout(checkElement, 100);
      }
    };
    checkElement();
  });
};

const handleModals = async () => {
  const modals = document.querySelectorAll('.ant-modal');
  if (modals.length > 0) {
    log('Modal detected, handling...');
    await wait(500);
    
    // Look for close buttons
    const closeButtons = document.querySelectorAll('.ant-modal button');
    const cancelButton = closeButtons.find(btn => 
      btn.textContent.includes('Cancel') ||
      btn.textContent.includes('No') ||
      btn.textContent.includes('Skip') ||
      btn.textContent.includes('Close') ||
      btn.textContent.includes('×')
    );
    
    if (cancelButton) {
      cancelButton.click();
      log('Modal closed');
    } else {
      // Try pressing Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      log('Pressed Escape to close modal');
    }
    
    await wait(500);
  }
};

const setupStartingLineup = async () => {
  log('Setting up starting lineup...');
  
  // Look for lineup-related buttons
  const lineupButtons = [
    'Select Starting Lineup',
    'Edit Starting Lineup', 
    'Create New Lineup',
    'Lineup',
    'Starting Lineup'
  ];
  
  for (const buttonText of lineupButtons) {
    const clicked = await clickButton(buttonText);
    if (clicked) {
      await wait(2000); // Wait for lineup modal to open
      
      // Look for lineup modal
      const lineupModal = document.querySelector('.ant-modal');
      if (lineupModal) {
        log('Lineup modal opened');
        
        // Look for "Select 5 Players" or similar text
        const selectText = lineupModal.textContent;
        if (selectText.includes('Select') && selectText.includes('5')) {
          log('Found lineup selection interface');
          
          // Look for player checkboxes or selection buttons
          const playerOptions = lineupModal.querySelectorAll('input[type="checkbox"], .ant-checkbox, [role="checkbox"]');
          if (playerOptions.length > 0) {
            log(`Found ${playerOptions.length} player options`);
            
            // Select first 5 players
            for (let i = 0; i < Math.min(5, playerOptions.length); i++) {
              const option = playerOptions[i];
              if (option.type === 'checkbox') {
                option.click();
              } else {
                option.click();
              }
              log(`Selected player ${i + 1}`);
              await wait(300);
            }
          }
          
          // Look for confirm/save button
          const confirmButtons = [
            'Confirm', 'Save', 'Done', 'Create Lineup', 'Set Lineup', 'OK'
          ];
          
          for (const confirmText of confirmButtons) {
            const confirmBtn = Array.from(lineupModal.querySelectorAll('button')).find(btn => 
              btn.textContent.includes(confirmText)
            );
            if (confirmBtn) {
              confirmBtn.click();
              log(`Clicked confirm button: ${confirmText}`);
              await wait(2000);
              break;
            }
          }
        }
      }
      
      await handleModals();
      return true;
    }
  }
  
  log('Could not find lineup setup button', false);
  return false;
};

const runEnhancedTest = async () => {
  console.log('🚀 Starting enhanced test...');
  
  // Step 1: Start the game
  log('Step 1: Starting game...');
  await clickButton('Start Tracking');
  await wait(2000);
  
  // Step 2: Set up starting lineup
  log('Step 2: Setting up starting lineup...');
  const lineupSet = await setupStartingLineup();
  if (!lineupSet) {
    log('Could not set up lineup, trying to continue...', false);
  }
  
  // Step 3: Select a player
  log('Step 3: Selecting player...');
  const playerCards = document.querySelectorAll('[class*="playerCard"], .ant-card');
  if (playerCards.length > 0) {
    playerCards[0].click();
    log('Player selected');
    await wait(500);
  } else {
    log('No player cards found', false);
  }
  
  // Step 4: Test action buttons
  log('Step 4: Testing action buttons...');
  const actions = ['2PT Made', '3PT Made', 'Assist', 'Rebound', 'Steal', 'Turnover'];
  
  for (const action of actions) {
    await clickButton(action);
    await handleModals();
    await wait(1500);
  }
  
  // Step 5: Check results
  log('Step 5: Checking results...');
  const events = document.querySelectorAll('[class*="event"], [class*="play"]');
  log(`Found ${events.length} events in UI`);
  
  // Check if players are on court
  const onCourtPlayers = document.querySelectorAll('[class*="onCourt"], [class*="active"]');
  log(`Found ${onCourtPlayers.length} on-court players`);
  
  // Final report
  console.log('\n📊 ENHANCED TEST RESULTS:');
  console.log(`Steps: ${results.steps}`);
  console.log(`Successes: ${results.successes}`);
  console.log(`Failures: ${results.failures}`);
  console.log(`Success Rate: ${((results.successes / results.steps) * 100).toFixed(1)}%`);
  console.log('\n🎉 Enhanced test complete!');
};

// Run the test
runEnhancedTest();

// Export
window.runEnhancedTest = runEnhancedTest;
