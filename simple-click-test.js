// Simple Click Test for Live Stat Tracker
// This test just clicks buttons and handles errors gracefully

console.log('🏀 Starting Simple Click Test...');

// Test results
let results = {
  clicks: 0,
  successes: 0,
  failures: 0,
  modals: 0
};

// Simple delay function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Click a button and handle the result
const clickButton = async (button, buttonText) => {
  try {
    console.log(`Clicking: "${buttonText}"`);
    button.click();
    results.clicks++;
    results.successes++;
    console.log('✅ Clicked successfully');
    
    // Wait for any modals
    await wait(1000);
    
    // Check for modals
    const modals = document.querySelectorAll('.ant-modal');
    if (modals.length > 0) {
      console.log('🎭 Modal detected');
      results.modals++;
      
      // Try to close the modal
      const closeButtons = document.querySelectorAll('.ant-modal button');
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
        // Try pressing Escape
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        console.log('✅ Pressed Escape');
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error clicking "${buttonText}":`, error.message);
    results.failures++;
    return false;
  }
};

// Main test function
const runSimpleTest = async () => {
  console.log('🔍 Looking for clickable elements...');
  
  // Find all buttons
  const buttons = document.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons`);
  
  // Filter for relevant buttons
  const relevantButtons = Array.from(buttons).filter(button => {
    const text = button.textContent.trim();
    return text && 
           !button.disabled && 
           (text.includes('Made') || 
            text.includes('Miss') || 
            text.includes('Assist') || 
            text.includes('Rebound') || 
            text.includes('Steal') || 
            text.includes('Turnover') || 
            text.includes('Foul') || 
            text.includes('Block') ||
            text.includes('Start') ||
            text.includes('Play') ||
            text.includes('Sub') ||
            text.includes('Quick'))
  });
  
  console.log(`Found ${relevantButtons.length} relevant buttons`);
  
  // Test each relevant button
  for (let i = 0; i < Math.min(relevantButtons.length, 8); i++) {
    const button = relevantButtons[i];
    const buttonText = button.textContent.trim();
    
    await clickButton(button, buttonText);
    await wait(2000); // Wait between clicks
  }
  
  // Report results
  console.log('\n📊 === SIMPLE CLICK TEST RESULTS ===');
  console.log(`🎬 Total Clicks: ${results.clicks}`);
  console.log(`✅ Successful: ${results.successes}`);
  console.log(`❌ Failed: ${results.failures}`);
  console.log(`🎭 Modals Handled: ${results.modals}`);
  console.log(`📈 Success Rate: ${((results.successes / results.clicks) * 100).toFixed(1)}%`);
  
  // Check for events in the UI
  const eventElements = document.querySelectorAll('[class*="event"], [class*="play"], [class*="timeline"]');
  console.log(`📋 Found ${eventElements.length} event elements in the UI`);
  
  // Check for player stats
  const playerStats = document.querySelectorAll('[class*="player"], [class*="stat"]');
  console.log(`👥 Found ${playerStats.length} player/stat elements`);
  
  console.log('\n🎉 Simple click test complete!');
  console.log('💡 Check the play-by-play feed and player stats to see if events were recorded.');
};

// Run the test
runSimpleTest();

// Export for manual use
window.runSimpleClickTest = runSimpleTest;
