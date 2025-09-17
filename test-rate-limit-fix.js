// Test script to verify rate limiting fix
// This simulates multiple rapid API calls to test both client and server-side caching

const testRateLimitFix = async () => {
  console.log('🧪 Testing comprehensive rate limiting fix...')
  console.log('📋 Testing both client-side session caching and server-side user caching')
  
  // Test 1: Multiple rapid API calls (like RecentActivityModule does)
  const apiCalls = [
    '/api/tasks?perPage=50',
    '/api/events?perPage=50', 
    '/api/players?perPage=10'
  ]
  
  console.log('\n📡 Test 1: Making 3 parallel API calls...')
  const startTime = Date.now()
  
  try {
    // Make parallel calls like the RecentActivityModule does
    const responses = await Promise.all(
      apiCalls.map(async (url) => {
        console.log(`  → Calling ${url}`)
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    )
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('✅ All API calls successful!')
    console.log(`⏱️  Total time: ${duration}ms`)
    console.log('📊 Results:')
    responses.forEach((data, index) => {
      const dataLength = Array.isArray(data) ? data.length : (data.data?.length || 0)
      console.log(`  - ${apiCalls[index]}: ${dataLength} items`)
    })
    
    // Check if we got rate limited
    if (duration < 1000) {
      console.log('🚀 Fast response - caching is working!')
    } else {
      console.log('⚠️  Slow response - may indicate rate limiting issues')
    }
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message)
    
    if (error.message.includes('429')) {
      console.error('🚫 Rate limit error detected! The fix may need adjustment.')
    } else {
      console.error('🔧 Other error - check your setup')
    }
  }
  
  // Test 2: Rapid sequential calls to test server-side caching
  console.log('\n📡 Test 2: Making 5 rapid sequential calls to /api/players...')
  const sequentialStartTime = Date.now()
  
  try {
    const sequentialResponses = []
    for (let i = 0; i < 5; i++) {
      console.log(`  → Call ${i + 1}/5`)
      const response = await fetch('/api/players?perPage=5')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      sequentialResponses.push(data)
    }
    
    const sequentialEndTime = Date.now()
    const sequentialDuration = sequentialEndTime - sequentialStartTime
    
    console.log('✅ All sequential calls successful!')
    console.log(`⏱️  Sequential time: ${sequentialDuration}ms`)
    console.log(`📈 Average per call: ${Math.round(sequentialDuration / 5)}ms`)
    
    if (sequentialDuration < 2000) {
      console.log('🚀 Fast sequential response - server-side caching is working!')
    } else {
      console.log('⚠️  Slow sequential response - may indicate server-side rate limiting')
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message)
    
    if (error.message.includes('429')) {
      console.error('🚫 Server-side rate limit error detected!')
    }
  }
  
  console.log('\n🎯 Rate limiting fix test complete!')
  console.log('💡 If you see 429 errors, the fix needs more work.')
  console.log('💡 If all tests pass quickly, the fix is working!')
}

// Run the test
if (typeof window !== 'undefined') {
  // Browser environment
  testRateLimitFix()
} else {
  // Node environment
  console.log('Run this test in the browser console after logging in')
}
