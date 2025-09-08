// Debug utilities for Live Stat Tracker data conflicts
// Use these in browser console to diagnose and fix data issues

import { enhancedLiveStatTrackerService } from '../services/enhancedLiveStatTrackerService'

// Add to global window object for console access
declare global {
  interface Window {
    liveStatDebug: {
      checkDataConflicts: (eventId: number) => Promise<void>
      forceCleanup: (eventId: number) => Promise<void>
      listAllData: () => void
      clearAllData: () => void
      getStorageInfo: () => void
    }
  }
}

// Debug utilities
const liveStatDebug = {
  // Check for data conflicts for a specific event
  async checkDataConflicts(eventId: number) {
    console.log(`🔍 Checking data conflicts for event ${eventId}...`)
    
    try {
      const svc: any = enhancedLiveStatTrackerService as any
      const result = typeof svc.validateAndReconcileData === 'function'
        ? await svc.validateAndReconcileData(eventId)
        : { conflicts: [], resolved: false, activeSession: null }
      
      console.log('📊 Validation Results:')
      console.log('- Conflicts found:', result.conflicts)
      console.log('- Conflicts resolved:', result.resolved)
      console.log('- Active session:', result.activeSession)
      
      if (result.conflicts.length === 0) {
        console.log('✅ No conflicts found!')
      } else {
        console.log('⚠️ Conflicts detected. Running cleanup...')
        if (result.resolved) {
          console.log('✅ Conflicts automatically resolved')
        } else {
          console.log('❌ Some conflicts could not be auto-resolved')
          console.log('💡 Try running: liveStatDebug.forceCleanup(' + eventId + ')')
        }
      }
    } catch (error) {
      console.error('❌ Error checking conflicts:', error)
    }
  },

  // Force cleanup of all data for an event
  async forceCleanup(eventId: number) {
    console.log(`🧹 Force cleaning up all data for event ${eventId}...`)
    
    const confirmed = confirm(
      `This will permanently delete ALL data for event ${eventId} including:\n` +
      `- All offline sessions\n` +
      `- All localStorage data\n` +
      `- All active online sessions\n\n` +
      `Are you sure you want to continue?`
    )
    
    if (!confirmed) {
      console.log('❌ Cleanup cancelled')
      return
    }
    
    try {
      const svc: any = enhancedLiveStatTrackerService as any
      if (typeof svc.forceCleanupEvent === 'function') {
        await svc.forceCleanupEvent(eventId)
      } else {
        // Fallback: clear local offline data for all sessions
        enhancedLiveStatTrackerService.clearAllOfflineData()
      }
      console.log('✅ Force cleanup completed!')
      console.log('💡 You can now start a fresh session for this event')
    } catch (error) {
      console.error('❌ Error during force cleanup:', error)
    }
  },

  // List all stored data
  listAllData() {
    console.log('📋 All Live Stat Tracker Data:')
    
    // Enhanced service data
    const offlineSessions = enhancedLiveStatTrackerService.getOfflineSessions()
    console.log('🔧 Enhanced Service Sessions:', offlineSessions.length)
    offlineSessions.forEach((session, index) => {
      console.log(`  ${index + 1}. Event ${session.eventId} - ${session.sessionKey}`)
      console.log(`     Status: ${session.syncStatus}, Events: ${session.events.length}`)
    })
    
    // Old localStorage data
    console.log('🗄️ Old localStorage Data:')
    const oldDataKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('basketball-') || 
        key.startsWith('enhanced-live-stat-tracker-')
      )) {
        oldDataKeys.push(key)
      }
    }
    
    if (oldDataKeys.length === 0) {
      console.log('  (No old data found)')
    } else {
      oldDataKeys.forEach(key => {
        const data = localStorage.getItem(key)
        const size = data ? (data.length / 1024).toFixed(2) : '0'
        console.log(`  - ${key} (${size} KB)`)
      })
    }
  },

  // Clear all data (use with extreme caution)
  clearAllData() {
    const confirmed = confirm(
      'This will permanently delete ALL live stat tracker data including:\n' +
      '- All offline sessions for all events\n' +
      '- All localStorage data\n\n' +
      'This action cannot be undone. Are you sure?'
    )
    
    if (!confirmed) {
      console.log('❌ Clear all cancelled')
      return
    }
    
    console.log('🧹 Clearing all live stat tracker data...')
    
    // Clear enhanced service data
    enhancedLiveStatTrackerService.clearAllOfflineData()
    
    // Clear all localStorage data
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('basketball-') || 
        key.startsWith('enhanced-live-stat-tracker-')
      )) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('✅ All data cleared!')
    console.log(`📊 Removed ${keysToRemove.length} localStorage entries`)
  },

  // Get storage information
  getStorageInfo() {
    console.log('📊 Storage Information:')
    
    const usage = enhancedLiveStatTrackerService.getStorageUsage()
    console.log('🔧 Enhanced Service Storage:')
    console.log(`  Used: ${(usage.used / 1024).toFixed(2)} KB`)
    console.log(`  Available: ${(usage.available / 1024).toFixed(2)} KB`)
    console.log(`  Usage: ${usage.percentage}%`)
    
    // Calculate total localStorage usage
    let totalLocalStorage = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const data = localStorage.getItem(key)
        if (data) {
          totalLocalStorage += data.length
        }
      }
    }
    
    console.log('🗄️ Total localStorage Usage:')
    console.log(`  Used: ${(totalLocalStorage / 1024).toFixed(2)} KB`)
    console.log(`  Estimated Available: ${(5 * 1024).toFixed(2)} KB`) // 5MB typical limit
    console.log(`  Usage: ${((totalLocalStorage / (5 * 1024 * 1024)) * 100).toFixed(2)}%`)
  }
}

// Attach to window for console access
if (typeof window !== 'undefined') {
  window.liveStatDebug = liveStatDebug
}

export default liveStatDebug
