/**
 * Network Status Detector & Auto-Sync Service
 * Handles online/offline detection and automatic synchronization
 */

import { offlineStorage, SyncQueueItem } from './offline-storage'

export type NetworkStatus = 'online' | 'offline' | 'unknown'

export interface SyncStatus {
  isOnline: boolean
  lastSyncAt?: string
  pendingSyncs: number
  failedSyncs: number
  isSyncing: boolean
}

export interface SyncResult {
  success: boolean
  syncedItems: number
  failedItems: number
  errors: string[]
}

class NetworkDetector {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true
  private listeners: ((status: NetworkStatus) => void)[] = []
  private syncService: SyncService

  constructor(syncService: SyncService) {
    this.syncService = syncService
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners('online')
      // Auto-sync when coming back online
      this.syncService.autoSync()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners('offline')
    })

    // Periodic connectivity check (every 30 seconds)
    setInterval(() => {
      this.checkConnectivity()
    }, 30000)
  }

  private async checkConnectivity(): Promise<void> {
    try {
      // Use navigator.onLine for basic connectivity check
      // For a more robust check, we can probe a real API endpoint
      const { supabase } = await import('../lib/supabase')
      
      // Quick check to Supabase to verify connectivity
      const { error } = await (supabase as any).from('players').select('id').limit(1)
      
      const wasOnline = this.isOnline
      // If no error or navigator says we're online, consider it online
      this.isOnline = navigator.onLine && !error
      
      // Notify if status changed
      if (wasOnline !== this.isOnline) {
        this.notifyListeners(this.isOnline ? 'online' : 'offline')
        if (this.isOnline) {
          this.syncService.autoSync()
        }
      }
    } catch (error) {
      const wasOnline = this.isOnline
      this.isOnline = false
      
      if (wasOnline !== this.isOnline) {
        this.notifyListeners('offline')
      }
    }
  }

  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Error in network status listener:', error)
      }
    })
  }

  public getStatus(): NetworkStatus {
    return this.isOnline ? 'online' : 'offline'
  }

  public addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  public isCurrentlyOnline(): boolean {
    return this.isOnline
  }
}

class SyncService {
  private networkDetector: NetworkDetector
  private isSyncing: boolean = false
  private syncInterval?: NodeJS.Timeout
  private retryDelays: number[] = [1000, 2000, 4000, 8000, 16000] // Exponential backoff

  constructor() {
    this.networkDetector = new NetworkDetector(this)
    this.setupBackgroundSync()
  }

