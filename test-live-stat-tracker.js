// Live Stat Tracker Test Script
// Run this in the browser console to test the data flow

console.log('🧪 Starting Live Stat Tracker Test...');

// Test 1: Check if game is started
function testGameStarted() {
  console.log('Test 1: Checking if game is started...');
  
  // Check if game state exists
  if (typeof gameState !== 'undefined') {
    console.log('✅ Game state found:', gameState);
    if (gameState.isPlaying) {
      console.log('✅ Game is playing');
      return true;
    } else {
      console.log('❌ Game is not playing');
      return false;
    }
  } else {
    console.log('❌ Game state not found');
    return false;
  }
}

// Test 2: Check if players are loaded
function testPlayersLoaded() {
  console.log('Test 2: Checking if players are loaded...');
  
  if (typeof players !== 'undefined' && players.length > 0) {
    console.log('✅ Players loaded:', players.length);
    console.log('Players:', players.map(p => ({ id: p.id, name: p.name, isOnCourt: p.isOnCourt })));
    return true;
  } else {
    console.log('❌ No players loaded');
    return false;
  }
}

// Test 3: Check if lineup exists
function testLineupExists() {
  console.log('Test 3: Checking if lineup exists...');
  
  if (typeof currentLineup !== 'undefined' && currentLineup) {
    console.log('✅ Lineup exists:', currentLineup);
    return true;
  } else {
    console.log('❌ No lineup exists');
    return false;
  }
}

// Test 4: Test player selection
function testPlayerSelection() {
  console.log('Test 4: Testing player selection...');
  
  if (typeof players !== 'undefined' && players.length > 0) {
    const firstPlayer = players[0];
    console.log('Selecting player:', firstPlayer.name);
    
    // Simulate player selection
    if (typeof selectPlayer === 'function') {
      selectPlayer(firstPlayer);
      console.log('✅ Player selection function called');
      return true;
    } else {
      console.log('❌ selectPlayer function not found');
      return false;
    }
  } else {
    console.log('❌ No players available for selection');
    return false;
  }
}

// Test 5: Test action recording
function testActionRecording() {
  console.log('Test 5: Testing action recording...');
  
  if (typeof selectedPlayer !== 'undefined' && selectedPlayer) {
    console.log('Selected player:', selectedPlayer.name);
    
    // Test recording a simple action
    if (typeof handleStatEvent === 'function') {
      console.log('Recording test event...');
      handleStatEvent(selectedPlayer.id, 'fg_made', 2, false);
      console.log('✅ Action recording function called');
      return true;
    } else {
      console.log('❌ handleStatEvent function not found');
      return false;
    }
  } else {
    console.log('❌ No player selected for action recording');
    return false;
  }
}

// Test 6: Check database connection
function testDatabaseConnection() {
  console.log('Test 6: Testing database connection...');
  
  // Check if liveSessionKey exists
  if (typeof liveSessionKey !== 'undefined' && liveSessionKey) {
    console.log('✅ Live session key found:', liveSessionKey);
    return true;
  } else {
    console.log('❌ No live session key found');
    return false;
  }
}

// Test 7: Check events array
function testEventsArray() {
  console.log('Test 7: Checking events array...');
  
  if (typeof events !== 'undefined' && Array.isArray(events)) {
    console.log('✅ Events array found with', events.length, 'events');
    if (events.length > 0) {
      console.log('Recent events:', events.slice(0, 3));
    }
    return true;
  } else {
    console.log('❌ Events array not found');
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running all Live Stat Tracker tests...\n');
  
  const tests = [
    testGameStarted,
    testPlayersLoaded,
    testLineupExists,
    testPlayerSelection,
    testActionRecording,
    testDatabaseConnection,
    testEventsArray
  ];
  
  let passed = 0;
  let total = tests.length;
  
  tests.forEach((test, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    try {
      if (test()) {
        passed++;
      }
    } catch (error) {
      console.log('❌ Test failed with error:', error);
    }
  });
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Live Stat Tracker is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the console output above for details.');
  }
}

// Manual test functions
function manualTestPlayerClick(playerIndex = 0) {
  console.log('🎯 Manual test: Clicking on player', playerIndex);
  
  if (typeof players !== 'undefined' && players[playerIndex]) {
    const player = players[playerIndex];
    console.log('Clicking on player:', player.name);
    
    // Simulate click
    if (typeof selectPlayer === 'function') {
      selectPlayer(player);
      console.log('✅ Player click simulated');
    } else {
      console.log('❌ selectPlayer function not available');
    }
  } else {
    console.log('❌ Player not found at index', playerIndex);
  }
}

function manualTestActionClick(actionType = 'fg_made') {
  console.log('🎬 Manual test: Clicking action button', actionType);
  
  if (typeof selectedPlayer !== 'undefined' && selectedPlayer) {
    console.log('Selected player:', selectedPlayer.name);
    
    // Simulate action button click
    if (typeof recordAction === 'function') {
      recordAction(actionType);
      console.log('✅ Action button click simulated');
    } else {
      console.log('❌ recordAction function not available');
    }
  } else {
    console.log('❌ No player selected. Please select a player first.');
  }
}

// Export functions for manual testing
window.testLiveStatTracker = {
  runAllTests,
  manualTestPlayerClick,
  manualTestActionClick,
  testGameStarted,
  testPlayersLoaded,
  testLineupExists,
  testPlayerSelection,
  testActionRecording,
  testDatabaseConnection,
  testEventsArray
};

console.log('🧪 Test functions loaded. Use testLiveStatTracker.runAllTests() to run all tests.');
console.log('🧪 Manual tests: testLiveStatTracker.manualTestPlayerClick(0) and testLiveStatTracker.manualTestActionClick("fg_made")');
