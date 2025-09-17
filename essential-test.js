// Essential Live Stat Tracker Test
// This test does the minimum required steps to test the system

console.log('🏀 Starting Essential Live Stat Tracker Test...');

let results = { steps: 0, successes: 0, failures: 0 };
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, success = true) => {
  console.log(`${success ? '✅' : '❌'} ${message}`);
  results.steps++;
  if (success) results.successes++; else results.failures++;
};

const clickButton = async (text) => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const button = buttons.find(btn => btn.textContent.includes(text));
  
  if (button && !button.disabled) {
    button.click();
    log(`Clicked: ${text}`);
    await wait(1000);
    
    // Handle modals
    const modals = document.querySelectorAll('.ant-modal');
    if (modals.length > 0) {
      log('Modal appeared, closing...');
      const closeBtn = document.querySelector('.ant-modal button');
      if (closeBtn) closeBtn.click();
      await wait(500);
    }
    
    return true;
  } else {
    log(`Button not found or disabled: ${text}`, false);
    return false;
  }
};

const runEssentialTest = async () => {
  console.log('🚀 Starting essential test...');
  
  // Step 1: Start the game
  log('Step 1: Starting game...');
  await clickButton('Start Tracking');
  await wait(2000);
  
  // Step 2: Select a player
  log('Step 2: Selecting player...');
  const playerCards = document.querySelectorAll('[class*="playerCard"], .ant-card');
  if (playerCards.length > 0) {
    playerCards[0].click();
    log('Player selected');
    await wait(500);
  } else {
    log('No player cards found', false);
  }
  
  // Step 3: Test action buttons
  log('Step 3: Testing action buttons...');
  const actions = ['2PT Made', '3PT Made', 'Assist', 'Rebound', 'Steal', 'Turnover'];
  
  for (const action of actions) {
    await clickButton(action);
    await wait(1500);
  }
  
  // Step 4: Check results
  log('Step 4: Checking results...');
  const events = document.querySelectorAll('[class*="event"], [class*="play"]');
  log(`Found ${events.length} events in UI`);
  
  // Final report
  console.log('\n📊 RESULTS:');
  console.log(`Steps: ${results.steps}`);
  console.log(`Successes: ${results.successes}`);
  console.log(`Failures: ${results.failures}`);
  console.log(`Success Rate: ${((results.successes / results.steps) * 100).toFixed(1)}%`);
  console.log('\n🎉 Essential test complete!');
};

// Run the test
runEssentialTest();

// Export
window.runEssentialTest = runEssentialTest;