  private setupBackgroundSync(): void {
    // Background sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.networkDetector.isCurrentlyOnline() && !this.isSyncing) {
        this.autoSync()
      }
    }, 30000)
  }

  public async autoSync(): Promise<SyncResult> {
    if (this.isSyncing || !this.networkDetector.isCurrentlyOnline()) {
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: ['Sync already in progress or offline']
      }
    }

    this.isSyncing = true
    const result = await this.syncPendingItems()
    this.isSyncing = false

    return result
  }

  public async manualSync(): Promise<SyncResult> {
    return this.autoSync()
  }

  private async syncPendingItems(): Promise<SyncResult> {
    const queue = offlineStorage.getSyncQueue()
    if (queue.length === 0) {
      return {
        success: true,
        syncedItems: 0,
        failedItems: 0,
        errors: []
      }
    }

    let syncedItems = 0
    let failedItems = 0
    const errors: string[] = []

    // Process sync queue
    for (const item of queue) {
      try {
        const success = await this.syncItem(item)
        if (success) {
          syncedItems++
          offlineStorage.removeFromSyncQueue(item.id)
        } else {
          failedItems++
          this.handleSyncFailure(item)
        }
      } catch (error) {
        failedItems++
        errors.push(`Failed to sync ${item.type}: ${error}`)
        this.handleSyncFailure(item)
      }
    }

    return {
      success: failedItems === 0,
      syncedItems,
      failedItems,
      errors
    }
  }

  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      switch (item.type) {
        case 'session':
          return await this.syncSession(item.data)
        case 'event':
          return await this.syncEvent(item.data)
        case 'roster':
          return await this.syncRoster(item.data)
        case 'events':
          return await this.syncEvents(item.data)
        default:
          console.warn(`Unknown sync item type: ${item.type}`)
          return false
      }
    } catch (error) {
      console.error(`Sync failed for ${item.type}:`, error)
      return false
    }
  }

  private async syncSession(sessionData: any): Promise<boolean> {
    try {
      // Get current user for created_by field
      const { supabase } = await import('../lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      // Convert offline session to Supabase format
      const supabaseSession = {
        event_id: sessionData.eventId,
        game_id: sessionData.gameId,
        session_key: sessionData.sessionKey,
        game_state: sessionData.gameState,
        is_active: sessionData.isActive,
        started_at: sessionData.startedAt,
        ended_at: sessionData.endedAt,
        created_by: user?.id || '1f8ce1d9-1586-4ed3-b6db-e8fb4ae29b5c' // Fallback to known user ID
      }

      // Use SupabaseAPI directly instead of REST endpoint
      const { SupabaseAPI } = await import('./supabase-api')
      const supabaseAPI = new SupabaseAPI()
      
      // Create the session in Supabase
      const { cacheService } = await import('./cache-service')
      const event = await cacheService.getEventById(sessionData.eventId)
      
      if (!event) {
        throw new Error('Event not found for session creation')
      }
      
      const createdSession = await supabaseAPI.createLiveGameSession({
        event_id: sessionData.eventId,
        session_key: sessionData.sessionKey,
        game_id: null,
        started_at: sessionData.startedAt,
        quarter: sessionData.gameState.currentQuarter,
        home_score: sessionData.gameState.homeScore,
        away_score: sessionData.gameState.awayScore
      })
      
      if (createdSession) {
        // Store the mapping for future event syncs
        const offlineStorage = (await import('./offline-storage')).offlineStorage
        offlineStorage.storeSupabaseSessionMapping(sessionData.sessionKey, createdSession.id)
        console.log('✅ Session synced to Supabase successfully, mapping stored:', createdSession.id)
        return true
      } else {
        throw new Error('Failed to create session in Supabase')
      }
    } catch (error) {
      console.error('Session sync failed:', error)
      return false
    }
  }

  private async syncEvent(eventData: any): Promise<boolean> {
    try {
      console.log('🔄 Attempting to sync event:', eventData)
      console.log('🔄 Event sessionId:', eventData.sessionId)
      console.log('🔄 Event sessionId type:', typeof eventData.sessionId)
      
      // First, find the Supabase session ID using the stored mapping
      const sessionKey = `session_${eventData.sessionId}`
      
      // Check offline storage for the Supabase session mapping
      const offlineStorage = (await import('./offline-storage')).offlineStorage
      let supabaseSessionId = offlineStorage.getSupabaseSessionMapping(sessionKey)
      
      if (!supabaseSessionId) {
        console.error('❌ Could not find Supabase session mapping for key:', sessionKey)
        console.log('🔄 This event belongs to a session that has not been synced to Supabase yet')
        console.log('🔄 It will be synced once the session is created')
        return false // Don't use fallback - wait for proper session creation
      }
      
      // Get the session from Supabase to verify it exists
      const { SupabaseAPI } = await import('./supabase-api')
      const supabaseAPI = new SupabaseAPI()
      const sessions = await supabaseAPI.getLiveGameSessions()
      const supabaseSession = sessions.find((s: any) => s.id === supabaseSessionId)
      
      if (!supabaseSession) {
        console.error('❌ Supabase session not found for ID:', supabaseSessionId)
        return false
      }
      
      console.log('🔄 Found Supabase session ID:', supabaseSession.id, 'for session key:', sessionKey)
      
      // Convert offline event to Supabase format
      const supabaseEvent = {
        session_id: supabaseSession.id, // Use Supabase session ID instead of local UUID
        game_id: eventData.gameId,
        player_id: eventData.playerId,
        event_type: eventData.eventType,
        event_value: eventData.eventValue,
        quarter: eventData.quarter,
        is_opponent_event: eventData.isOpponentEvent,
        opponent_jersey: eventData.opponentJersey,
        metadata: eventData.metadata
      }

      console.log('🔄 Converted event for Supabase:', supabaseEvent)

      console.log('🔄 Calling SupabaseAPI.createLiveGameEvent...')
      
      // Insert the event in Supabase
      const result = await supabaseAPI.createLiveGameEvent(supabaseEvent)
      
      console.log('🔄 SupabaseAPI.createLiveGameEvent result:', result)
      
      if (result) {
        console.log('✅ Event synced to Supabase successfully')
        return true
      } else {
        console.error('❌ SupabaseAPI.createLiveGameEvent returned false')
        throw new Error('Failed to create event in Supabase')
      }
    } catch (error) {
      console.error('❌ Event sync failed:', error)
      return false
    }
  }

  private async syncRoster(rosterData: any): Promise<boolean> {
    try {
      // Roster sync is typically a cache refresh, not individual updates
      const response = await fetch('/api/players', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const roster = await response.json()
        offlineStorage.saveRosterCache(roster)
        return true
      }

      return false
    } catch (error) {
      console.error('Roster sync failed:', error)
      return false
    }
  }

  private async syncEvents(eventsData: any): Promise<boolean> {
    try {
      // Events cache sync
      const response = await fetch('/api/events', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const events = await response.json()
        offlineStorage.saveEventsCache(events)
        return true
      }

      return false
    } catch (error) {
      console.error('Events sync failed:', error)
      return false
    }
  }

  private handleSyncFailure(item: SyncQueueItem): void {
    const newRetryCount = item.retryCount + 1
    
    if (newRetryCount >= item.maxRetries) {
      // Max retries reached, remove from queue
      offlineStorage.removeFromSyncQueue(item.id)
      console.error(`Sync item ${item.id} failed after ${item.maxRetries} retries`)
    } else {
      // Update retry count and schedule retry
      offlineStorage.updateSyncQueueItem(item.id, {
        retryCount: newRetryCount
      })
      
      // Schedule retry with exponential backoff
      const delay = this.retryDelays[Math.min(newRetryCount - 1, this.retryDelays.length - 1)]
      setTimeout(() => {
        if (this.networkDetector.isCurrentlyOnline()) {
          this.autoSync()
        }
      }, delay)
    }
  }

  public getSyncStatus(): SyncStatus {
    const queue = offlineStorage.getSyncQueue()
    const failedItems = queue.filter(item => item.retryCount > 0)
    
    return {
      isOnline: this.networkDetector.isCurrentlyOnline(),
      pendingSyncs: queue.length,
      failedSyncs: failedItems.length,
      isSyncing: this.isSyncing
    }
  }

  public getNetworkDetector(): NetworkDetector {
    return this.networkDetector
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

// Export singleton instances with SSR-safe shims
export const syncService: SyncService = typeof window !== 'undefined'
  ? new SyncService()
  : ({
      // SSR-safe no-op implementations
      autoSync: async () => ({ success: false, syncedItems: 0, failedItems: 0, errors: ['SSR no-op'] }),
      manualSync: async () => ({ success: false, syncedItems: 0, failedItems: 0, errors: ['SSR no-op'] }),
      getSyncStatus: () => ({
        isOnline: true,
        pendingSyncs: 0,
        failedSyncs: 0,
        isSyncing: false
      }),
      getNetworkDetector: () => ({
        addListener: (_: any) => () => {},
        isCurrentlyOnline: () => true
      }) as unknown as NetworkDetector,
      destroy: () => {}
    } as unknown as SyncService)

export const networkDetector: NetworkDetector = typeof window !== 'undefined'
  ? (syncService as SyncService).getNetworkDetector()
  : ({
      addListener: (_: any) => () => {},
      isCurrentlyOnline: () => true
    } as unknown as NetworkDetector)

export default syncService

