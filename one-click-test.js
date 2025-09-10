// One-Click Live Stat Tracker Test
// Copy and paste this entire script into the browser console

console.log('🏀 Starting One-Click Live Stat Tracker Test...');

// Test configuration
const TEST_CONFIG = {
  totalEvents: 50,
  delayBetweenEvents: 800,
  testModalEvents: true,
  testDirectEvents: true
};

// Test results
const testResults = {
  totalEvents: 0,
  successfulEvents: 0,
  failedEvents: 0,
  errors: []
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomPlayer = () => {
  // Try to access players from different possible locations
  let playersList = null;
  
  // Check if players is in global scope
  if (typeof players !== 'undefined' && players.length > 0) {
    playersList = players;
  }
  // Check if players is in a React component state
  else if (typeof window !== 'undefined' && window.React) {
    // Try to find players in React component state
    const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
    if (reactRoot && reactRoot._reactInternalFiber) {
      // This is a more complex approach - let's try a simpler method
    }
  }
  
  if (!playersList) {
    console.log('❌ Players not found. Please ensure you are on the Live Stat Tracker page with players loaded.');
    return null;
  }
  
  const onCourtPlayers = playersList.filter(p => p.isOnCourt);
  return onCourtPlayers.length > 0 ? onCourtPlayers[0] : playersList[0];
};

const logResult = (success, message, event = null) => {
  testResults.totalEvents++;
  if (success) {
    testResults.successfulEvents++;
    console.log(`✅ ${message}`);
  } else {
    testResults.failedEvents++;
    testResults.errors.push({ message, event });
    console.log(`❌ ${message}`);
  }
};

// Test functions
const testPlayerSelection = async () => {
  console.log('🎯 Testing player selection...');
  const player = getRandomPlayer();
  if (!player) {
    logResult(false, 'No players available for selection');
    return false;
  }
  
  try {
    selectPlayer(player);
    await delay(200);
    logResult(true, `Player selected: ${player.name}`);
    return true;
  } catch (error) {
    logResult(false, `Player selection failed: ${error.message}`);
    return false;
  }
};

const testDirectEvent = async (eventType) => {
  console.log(`⚡ Testing direct event: ${eventType}`);
  const player = getRandomPlayer();
  if (!player) {
    logResult(false, `No player for ${eventType}`);
    return false;
  }
  
  try {
    handleStatEvent(player.id, eventType, 2, false);
    logResult(true, `Direct event recorded: ${eventType} for ${player.name}`);
    return true;
  } catch (error) {
    logResult(false, `Direct event failed: ${error.message}`);
    return false;
  }
};

const testModalEvent = async (eventType) => {
  console.log(`🎭 Testing modal event: ${eventType}`);
  const player = getRandomPlayer();
  if (!player) {
    logResult(false, `No player for ${eventType}`);
    return false;
  }
  
  try {
    // Select player first
    selectPlayer(player);
    await delay(200);
    
    // Trigger modal
    recordAction(eventType);
    await delay(1000);
    
    // Handle modal based on event type
    await handleModalForEvent(eventType);
    
    logResult(true, `Modal event recorded: ${eventType} for ${player.name}`);
    return true;
  } catch (error) {
    logResult(false, `Modal event failed: ${error.message}`);
    return false;
  }
};

const handleModalForEvent = async (eventType) => {
  switch (eventType) {
    case 'fg_made':
    case 'three_made':
      // Handle assist modal
      if (typeof handleAssistConfirm === 'function') {
        const hasAssist = Math.random() < 0.7;
        handleAssistConfirm(hasAssist ? getRandomPlayer()?.id : null);
      }
      break;
      
    case 'fg_missed':
    case 'three_missed':
    case 'ft_missed':
      // Handle rebound modal
      if (typeof handleReboundConfirm === 'function') {
        const hasRebound = Math.random() < 0.8;
        handleReboundConfirm(hasRebound ? getRandomPlayer()?.id : null, false);
      }
      break;
      
    case 'steal':
      // Handle steal modal
      if (typeof handleStealConfirm === 'function') {
        const hasTurnover = Math.random() < 0.9;
        handleStealConfirm(hasTurnover ? getRandomPlayer()?.id : null, false);
      }
      break;
      
    case 'turnover':
      // Handle turnover modal
      if (typeof handleTurnoverConfirm === 'function') {
        const hasSteal = Math.random() < 0.1;
        handleTurnoverConfirm(hasSteal ? getRandomPlayer()?.id : null, false);
      }
      break;
      
    case 'foul':
      // Handle foul modal
      if (typeof handleFoulConfirm === 'function') {
        const isOffensive = Math.random() < 0.2;
        handleFoulConfirm(isOffensive);
      }
      break;
      
    case 'block':
      // Handle block modal
      if (typeof handleBlockConfirm === 'function') {
        const hasBlocked = Math.random() < 0.95;
        handleBlockConfirm(hasBlocked ? getRandomPlayer()?.id : null);
      }
      break;
  }
};

const runComprehensiveTest = async () => {
  console.log('🧪 Starting comprehensive test...');
  
  // Check prerequisites
  if (typeof gameState === 'undefined') {
    console.log('❌ Not on live stat tracker page');
    return;
  }
  
  if (!gameState.isPlaying) {
    console.log('❌ Game not started. Please start the game first.');
    return;
  }
  
  if (!players || players.length === 0) {
    console.log('❌ No players loaded');
    return;
  }
  
  console.log('✅ Prerequisites met, starting test...');
  
  // Test direct events
  const directEvents = ['assist', 'rebound'];
  for (const eventType of directEvents) {
    await testDirectEvent(eventType);
    await delay(TEST_CONFIG.delayBetweenEvents);
  }
  
  // Test modal events
  const modalEvents = ['fg_made', 'three_made', 'fg_missed', 'steal', 'turnover', 'foul', 'block'];
  for (const eventType of modalEvents) {
    await testModalEvent(eventType);
    await delay(TEST_CONFIG.delayBetweenEvents);
  }
  
  // Generate report
  generateTestReport();
};

const generateTestReport = () => {
  console.log('\n📊 === ONE-CLICK TEST REPORT ===');
  console.log(`🎮 Total Events: ${testResults.totalEvents}`);
  console.log(`✅ Successful: ${testResults.successfulEvents}`);
  console.log(`❌ Failed: ${testResults.failedEvents}`);
  console.log(`📈 Success Rate: ${((testResults.successfulEvents / testResults.totalEvents) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.message}`);
    });
  }
  
  // Check database
  if (typeof events !== 'undefined' && events.length > 0) {
    console.log(`\n✅ Database: ${events.length} events saved`);
  } else {
    console.log('\n❌ Database: No events found');
  }
  
  console.log('\n🎉 Test complete!');
};

