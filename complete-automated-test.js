// Complete Automated Live Stat Tracker Test
// This test starts from a blank state and does everything automatically

console.log('🏀 Starting Complete Automated Live Stat Tracker Test...');

// Test configuration
const TEST_CONFIG = {
  delayBetweenActions: 1500,
  maxActions: 15,
  waitForElements: 5000
};

// Test results
let testResults = {
  steps: [],
  actionsAttempted: 0,
  actionsSuccessful: 0,
  actionsFailed: 0,
  errors: []
};

// Utility function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Log test step
const logStep = (step, success, details = '') => {
  const stepResult = { step, success, details, timestamp: new Date().toLocaleTimeString() };
  testResults.steps.push(stepResult);
  console.log(`${success ? '✅' : '❌'} ${step}: ${details}`);
};

// Wait for elements to appear
const waitForElement = (selector, timeout = 10000) => {
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

// Wait for multiple elements
const waitForElements = (selectors, timeout = 10000) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkElements = () => {
      const elements = selectors.map(selector => document.querySelector(selector)).filter(Boolean);
      if (elements.length > 0) {
        resolve(elements);
      } else if (Date.now() - startTime > timeout) {
        resolve([]);
      } else {
        setTimeout(checkElements, 100);
      }
    };
    checkElements();
  });
};

// Click button safely
const clickButton = async (button, buttonText) => {
  try {
    if (button.disabled) {
      logStep(`Button "${buttonText}" is disabled`, false, 'Cannot click disabled button');
      return false;
    }
    
    button.click();
    logStep(`Clicked "${buttonText}"`, true, 'Button clicked successfully');
    testResults.actionsAttempted++;
    testResults.actionsSuccessful++;
    
    await delay(1000);
    return true;
  } catch (error) {
    logStep(`Error clicking "${buttonText}"`, false, error.message);
    testResults.actionsFailed++;
    testResults.errors.push({ action: 'click_button', button: buttonText, error: error.message });
    return false;
  }
};

// Find and click button by text
const findAndClickButton = async (buttonText, exactMatch = false) => {
  const buttons = document.querySelectorAll('button');
  const targetButton = Array.from(buttons).find(btn => {
    const text = btn.textContent.trim();
    return exactMatch ? text === buttonText : text.includes(buttonText);
  });
  
  if (targetButton) {
    return await clickButton(targetButton, buttonText);
  } else {
    logStep(`Button "${buttonText}" not found`, false, 'Button not found in DOM');
    return false;
  }
};

// Handle modals
const handleModals = async () => {
  const modals = document.querySelectorAll('.ant-modal');
  if (modals.length > 0) {
    logStep('Modal detected', true, 'Found modal, attempting to close');
    
    // Wait a bit for modal to fully render
    await delay(500);
    
    // Look for close buttons
    const closeButtons = document.querySelectorAll('.ant-modal button');
    const cancelButton = Array.from(closeButtons).find(btn => 
      btn.textContent.includes('Cancel') ||
      btn.textContent.includes('No') ||
      btn.textContent.includes('Skip') ||
      btn.textContent.includes('Close') ||
      btn.textContent.includes('×')
    );
    
    if (cancelButton) {
      await clickButton(cancelButton, 'Modal Close Button');
      logStep('Modal closed', true, 'Modal closed successfully');
    } else {
      // Try pressing Escape key
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      logStep('Pressed Escape key', true, 'Attempted to close modal with Escape');
    }
    
    await delay(500);
  }
};

// Step 1: Start the game
const startGame = async () => {
  logStep('Starting game', true, 'Looking for start button');
  
  // Look for start button
  const startButton = await findAndClickButton('Start Tracking');
  if (startButton) {
    await delay(2000); // Wait for game to start
    return true;
  }
  
  // Try alternative start buttons
  const alternativeStartButtons = ['Start', 'Play', 'Begin', 'Start Game'];
  for (const buttonText of alternativeStartButtons) {
    const clicked = await findAndClickButton(buttonText);
    if (clicked) {
      await delay(2000);
      return true;
    }
  }
  
  logStep('Could not start game', false, 'No start button found');
  return false;
};

