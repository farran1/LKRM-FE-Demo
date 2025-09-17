// Fixed Live Stat Tracker Test
// This test fixes the NodeList.find error and handles lineup setup

console.log('🏀 Starting Fixed Live Stat Tracker Test...');

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

const handleModals = async () => {
  const modals = document.querySelectorAll('.ant-modal');
  if (modals.length > 0) {
    log('Modal detected, handling...');
    await wait(500);
    
    // Fix: Convert NodeList to Array before using find
    const closeButtons = Array.from(document.querySelectorAll('.ant-modal button'));
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

const setupLineup = async () => {
  log('Setting up lineup...');
  
  // Look for lineup-related buttons
  const lineupButtons = [
    'Select Starting Lineup',
    'Edit Starting Lineup', 
    'Create New Lineup',
    'Lineup',
    'Starting Lineup',
    'Quick Substitution'
  ];
  
  for (const buttonText of lineupButtons) {
    const clicked = await clickButton(buttonText);
    if (clicked) {
      await wait(2000); // Wait for modal to open
      
      // Look for lineup modal
      const lineupModal = document.querySelector('.ant-modal');
      if (lineupModal) {
        log('Lineup modal opened');
        
        // Try different selection methods
        const selectionMethods = [
          // Method 1: Checkboxes
          () => {
            const checkboxes = Array.from(lineupModal.querySelectorAll('input[type="checkbox"]'));
            if (checkboxes.length > 0) {
              log(`Found ${checkboxes.length} checkboxes`);
              for (let i = 0; i < Math.min(5, checkboxes.length); i++) {
                checkboxes[i].click();
                log(`Selected checkbox ${i + 1}`);
                wait(300);
              }
              return true;
            }
            return false;
          },
          
          // Method 2: Ant Design checkboxes
          () => {
            const antCheckboxes = Array.from(lineupModal.querySelectorAll('.ant-checkbox'));
            if (antCheckboxes.length > 0) {
              log(`Found ${antCheckboxes.length} ant checkboxes`);
              for (let i = 0; i < Math.min(5, antCheckboxes.length); i++) {
                antCheckboxes[i].click();
                log(`Selected ant checkbox ${i + 1}`);
                wait(300);
              }
              return true;
            }
            return false;
          },
          
          // Method 3: Clickable player cards
          () => {
            const playerCards = Array.from(lineupModal.querySelectorAll('[class*="player"], [class*="card"]'));
            if (playerCards.length > 0) {
              log(`Found ${playerCards.length} player cards`);
              for (let i = 0; i < Math.min(5, playerCards.length); i++) {
                playerCards[i].click();
                log(`Selected player card ${i + 1}`);
                wait(300);
              }
              return true;
            }
            return false;
          },
          
          // Method 4: Any clickable elements
          () => {
            const clickableElements = Array.from(lineupModal.querySelectorAll('div[onclick], span[onclick], [role="button"]'));
            if (clickableElements.length > 0) {
              log(`Found ${clickableElements.length} clickable elements`);
              for (let i = 0; i < Math.min(5, clickableElements.length); i++) {
                clickableElements[i].click();
                log(`Selected element ${i + 1}`);
                wait(300);
              }
              return true;
            }
            return false;
          }
        ];
        
        // Try each selection method
        let selectionWorked = false;
        for (const method of selectionMethods) {
          try {
            if (method()) {
              selectionWorked = true;
              break;
            }
          } catch (error) {
            log(`Selection method failed: ${error.message}`, false);
          }
        }
        
        if (selectionWorked) {
          log('Players selected successfully');
        } else {
          log('Could not select players', false);
        }
        
        // Look for confirm/save button
        const confirmButtons = [
          'Confirm', 'Save', 'Done', 'Create Lineup', 'Set Lineup', 'OK', 'Submit'
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
      
      await handleModals();
      return true;
    }
  }
  
  log('Could not find lineup setup button', false);
  return false;
};

const runFixedTest = async () => {
  console.log('🚀 Starting fixed test...');
  
  // Step 1: Start the game
  log('Step 1: Starting game...');
  await clickButton('Start Tracking');
  await wait(2000);
  
  // Step 2: Set up starting lineup
  log('Step 2: Setting up starting lineup...');
  const lineupSet = await setupLineup();
  if (!lineupSet) {
    log('Could not set up lineup, trying to continue...', false);
  }
  
  // Step 3: Wait for lineup to be ready
  log('Step 3: Waiting for lineup to be ready...');
  await wait(2000);
  
  // Step 4: Select a player
  log('Step 4: Selecting player...');
  const playerCards = document.querySelectorAll('[class*="playerCard"], .ant-card');
  if (playerCards.length > 0) {
    playerCards[0].click();
    log('Player selected');
    await wait(500);
  } else {
    log('No player cards found', false);
  }
  
  // Step 5: Test action buttons
  log('Step 5: Testing action buttons...');
  const actions = ['2PT Made', '3PT Made', 'Assist', 'Rebound', 'Steal', 'Turnover'];
  
  for (const action of actions) {
    await clickButton(action);
    await handleModals();
    await wait(1500);
  }
  
  // Step 6: Check results
  log('Step 6: Checking results...');
  const events = document.querySelectorAll('[class*="event"], [class*="play"]');
  log(`Found ${events.length} events in UI`);
  
  // Check if players are on court
  const onCourtPlayers = document.querySelectorAll('[class*="onCourt"], [class*="active"]');
  log(`Found ${onCourtPlayers.length} on-court players`);
  
  // Final report
  console.log('\n📊 FIXED TEST RESULTS:');
  console.log(`Steps: ${results.steps}`);
  console.log(`Successes: ${results.successes}`);
  console.log(`Failures: ${results.failures}`);
  console.log(`Success Rate: ${((results.successes / results.steps) * 100).toFixed(1)}%`);
  console.log('\n🎉 Fixed test complete!');
};

// Run the test
runFixedTest();

// Export
window.runFixedTest = runFixedTest;