// Quick test functions
const quickTest = {
  // Test single event
  single: async (eventType = 'fg_made') => {
    console.log(`🧪 Quick test: ${eventType}`);
    await testPlayerSelection();
    await delay(200);
    await testModalEvent(eventType);
  },
  
  // Test all event types
  all: async () => {
    console.log('🧪 Quick test: All event types');
    const allEvents = ['fg_made', 'fg_missed', 'three_made', 'three_missed', 'assist', 'rebound', 'steal', 'turnover', 'foul', 'block'];
    for (const eventType of allEvents) {
      await testPlayerSelection();
      await delay(200);
      await testModalEvent(eventType);
      await delay(1000);
    }
  },
  
  // Test modal events only
  modals: async () => {
    console.log('🧪 Quick test: Modal events only');
    const modalEvents = ['fg_made', 'three_made', 'fg_missed', 'steal', 'turnover', 'foul', 'block'];
    for (const eventType of modalEvents) {
      await testPlayerSelection();
      await delay(200);
      await testModalEvent(eventType);
      await delay(1000);
    }
  }
};

// Export functions
window.quickTest = quickTest;
window.runComprehensiveTest = runComprehensiveTest;

// Auto-run if ready
if (typeof gameState !== 'undefined' && gameState.isPlaying) {
  console.log('🚀 Auto-running comprehensive test...');
  runComprehensiveTest();
} else {
  console.log('⚠️ Please start the game first, then run: runComprehensiveTest()');
}

console.log('🎮 One-Click Test loaded!');
console.log('📋 Available commands:');
console.log('  - runComprehensiveTest() - Run full test suite');
console.log('  - quickTest.single("fg_made") - Test single event');
console.log('  - quickTest.all() - Test all event types');
console.log('  - quickTest.modals() - Test modal events only');
