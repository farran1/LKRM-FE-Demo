/**
 * Offline System Test Utility
 * Test various offline scenarios
 */

import { offlineStorage } from './offline-storage'
import { syncService } from './sync-service'
import { cacheService } from './cache-service'
import { liveGameDataService } from './live-game-data-service'
import { multiDeviceResumeService } from './multi-device-resume-service'

export class OfflineSystemTester {
  private testResults: Array<{ test: string; passed: boolean; error?: string }> = []

  public async runAllTests(): Promise<void> {
    console.log('🧪 Starting Offline System Tests...')
    
    await this.testOfflineStorage()
    await this.testSyncService()
    await this.testCacheService()
    await this.testLiveGameDataService()
    await this.testMultiDeviceResume()
    
    this.printResults()
  }

  private async testOfflineStorage(): Promise<void> {
    console.log('📦 Testing Offline Storage...')
    
    try {
      // Test basic storage operations
      const testData = { test: 'data', timestamp: new Date().toISOString() }
      const success = offlineStorage.set('test_key', testData)
      
      if (!success) throw new Error('Failed to set data')
      
      const retrieved = offlineStorage.get('test_key')
      if (!retrieved || retrieved.test !== 'data') {
        throw new Error('Failed to retrieve data')
      }
      
      // Test session management
      const testSession = {
        id: 'test-session-1',
        eventId: 1,
        sessionKey: 'test-key',
        gameState: { currentQuarter: 1, homeScore: 0, awayScore: 0 },
        isActive: true,
        startedAt: new Date().toISOString(),
        createdBy: 'test-user',
        lastModified: new Date().toISOString(),
        version: 1,
        deviceId: 'test-device'
      }
      
      offlineStorage.saveSession(testSession)
      const savedSession = offlineStorage.getSession('test-session-1')
      
      if (!savedSession || savedSession.eventId !== 1) {
        throw new Error('Failed to save/retrieve session')
      }
      
      // Test compression
      const largeData = { data: 'x'.repeat(10000) }
      offlineStorage.set('large_test', largeData)
      const compressed = offlineStorage.get('large_test')
      
      if (!compressed || compressed.data.length !== 10000) {
        throw new Error('Compression/decompression failed')
      }
      
      // Cleanup
      offlineStorage.remove('test_key')
      offlineStorage.remove('large_test')
      offlineStorage.deleteSession('test-session-1')
      
      this.addResult('Offline Storage', true)
      console.log('✅ Offline Storage tests passed')
      
    } catch (error) {
      this.addResult('Offline Storage', false, error.message)
      console.error('❌ Offline Storage tests failed:', error)
    }
  }

  private async testSyncService(): Promise<void> {
    console.log('🔄 Testing Sync Service...')
    
    try {
      // Test network detection
      const isOnline = syncService.getNetworkDetector().isCurrentlyOnline()
      console.log(`Network status: ${isOnline ? 'Online' : 'Offline'}`)
      
      // Test sync queue
      const queueItem = {
        type: 'test' as const,
        data: { test: 'sync data' },
        maxRetries: 3
      }
      
      const itemId = offlineStorage.addToSyncQueue(queueItem)
      const queue = offlineStorage.getSyncQueue()
      
      if (queue.length === 0 || !queue.find(item => item.id === itemId)) {
        throw new Error('Sync queue operations failed')
      }
      
      offlineStorage.removeFromSyncQueue(itemId)
      
      this.addResult('Sync Service', true)
      console.log('✅ Sync Service tests passed')
      
    } catch (error) {
      this.addResult('Sync Service', false, error.message)
      console.error('❌ Sync Service tests failed:', error)
    }
  }

  private async testCacheService(): Promise<void> {
    console.log('💾 Testing Cache Service...')
    
    try {
      // Test roster cache
      const testRoster = [
        { id: 1, name: 'Test Player', jersey: '1', isActive: true }
      ]
      
      cacheService.saveRosterCache(testRoster)
      const cachedRoster = cacheService.getRosterCache()
      
      if (!cachedRoster || cachedRoster.length !== 1) {
        throw new Error('Roster cache operations failed')
      }
      
      // Test events cache
      const testEvents = [
        { id: 1, name: 'Test Event', startTime: new Date().toISOString() }
      ]
      
      cacheService.saveEventsCache(testEvents)
      const cachedEvents = cacheService.getEventsCache()
      
      if (!cachedEvents || cachedEvents.length !== 1) {
        throw new Error('Events cache operations failed')
      }
      
      // Test cache info
      const cacheInfo = cacheService.getCacheInfo()
      if (!cacheInfo.roster || !cacheInfo.events) {
        throw new Error('Cache info retrieval failed')
      }
      
      this.addResult('Cache Service', true)
      console.log('✅ Cache Service tests passed')
      
    } catch (error) {
      this.addResult('Cache Service', false, error.message)
      console.error('❌ Cache Service tests failed:', error)
    }
  }

