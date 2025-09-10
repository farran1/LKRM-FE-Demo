// Simple Live Stat Tracker Test
// This script works with the actual Live Stat Tracker implementation

console.log('🏀 Starting Simple Live Stat Tracker Test...');

// Wait for the page to load and find the necessary functions
const waitForFunctions = () => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // Check if we can access the necessary functions
      if (typeof selectPlayer === 'function' && 
          typeof handleStatEvent === 'function' && 
          typeof recordAction === 'function') {
        clearInterval(checkInterval);
        console.log('✅ Required functions found');
        resolve(true);
      }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('❌ Timeout waiting for functions');
      resolve(false);
    }, 10000);
  });
};

// Test configuration
const TEST_EVENTS = [
  'assist',
  'rebound', 
  'fg_made',
  'three_made',
  'fg_missed',
  'steal',
  'turnover',
  'foul',
  'block'
];

// Test results
let testResults = {
  totalEvents: 0,
  successfulEvents: 0,
  failedEvents: 0,
  errors: []
};

// Utility function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test a single event
const testSingleEvent = async (eventType) => {
  console.log(`🧪 Testing: ${eventType}`);
  
  try {
    // For direct events (assist, rebound)
    if (['assist', 'rebound'].includes(eventType)) {
      // We need to find a player ID - let's try to get it from the UI
      const playerCards = document.querySelectorAll('[data-player-id]');
      if (playerCards.length > 0) {
        const playerId = parseInt(playerCards[0].getAttribute('data-player-id'));
        handleStatEvent(playerId, eventType, 1, false);
        console.log(`✅ Direct event recorded: ${eventType}`);
        testResults.successfulEvents++;
      } else {
        console.log(`⚠️ No player cards found for ${eventType}`);
        testResults.failedEvents++;
      }
    }
    // For modal events
    else {
      // Try to click the action button
      const actionButtons = document.querySelectorAll('button');
      const targetButton = Array.from(actionButtons).find(btn => 
        btn.textContent.includes(eventType.replace('_', ' ').toUpperCase()) ||
        btn.textContent.includes(eventType.replace('_', ' ').toLowerCase())
      );
      
      if (targetButton) {
        targetButton.click();
        console.log(`✅ Action button clicked: ${eventType}`);
        testResults.successfulEvents++;
        
        // Wait a bit for modal to appear
        await delay(1000);
        
        // Try to handle the modal by clicking "No" or "Cancel" buttons
        const modalButtons = document.querySelectorAll('.ant-modal button');
        const cancelButton = Array.from(modalButtons).find(btn => 
          btn.textContent.includes('No') || 
          btn.textContent.includes('Cancel') ||
          btn.textContent.includes('Skip')
        );
        
        if (cancelButton) {
          cancelButton.click();
          console.log(`✅ Modal handled for: ${eventType}`);
        }
      } else {
        console.log(`⚠️ Action button not found for ${eventType}`);
        testResults.failedEvents++;
      }
    }
    
    testResults.totalEvents++;
    
  } catch (error) {
    console.log(`❌ Error testing ${eventType}:`, error.message);
    testResults.failedEvents++;
    testResults.errors.push({ eventType, error: error.message });
  }
};

// Run the test
const runTest = async () => {
  console.log('🔧 Waiting for Live Stat Tracker to load...');
  
  const functionsReady = await waitForFunctions();
  if (!functionsReady) {
    console.log('❌ Live Stat Tracker not ready. Please ensure you are on the correct page.');
    return;
  }
  
  console.log('✅ Live Stat Tracker ready, starting test...');
  
  // Test each event type
  for (const eventType of TEST_EVENTS) {
    await testSingleEvent(eventType);
    await delay(1000); // Wait between events
  }
  
  // Generate report
  console.log('\n📊 === TEST REPORT ===');
  console.log(`🎮 Total Events: ${testResults.totalEvents}`);
  console.log(`✅ Successful: ${testResults.successfulEvents}`);
  console.log(`❌ Failed: ${testResults.failedEvents}`);
  console.log(`📈 Success Rate: ${((testResults.successfulEvents / testResults.totalEvents) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.eventType}: ${error.error}`);
    });
  }
  
  console.log('\n🎉 Test complete!');
};

// Auto-run the test
runTest();

// Export for manual use
window.runSimpleTest = runTest;
