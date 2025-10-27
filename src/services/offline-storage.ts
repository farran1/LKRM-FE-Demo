/**
 * Offline Storage Service
 * Handles localStorage with compression for live stat tracking
 * Safari-safe implementation using base64 compression
 */

import LZString from 'lz-string'
import { generateUUID } from '../utils/uuid'

// Storage keys
const STORAGE_KEYS = {
  LIVE_SESSION: (sessionId: string) => `live_game_session_${sessionId}`,
  LIVE_EVENTS: (sessionId: string) => `live_game_events_${sessionId}`,
  ROSTER_CACHE: 'roster_cache',
  EVENTS_CACHE: 'events_cache',
  SYNC_QUEUE: 'sync_queue',
  STORAGE_USAGE: 'storage_usage',
  DEVICE_ID: 'device_id',
  SESSION_MAPPINGS: 'supabase_session_mappings' // Mapping from session_key to supabase_session_id
} as const

// Storage limits (in bytes)
const STORAGE_LIMITS = {
  MAX_SESSION_SIZE: 500 * 1024, // 500KB per session
  MAX_TOTAL_SIZE: 5 * 1024 * 1024, // 5MB total
  WARNING_THRESHOLD: 4 * 1024 * 1024 // 4MB warning
} as const

export interface StorageUsage {
  totalBytes: number
  sessionCount: number
  lastCleanup: string
  quotaUsed: number // percentage
}

export interface SyncQueueItem {
  id: string
  type: 'session' | 'event' | 'roster' | 'events'
  data: any
  timestamp: string
  retryCount: number
  maxRetries: number
  priority?: 'low' | 'medium' | 'high'
}

export interface OfflineSession {
  id: string
  eventId: number
  gameId?: number
  sessionKey: string
  gameState: any
  isActive: boolean
  startedAt: string
  endedAt?: string
  createdBy: string
  lastModified: string
  version: number
  deviceId: string
}

export interface OfflineEvent {
  id: string
  sessionId: string
  gameId?: number
  playerId?: number
  eventType: string
  eventValue?: number
  quarter: number
  isOpponentEvent: boolean
  opponentJersey?: string
  metadata: any
  timestamp: string
  version: number
}

class OfflineStorageService {
  private deviceId: string

  constructor() {
    // On server, skip localStorage usage
    if (typeof window === 'undefined') {
      this.deviceId = 'server-device'
      return
    }
    this.deviceId = this.getOrCreateDeviceId()
  }

  // Device ID management
  private getOrCreateDeviceId(): string {
    let deviceId = this.get(STORAGE_KEYS.DEVICE_ID)
    if (!deviceId) {
      deviceId = generateUUID()
      this.set(STORAGE_KEYS.DEVICE_ID, deviceId)
    }
    return deviceId
  }

