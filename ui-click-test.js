// UI Click Test for Live Stat Tracker
// This test clicks on actual UI elements to simulate user interaction

console.log('🏀 Starting UI Click Test...');

// Test configuration
const TEST_CONFIG = {
  delayBetweenClicks: 2000,
  testPlayerSelection: true,
  testActionButtons: true
};

// Test results
let testResults = {
  playerClicks: 0,
  actionClicks: 0,
  successfulClicks: 0,
  failedClicks: 0,
  errors: []
};

// Utility function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Find and click player cards
const testPlayerSelection = async () => {
  console.log('🎯 Testing player selection...');
  
  try {
    // Look for player cards in the UI
    const playerCards = document.querySelectorAll('[class*="playerCard"], [class*="player-card"], .ant-card, [data-testid*="player"]');
    
    if (playerCards.length === 0) {
      console.log('❌ No player cards found');
      return false;
    }
    
    console.log(`Found ${playerCards.length} player cards`);
    
    // Click on the first player card
    const firstPlayerCard = playerCards[0];
    firstPlayerCard.click();
    console.log('✅ Player card clicked');
    
    testResults.playerClicks++;
    testResults.successfulClicks++;
    
    await delay(500);
    return true;
    
  } catch (error) {
    console.log('❌ Player selection failed:', error.message);
    testResults.failedClicks++;
    testResults.errors.push({ type: 'player_selection', error: error.message });
    return false;
  }
};

// Find and click action buttons
const testActionButtons = async () => {
  console.log('🎬 Testing action buttons...');
  
  const actionButtons = [
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
  
  for (const buttonText of actionButtons) {
    try {
      console.log(`Testing button: ${buttonText}`);
      
      // Find the button
      const buttons = document.querySelectorAll('button');
      const targetButton = Array.from(buttons).find(btn => 
        btn.textContent.trim() === buttonText ||
        btn.textContent.includes(buttonText)
      );
      
      if (targetButton) {
        // Check if button is enabled
        if (targetButton.disabled) {
          console.log(`⚠️ Button ${buttonText} is disabled`);
          continue;
        }
        
        // Click the button
        targetButton.click();
        console.log(`✅ Clicked: ${buttonText}`);
        
        testResults.actionClicks++;
        testResults.successfulClicks++;
        
        // Wait for any modals to appear
        await delay(1000);
        
        // Try to close any modals that appeared
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
        console.log(`⚠️ Button not found: ${buttonText}`);
        testResults.failedClicks++;
      }
      
      await delay(TEST_CONFIG.delayBetweenClicks);
      
    } catch (error) {
      console.log(`❌ Error testing ${buttonText}:`, error.message);
      testResults.failedClicks++;
      testResults.errors.push({ type: 'action_button', button: buttonText, error: error.message });
    }
  }
};

// Run the complete test
const runUITest = async () => {
  console.log('🚀 Starting UI Click Test...');
  
  // Test player selection
  if (TEST_CONFIG.testPlayerSelection) {
    await testPlayerSelection();
    await delay(1000);
  }
  
  // Test action buttons
  if (TEST_CONFIG.testActionButtons) {
    await testActionButtons();
  }
  
  // Generate report
  console.log('\n📊 === UI CLICK TEST REPORT ===');
  console.log(`🎯 Player Clicks: ${testResults.playerClicks}`);
  console.log(`🎬 Action Clicks: ${testResults.actionClicks}`);
  console.log(`✅ Successful: ${testResults.successfulClicks}`);
  console.log(`❌ Failed: ${testResults.failedClicks}`);
  console.log(`📈 Success Rate: ${((testResults.successfulClicks / (testResults.successfulClicks + testResults.failedClicks)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.type}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 UI Click Test complete!');
  console.log('💡 Check the play-by-play feed and player stats to see if events were recorded.');
};

// Auto-run the test
runUITest();

// Export for manual use
window.runUITest = runUITest;