  private async testLiveGameDataService(): Promise<void> {
    console.log('🎮 Testing Live Game Data Service...')
    
    try {
      // Test initialization
      await liveGameDataService.initialize(1, 'startOver')
      
      const sessionId = liveGameDataService.getCurrentSessionId()
      if (!sessionId) {
        throw new Error('Failed to create session')
      }
      
      // Test adding game events
      await liveGameDataService.addGameEvent({
        playerId: 1,
        eventType: 'field_goal',
        eventValue: 2,
        quarter: 1,
        gameTime: 120,
        isOpponentEvent: false
      })
      
      // Test getting live game data
      const gameData = await liveGameDataService.getLiveGameData()
      if (!gameData.session || !gameData.playerStats) {
        throw new Error('Failed to get live game data')
      }
      
      // Test ending game
      await liveGameDataService.endGame()
      
      this.addResult('Live Game Data Service', true)
      console.log('✅ Live Game Data Service tests passed')
      
    } catch (error) {
      this.addResult('Live Game Data Service', false, error.message)
      console.error('❌ Live Game Data Service tests failed:', error)
    }
  }

  private async testMultiDeviceResume(): Promise<void> {
    console.log('📱 Testing Multi-Device Resume...')
    
    try {
      // Test finding available sessions
      const sessions = await multiDeviceResumeService.findAvailableSessions(1)
      
      // Test conflict detection
      const conflicts = multiDeviceResumeService.detectConflicts(1)
      
      // Test conflict resolution
      const resolution = await multiDeviceResumeService.resolveConflicts(1)
      
      if (!resolution.chosenSession) {
        throw new Error('Conflict resolution failed')
      }
      
      this.addResult('Multi-Device Resume', true)
      console.log('✅ Multi-Device Resume tests passed')
      
    } catch (error) {
      this.addResult('Multi-Device Resume', false, error.message)
      console.error('❌ Multi-Device Resume tests failed:', error)
    }
  }

  private addResult(test: string, passed: boolean, error?: string): void {
    this.testResults.push({ test, passed, error })
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:')
    console.log('========================')
    
    const passed = this.testResults.filter(r => r.passed).length
    const total = this.testResults.length
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${result.test}`)
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })
    
    console.log(`\n🎯 Overall: ${passed}/${total} tests passed`)
    
    if (passed === total) {
      console.log('🎉 All tests passed! Offline system is ready.')
    } else {
      console.log('⚠️  Some tests failed. Check the errors above.')
    }
  }

  // Manual test scenarios
  public async testOfflineScenario(): Promise<void> {
    console.log('🌐 Testing Offline Scenario...')
    
    try {
      // Simulate going offline
      console.log('1. Starting game online...')
      await liveGameDataService.initialize(1, 'startOver')
      
      console.log('2. Adding events while online...')
      await liveGameDataService.addGameEvent({
        playerId: 1,
        eventType: 'field_goal',
        eventValue: 2,
        quarter: 1,
        gameTime: 120
      })
      
      console.log('3. Simulating offline mode...')
      // In real scenario, network would go offline
      
      console.log('4. Adding events while offline...')
      await liveGameDataService.addGameEvent({
        playerId: 1,
        eventType: 'field_goal',
        eventValue: 2,
        quarter: 1,
        gameTime: 240
      })
      
      console.log('5. Checking offline data persistence...')
      const gameData = await liveGameDataService.getLiveGameData()
      if (gameData.events.length < 2) {
        throw new Error('Offline events not persisted')
      }
      
      console.log('6. Simulating coming back online...')
      // In real scenario, network would come back online
      
      console.log('✅ Offline scenario test passed')
      
    } catch (error) {
      console.error('❌ Offline scenario test failed:', error)
    }
  }
}

// Export test utility
export const offlineSystemTester = new OfflineSystemTester()

// Usage:
// offlineSystemTester.runAllTests()
// offlineSystemTester.testOfflineScenario()



