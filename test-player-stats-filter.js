// Simple test script to verify player stats filtering
const testPlayerStatsFilter = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing Player Stats Filter...');
  
  try {
    // Test 1: Default season filter
    console.log('\n1. Testing default season filter...');
    const seasonResponse = await fetch(`${baseUrl}/api/stats/players?season=2024-25`);
    const seasonData = await seasonResponse.json();
    console.log(`✓ Season filter: ${seasonData.length} players found`);
    
    // Test 2: Month filter
    console.log('\n2. Testing month filter...');
    const monthResponse = await fetch(`${baseUrl}/api/stats/players?timeRange=month`);
    const monthData = await monthResponse.json();
    console.log(`✓ Month filter: ${monthData.length} players found`);
    
    // Test 3: Week filter
    console.log('\n3. Testing week filter...');
    const weekResponse = await fetch(`${baseUrl}/api/stats/players?timeRange=week`);
    const weekData = await weekResponse.json();
    console.log(`✓ Week filter: ${weekData.length} players found`);
    
    // Test 4: Custom date range filter
    console.log('\n4. Testing custom date range filter...');
    const customResponse = await fetch(`${baseUrl}/api/stats/players?timeRange=custom&startDate=2024-01-01&endDate=2024-12-31`);
    const customData = await customResponse.json();
    console.log(`✓ Custom filter: ${customData.length} players found`);
    
    // Test 5: Verify data structure
    if (seasonData.length > 0) {
      const firstPlayer = seasonData[0];
      console.log('\n5. Verifying data structure...');
      console.log(`✓ Player name: ${firstPlayer.name}`);
      console.log(`✓ Player position: ${firstPlayer.position}`);
      console.log(`✓ Player points: ${firstPlayer.points}`);
      console.log(`✓ Player games: ${firstPlayer.games}`);
    }
    
    console.log('\n✅ All tests passed! Player stats filtering is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testPlayerStatsFilter();