  // Core storage methods with compression
  private compress(data: any): string {
    try {
      const jsonString = JSON.stringify(data)
      return LZString.compress(jsonString) // Safari-safe base64 compression
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error)
      return JSON.stringify(data)
    }
  }

  private decompress(compressedData: string): any {
    try {
      const decompressed = LZString.decompress(compressedData)
      return decompressed ? JSON.parse(decompressed) : null
    } catch (error) {
      console.warn('Decompression failed, trying direct parse:', error)
      try {
        return JSON.parse(compressedData)
      } catch (parseError) {
        console.error('Failed to parse data:', parseError)
        return null
      }
    }
  }

  public get(key: string): any {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(key)
      return data ? this.decompress(data) : null
    } catch (error) {
      console.error(`Failed to get ${key}:`, error)
      return null
    }
  }

  public set(key: string, data: any): boolean {
    if (typeof window === 'undefined') return false
    try {
      const compressed = this.compress(data)
      localStorage.setItem(key, compressed)
      this.updateStorageUsage()
      return true
    } catch (error) {
      console.error(`Failed to set ${key}:`, error)
      return false
    }
  }

  public remove(key: string): boolean {
    if (typeof window === 'undefined') return false
    try {
      localStorage.removeItem(key)
      this.updateStorageUsage()
      return true
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
      return false
    }
  }

  // Storage usage tracking
  private updateStorageUsage(): void {
    if (typeof window === 'undefined') return
    try {
      let totalBytes = 0
      let sessionCount = 0

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          if (value) {
            totalBytes += key.length + value.length
            if (key.startsWith('live_game_session_')) {
              sessionCount++
            }
          }
        }
      }

      const usage: StorageUsage = {
        totalBytes,
        sessionCount,
        lastCleanup: new Date().toISOString(),
        quotaUsed: (totalBytes / STORAGE_LIMITS.MAX_TOTAL_SIZE) * 100
      }

      localStorage.setItem(STORAGE_KEYS.STORAGE_USAGE, JSON.stringify(usage))
    } catch (error) {
      console.error('Failed to update storage usage:', error)
    }
  }

  // Public API methods
  public getStorageUsage(): StorageUsage {
    const usage = this.get(STORAGE_KEYS.STORAGE_USAGE)
    if (!usage) {
      this.updateStorageUsage()
      return this.get(STORAGE_KEYS.STORAGE_USAGE) || {
        totalBytes: 0,
        sessionCount: 0,
        lastCleanup: new Date().toISOString(),
        quotaUsed: 0
      }
    }
    return usage
  }

  public isStorageNearLimit(): boolean {
    const usage = this.getStorageUsage()
    return usage.quotaUsed > (STORAGE_LIMITS.WARNING_THRESHOLD / STORAGE_LIMITS.MAX_TOTAL_SIZE) * 100
  }

  public getDeviceId(): string {
    return this.deviceId
  }

  // Session management
  public saveSession(session: OfflineSession): boolean {
    const key = STORAGE_KEYS.LIVE_SESSION(session.id)
    session.lastModified = new Date().toISOString()
    session.deviceId = this.deviceId
    return this.set(key, session)
  }

  public getSession(sessionId: string): OfflineSession | null {
    const key = STORAGE_KEYS.LIVE_SESSION(sessionId)
    return this.get(key)
  }

  public getAllSessions(): OfflineSession[] {
    if (typeof window === 'undefined') return []
    const sessions: OfflineSession[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('live_game_session_')) {
        const session = this.get(key)
        if (session) {
          sessions.push(session)
        }
      }
    }
    return sessions.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
  }

  public deleteSession(sessionId: string): boolean {
    const sessionKey = STORAGE_KEYS.LIVE_SESSION(sessionId)
    const eventsKey = STORAGE_KEYS.LIVE_EVENTS(sessionId)
    return this.remove(sessionKey) && this.remove(eventsKey)
  }

  // Event management
  public saveEvent(event: OfflineEvent): boolean {
    const key = STORAGE_KEYS.LIVE_EVENTS(event.sessionId)
    const events = this.get(key) || []
    
    // Update existing event or add new one
    const existingIndex = events.findIndex((e: OfflineEvent) => e.id === event.id)
    if (existingIndex >= 0) {
      events[existingIndex] = event
    } else {
      events.push(event)
    }
    
    return this.set(key, events)
  }

  public getEvents(sessionId: string): OfflineEvent[] {
    const key = STORAGE_KEYS.LIVE_EVENTS(sessionId)
    return this.get(key) || []
  }

  public deleteEvent(sessionId: string, eventId: string): boolean {
    const key = STORAGE_KEYS.LIVE_EVENTS(sessionId)
    const events = this.get(key) || []
    const filteredEvents = events.filter((e: OfflineEvent) => e.id !== eventId)
    return this.set(key, filteredEvents)
  }

  // Cache management
  public saveRosterCache(roster: any[]): boolean {
    const cacheData = {
      data: roster,
      timestamp: new Date().toISOString(),
      version: 1
    }
    return this.set(STORAGE_KEYS.ROSTER_CACHE, cacheData)
  }

  public getRosterCache(): any[] | null {
    const cache = this.get(STORAGE_KEYS.ROSTER_CACHE)
    return cache ? cache.data : null
  }

  public saveEventsCache(events: any[]): boolean {
    const cacheData = {
      data: events,
      timestamp: new Date().toISOString(),
      version: 1
    }
    return this.set(STORAGE_KEYS.EVENTS_CACHE, cacheData)
  }

  public getEventsCache(): any[] | null {
    const cache = this.get(STORAGE_KEYS.EVENTS_CACHE)
    return cache ? cache.data : null
  }

  // Sync queue management
  public addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): string {
    const syncItem: SyncQueueItem = {
      ...item,
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0
    }

    const queue = this.get(STORAGE_KEYS.SYNC_QUEUE) || []
    queue.push(syncItem)
    this.set(STORAGE_KEYS.SYNC_QUEUE, queue)
    return syncItem.id
  }

  public getSyncQueue(): SyncQueueItem[] {
    return this.get(STORAGE_KEYS.SYNC_QUEUE) || []
  }

  public removeFromSyncQueue(itemId: string): boolean {
    const queue = this.get(STORAGE_KEYS.SYNC_QUEUE) || []
    const filteredQueue = queue.filter((item: SyncQueueItem) => item.id !== itemId)
    return this.set(STORAGE_KEYS.SYNC_QUEUE, filteredQueue)
  }

  public updateSyncQueueItem(itemId: string, updates: Partial<SyncQueueItem>): boolean {
    const queue = this.get(STORAGE_KEYS.SYNC_QUEUE) || []
    const itemIndex = queue.findIndex((item: SyncQueueItem) => item.id === itemId)
    
    if (itemIndex >= 0) {
      queue[itemIndex] = { ...queue[itemIndex], ...updates }
      return this.set(STORAGE_KEYS.SYNC_QUEUE, queue)
    }
    return false
  }

  // Supabase session mapping management
  public storeSupabaseSessionMapping(sessionKey: string, supabaseSessionId: number): void {
    if (typeof window === 'undefined') return
    const mappings = this.get(STORAGE_KEYS.SESSION_MAPPINGS) || {}
    mappings[sessionKey] = supabaseSessionId
    this.set(STORAGE_KEYS.SESSION_MAPPINGS, mappings)
  }

  public getSupabaseSessionMapping(sessionKey: string): number | null {
    if (typeof window === 'undefined') return null
    const mappings = this.get(STORAGE_KEYS.SESSION_MAPPINGS) || {}
    return mappings[sessionKey] || null
  }

  // Cleanup methods
  public cleanupOldSessions(maxSessions: number = 10): number {
    const sessions = this.getAllSessions()
    if (sessions.length <= maxSessions) {
      return 0
    }

    const sessionsToDelete = sessions.slice(maxSessions)
    let deletedCount = 0

    sessionsToDelete.forEach(session => {
      if (this.deleteSession(session.id)) {
        deletedCount++
      }
    })

    this.updateStorageUsage()
    return deletedCount
  }

  public clearAllData(): boolean {
    if (typeof window === 'undefined') return false
    try {
      // Keep device ID and storage usage
      const deviceId = this.get(STORAGE_KEYS.DEVICE_ID)
      const usage = this.get(STORAGE_KEYS.STORAGE_USAGE)
      
      localStorage.clear()
      
      if (deviceId) {
        this.set(STORAGE_KEYS.DEVICE_ID, deviceId)
      }
      if (usage) {
        this.set(STORAGE_KEYS.STORAGE_USAGE, usage)
      }
      
      return true
    } catch (error) {
      console.error('Failed to clear all data:', error)
      return false
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService()
export default offlineStorage
