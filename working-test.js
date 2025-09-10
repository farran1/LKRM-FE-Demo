// Working Live Stat Tracker Test
// This test works with the actual Live Stat Tracker implementation

console.log('🏀 Starting Working Live Stat Tracker Test...');

// Test configuration
const TEST_CONFIG = {
  delayBetweenActions: 2000,
  maxActions: 10
};

// Test results
let testResults = {
  actionsAttempted: 0,
  actionsSuccessful: 0,
  actionsFailed: 0,
  errors: []
};

// Utility function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Wait for the page to be ready
const waitForReady = () => {
  return new Promise((resolve) => {
    const checkReady = () => {
      // Check if we can find the Live Stat Tracker elements
      const playerCards = document.querySelectorAll('[class*="playerCard"], .ant-card');
      const actionButtons = document.querySelectorAll('button');
      
      if (playerCards.length > 0 && actionButtons.length > 0) {
        console.log('✅ Live Stat Tracker elements found');
        console.log(`📊 Found ${playerCards.length} player cards`);
        console.log(`🎬 Found ${actionButtons.length} action buttons`);
        resolve(true);
      } else {
        console.log('⏳ Waiting for Live Stat Tracker to load...');
        setTimeout(checkReady, 1000);
      }
    };
    
    checkReady();
    
    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('❌ Timeout waiting for Live Stat Tracker');
      resolve(false);
    }, 30000);
  });
};

// Test player selection
const testPlayerSelection = async () => {
  console.log('🎯 Testing player selection...');
  
  try {
    const playerCards = document.querySelectorAll('[class*="playerCard"], .ant-card');
    
    if (playerCards.length === 0) {
      throw new Error('No player cards found');
    }
    
    // Click on the first player card
    const firstPlayerCard = playerCards[0];
    firstPlayerCard.click();
    console.log('✅ Player card clicked');
    
    testResults.actionsAttempted++;
    testResults.actionsSuccessful++;
    
    await delay(500);
    return true;
    
  } catch (error) {
    console.log('❌ Player selection failed:', error.message);
    testResults.actionsFailed++;
    testResults.errors.push({ type: 'player_selection', error: error.message });
    return false;
  }
};

// Test action buttons
const testActionButtons = async () => {
  console.log('🎬 Testing action buttons...');
  
  const actionButtonTexts = [
    '2PT Made',
    '2PT Miss',
    '3PT Made',
    '3PT Miss',
    'FT Made',
    'FT Miss',
    'Assist',
    'Rebound',
    'Steal',
    'Turnover',
    'Foul',
    'Block'
  ];
  
  for (const buttonText of actionButtonTexts.slice(0, 5)) { // Test first 5 buttons
    try {
      console.log(`Testing button: ${buttonText}`);
      
      // Find the button
      const buttons = document.querySelectorAll('button');
      const targetButton = Array.from(buttons).find(btn => 
        btn.textContent.trim() === buttonText ||
        btn.textContent.includes(buttonText)
      );
      
      if (targetButton && !targetButton.disabled) {
        targetButton.click();
        console.log(`✅ Clicked: ${buttonText}`);
        
        testResults.actionsAttempted++;
        testResults.actionsSuccessful++;
        
        // Wait for any modals
        await delay(1000);
        
        // Try to close any modals
        const modals = document.querySelectorAll('.ant-modal');
        if (modals.length > 0) {
          console.log('🎭 Modal detected, trying to close...');
          
          // Look for close buttons
          const closeButtons = document.querySelectorAll('.ant-modal .ant-btn, .ant-modal button');
          const cancelButton = Array.from(closeButtons).find(btn => 
            btn.textContent.includes('Cancel') ||
            btn.textContent.includes('No') ||
            btn.textContent.includes('Skip') ||
            btn.textContent.includes('Close')
          );
          
          if (cancelButton) {
            cancelButton.click();
            console.log('✅ Modal closed');
          } else {
            // Try pressing Escape key
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            console.log('✅ Pressed Escape key');
          }
        }
        
      } else {
        console.log(`⚠️ Button not found or disabled: ${buttonText}`);
        testResults.actionsFailed++;
      }
      
      await delay(TEST_CONFIG.delayBetweenActions);
      
    } catch (error) {
      console.log(`❌ Error testing ${buttonText}:`, error.message);
      testResults.actionsFailed++;
      testResults.errors.push({ type: 'action_button', button: buttonText, error: error.message });
    }
  }
};

// Check if game is started
const checkGameStatus = () => {
  console.log('🔍 Checking game status...');
  
  // Look for game status indicators
  const gameStatusElements = document.querySelectorAll('[class*="game"], [class*="timer"], [class*="clock"]');
  console.log(`Found ${gameStatusElements.length} game status elements`);
  
  // Look for start/stop buttons
  const startButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('Start') || 
    btn.textContent.includes('Play') ||
    btn.textContent.includes('Begin')
  );
  
  if (startButtons.length > 0) {
    console.log('⚠️ Game may not be started. Found start buttons:', startButtons.map(btn => btn.textContent));
    return false;
  }
  
  console.log('✅ Game appears to be started');
  return true;
};

// Run the test
const runTest = async () => {
  console.log('🚀 Starting Working Live Stat Tracker Test...');
  
  // Wait for the page to be ready
  const ready = await waitForReady();
  if (!ready) {
    console.log('❌ Live Stat Tracker not ready. Please ensure you are on the correct page.');
    return;
  }
  
  // Check game status
  const gameStarted = checkGameStatus();
  if (!gameStarted) {
    console.log('⚠️ Game may not be started. Some actions may not work.');
  }
  
  // Test player selection
  await testPlayerSelection();
  await delay(1000);
  
  // Test action buttons
  await testActionButtons();
  
  // Generate report
  console.log('\n📊 === WORKING TEST REPORT ===');
  console.log(`🎮 Actions Attempted: ${testResults.actionsAttempted}`);
  console.log(`✅ Successful: ${testResults.actionsSuccessful}`);
  console.log(`❌ Failed: ${testResults.actionsFailed}`);
  console.log(`📈 Success Rate: ${((testResults.actionsSuccessful / testResults.actionsAttempted) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.type}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Working test complete!');
  console.log('💡 Check the play-by-play feed and player stats to see if events were recorded.');
  
  // Check for events in the UI
  const eventElements = document.querySelectorAll('[class*="event"], [class*="play"], [class*="timeline"]');
  console.log(`📋 Found ${eventElements.length} event elements in the UI`);
};

// Auto-run the test
runTest();

// Export for manual use
window.runWorkingTest = runTest;