// Step 2: Select a player
const selectPlayer = async () => {
  logStep('Selecting player', true, 'Looking for player cards');
  
  // Wait for player cards to appear
  const playerCards = await waitForElements([
    '[class*="playerCard"]',
    '.ant-card',
    '[data-testid*="player"]'
  ]);
  
  if (playerCards.length > 0) {
    const firstPlayerCard = playerCards[0];
    await clickButton(firstPlayerCard, 'Player Card');
    await delay(500);
    return true;
  }
  
  logStep('No player cards found', false, 'Cannot select player');
  return false;
};

// Step 3: Test action buttons
const testActionButtons = async () => {
  logStep('Testing action buttons', true, 'Looking for action buttons');
  
  const actionButtons = [
    '2PT Made', '2PT Miss', '3PT Made', '3PT Miss',
    'FT Made', 'FT Miss', 'Assist', 'Rebound',
    'Steal', 'Turnover', 'Foul', 'Block'
  ];
  
  let successfulActions = 0;
  
  for (const buttonText of actionButtons.slice(0, 8)) { // Test first 8 buttons
    const clicked = await findAndClickButton(buttonText);
    if (clicked) {
      successfulActions++;
      await handleModals();
    }
    await delay(TEST_CONFIG.delayBetweenActions);
  }
  
  logStep(`Action buttons tested`, true, `${successfulActions} buttons clicked successfully`);
  return successfulActions > 0;
};

// Step 4: Verify results
const verifyResults = async () => {
  logStep('Verifying results', true, 'Checking for events and stats');
  
  // Check for events in play-by-play
  const eventElements = document.querySelectorAll('[class*="event"], [class*="play"], [class*="timeline"]');
  logStep('Play-by-play events', true, `Found ${eventElements.length} event elements`);
  
  // Check for player stats
  const playerStats = document.querySelectorAll('[class*="player"], [class*="stat"]');
  logStep('Player stats', true, `Found ${playerStats.length} player/stat elements`);
  
  // Check for any error messages
  const errorMessages = document.querySelectorAll('[class*="error"], [class*="warning"]');
  if (errorMessages.length > 0) {
    logStep('Error messages found', false, `${errorMessages.length} error/warning elements found`);
  }
  
  return eventElements.length > 0;
};

// Main test function
const runCompleteTest = async () => {
  console.log('🚀 Starting Complete Automated Test...');
  
  try {
    // Step 1: Start the game
    const gameStarted = await startGame();
    if (!gameStarted) {
      logStep('Test failed', false, 'Could not start game');
      return;
    }
    
    // Step 2: Select a player
    const playerSelected = await selectPlayer();
    if (!playerSelected) {
      logStep('Test failed', false, 'Could not select player');
      return;
    }
    
    // Step 3: Test action buttons
    const actionsWorked = await testActionButtons();
    if (!actionsWorked) {
      logStep('Test failed', false, 'Action buttons did not work');
      return;
    }
    
    // Step 4: Verify results
    const resultsVerified = await verifyResults();
    
    // Generate final report
    generateFinalReport();
    
  } catch (error) {
    logStep('Test crashed', false, error.message);
    testResults.errors.push({ action: 'test_crash', error: error.message });
  }
};

// Generate final report
const generateFinalReport = () => {
  console.log('\n📊 === COMPLETE AUTOMATED TEST REPORT ===');
  console.log(`🎮 Actions Attempted: ${testResults.actionsAttempted}`);
  console.log(`✅ Successful: ${testResults.actionsSuccessful}`);
  console.log(`❌ Failed: ${testResults.actionsFailed}`);
  console.log(`📈 Success Rate: ${((testResults.actionsSuccessful / testResults.actionsAttempted) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Test Steps:');
  testResults.steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step.timestamp} - ${step.step}: ${step.details}`);
  });
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.action}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Complete automated test finished!');
  console.log('💡 Check the play-by-play feed and player stats to see if events were recorded.');
};

// Auto-run the test
runCompleteTest();

// Export for manual use
window.runCompleteTest = runCompleteTest;
