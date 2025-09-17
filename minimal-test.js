// Minimal Live Stat Tracker Test
// This is the simplest test that just clicks UI elements

console.log('🏀 Starting Minimal Test...');

// Test results
let results = { clicks: 0, successes: 0, failures: 0 };

// Simple delay function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test function
const test = async () => {
  console.log('🔍 Looking for clickable elements...');
  
  // Find all buttons
  const buttons = document.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons`);
  
  // Test each button
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const button = buttons[i];
    const buttonText = button.textContent.trim();
    
    if (buttonText && !button.disabled) {
      try {
        console.log(`Clicking: "${buttonText}"`);
        button.click();
        results.clicks++;
        results.successes++;
        console.log('✅ Clicked successfully');
        
        // Wait a bit
        await wait(1000);
        
        // Try to close any modals
        const modals = document.querySelectorAll('.ant-modal');
        if (modals.length > 0) {
          console.log('🎭 Modal detected, closing...');
          const closeBtn = document.querySelector('.ant-modal .ant-btn, .ant-modal button');
          if (closeBtn) closeBtn.click();
        }
        
      } catch (error) {
        console.log(`❌ Error clicking "${buttonText}":`, error.message);
        results.failures++;
      }
    }
  }
  
  // Report results
  console.log('\n📊 Results:');
  console.log(`Clicks: ${results.clicks}`);
  console.log(`Successes: ${results.successes}`);
  console.log(`Failures: ${results.failures}`);
  console.log('🎉 Test complete!');
};

// Run the test
test();

// Export
window.runMinimalTest = test;



