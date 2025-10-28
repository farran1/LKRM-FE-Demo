/**
 * Cache Service for Roster and Events
 * Handles caching strategies for offline functionality
 */

import { offlineStorage } from './offline-storage'
import { syncService } from './sync-service'

export interface CacheInfo {
  lastUpdated: string
  version: number
  itemCount: number
  sizeBytes: number
}

export interface Player {
  id: number
  name: string
  positionId: number
  jersey: string
  phoneNumber?: string
  email?: string
  height?: number
  weight?: number
  avatar?: string
  birthDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: number
  name: string
  description?: string
  eventTypeId: number
  startTime: string
  endTime?: string
  location: 'HOME' | 'AWAY'
  venue: string
  oppositionTeam?: string
  isRepeat: boolean
  occurence: number
  isNotice: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface EventType {
  id: number
  name: string
  color: string
  txtColor: string
  icon?: string
}

class CacheService {
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly REFRESH_THRESHOLD = 60 * 60 * 1000 // 1 hour
  private refreshCallbacks: (() => void)[] = []

  constructor() {
    // Listen for network status changes to refresh cache when online
    syncService.getNetworkDetector().addListener((status) => {
      if (status === 'online') {
        this.refreshCacheIfNeeded()
      }
    })
  }

  // Roster cache management
  public async getRoster(): Promise<Player[]> {
    const cachedRoster = offlineStorage.getRosterCache()
    
    // If we have valid cached data, return it
    if (cachedRoster && this.isCacheValid('roster')) {
      return cachedRoster
    }

    // Try to fetch fresh data if online and authenticated
    if (syncService.getNetworkDetector().isCurrentlyOnline()) {
      try {
        const freshRoster = await this.fetchRosterFromAPI()
        if (freshRoster) {
          offlineStorage.saveRosterCache(freshRoster)
          return freshRoster
        }
      } catch (error) {
        // Handle specific error types
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage === 'OFFLINE' || errorMessage === 'NO_SESSION' || errorMessage === 'AUTH_FAILED') {
          console.log('📱 Skipping roster fetch due to:', errorMessage);
        } else {
          console.warn('Failed to fetch fresh roster, using cache:', error)
        }
      }
    } else {
      console.log('📱 Offline detected, using cached roster');
    }

    // Return cached data even if stale, or empty array
    return cachedRoster || []
  }

  public async refreshRoster(): Promise<Player[]> {
    if (!syncService.getNetworkDetector().isCurrentlyOnline()) {
      console.log('📱 Cannot refresh roster while offline');
      const cachedRoster = offlineStorage.getRosterCache()
      return cachedRoster || []
    }

    try {
      const freshRoster = await this.fetchRosterFromAPI()
      if (freshRoster) {
        offlineStorage.saveRosterCache(freshRoster)
        this.notifyRefreshCallbacks()
        return freshRoster
      }
      // If fetch returns null, fall back to cached data
      const cachedRoster = offlineStorage.getRosterCache()
      console.log('No fresh roster data, using cached data');
      return cachedRoster || []
    } catch (error) {
      // Handle specific error types gracefully
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage === 'OFFLINE' || errorMessage === 'NO_SESSION' || errorMessage === 'AUTH_FAILED') {
        console.log('📱 Roster refresh skipped due to:', errorMessage);
        const cachedRoster = offlineStorage.getRosterCache()
        return cachedRoster || []
      }
      console.error('Roster refresh failed:', error)
      // Fall back to cached data instead of throwing
      const cachedRoster = offlineStorage.getRosterCache()
      return cachedRoster || []
    }
  }

  private async fetchRosterFromAPI(): Promise<Player[] | null> {
    try {
      // Check if we're offline first
      if (!navigator.onLine) {
        console.log('📱 Offline detected, skipping roster API call');
        throw new Error('OFFLINE');
      }

      // Get authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if we have a valid session
      if (!session?.access_token) {
        console.log('🔐 No valid session, skipping roster API call');
        throw new Error('NO_SESSION');
      }

      // Request only active players at the API level
      const response = await fetch('/api/players?isActive=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔐 Authentication failed for roster API call');
          throw new Error('AUTH_FAILED');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      // Handle both array responses and wrapped responses like { data: [...] }
      const data = Array.isArray(json) ? json : (json.data || json.players || null)
      return Array.isArray(data) ? data : null
    } catch (error) {
      console.error('API fetch failed:', error)
      return null
    }
  }

  // Events cache management
  public async getEvents(): Promise<Event[]> {
    const cachedEvents = offlineStorage.getEventsCache()
    
    // If we have valid cached data, return it
    if (cachedEvents && this.isCacheValid('events')) {
      return cachedEvents
    }

    // Try to fetch fresh data if online and authenticated
    if (syncService.getNetworkDetector().isCurrentlyOnline()) {
      try {
        const freshEvents = await this.fetchEventsFromAPI()
        if (freshEvents) {
          offlineStorage.saveEventsCache(freshEvents)
          return freshEvents
        }
      } catch (error) {
        // Handle specific error types
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage === 'OFFLINE' || errorMessage === 'NO_SESSION' || errorMessage === 'AUTH_FAILED') {
          console.log('📱 Skipping events fetch due to:', errorMessage);
        } else {
          console.warn('Failed to fetch fresh events, using cache:', error)
        }
      }
    } else {
      console.log('📱 Offline detected, using cached events');
    }

    // Return cached data even if stale, or empty array
    return cachedEvents || []
  }

  public async refreshEvents(): Promise<Event[]> {
    if (!syncService.getNetworkDetector().isCurrentlyOnline()) {
      console.log('📱 Cannot refresh events while offline');
      throw new Error('Cannot refresh events while offline')
    }

    try {
      const freshEvents = await this.fetchEventsFromAPI()
      if (freshEvents) {
        offlineStorage.saveEventsCache(freshEvents)
        this.notifyRefreshCallbacks()
        return freshEvents
      }
      throw new Error('Failed to fetch events data')
    } catch (error) {
      // Handle specific error types gracefully
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage === 'OFFLINE' || errorMessage === 'NO_SESSION' || errorMessage === 'AUTH_FAILED') {
        console.log('📱 Events refresh skipped due to:', errorMessage);
        throw error;
      }
      console.error('Events refresh failed:', error)
      throw error
    }
  }

  private async fetchEventsFromAPI(): Promise<Event[] | null> {
    try {
      // Check if we're offline first
      if (!navigator.onLine) {
        console.log('📱 Offline detected, skipping events API call');
        throw new Error('OFFLINE');
      }

      // Get authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if we have a valid session
      if (!session?.access_token) {
        console.log('🔐 No valid session, skipping events API call');
        throw new Error('NO_SESSION');
      }

      const response = await fetch('/api/events', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔐 Authentication failed for events API call');
          throw new Error('AUTH_FAILED');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      // Handle both direct array response and wrapped response format
      if (Array.isArray(data)) {
        return data
      } else if (data && Array.isArray(data.data)) {
        return data.data
      }
      return null
    } catch (error) {
      console.error('API fetch failed:', error)
      return null
    }
  }

  // Event types cache (smaller, can be refreshed more frequently)
  public async getEventTypes(): Promise<EventType[]> {
    // Event types are small and change rarely, so we can cache them longer
    const cacheKey = 'event_types_cache'
    const cached = offlineStorage.get(cacheKey)
    
    if (cached && this.isCacheValid('event_types', 7 * 24 * 60 * 60 * 1000)) { // 7 days
      return cached
    }

    if (syncService.getNetworkDetector().isCurrentlyOnline()) {
      try {
        const response = await fetch('/api/event-types', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          const eventTypes = await response.json()
          offlineStorage.set(cacheKey, eventTypes)
          return eventTypes
        }
      } catch (error) {
        console.warn('Failed to fetch event types:', error)
      }
    }

    return cached || []
  }

  // Cache validation
  private isCacheValid(type: 'roster' | 'events' | 'event_types', customDuration?: number): boolean {
    const duration = customDuration || this.CACHE_DURATION
    const cache = offlineStorage.get(`${type}_cache`)
    
    if (!cache || !cache.timestamp) {
      return false
    }

    const lastUpdated = new Date(cache.timestamp).getTime()
    const now = Date.now()
    
    return (now - lastUpdated) < duration
  }

  // Cache refresh strategies
  public async refreshCacheIfNeeded(): Promise<void> {
    if (!syncService.getNetworkDetector().isCurrentlyOnline()) {
      return
    }

    const promises: Promise<any>[] = []

    // Check if roster needs refresh
    if (!this.isCacheValid('roster', this.REFRESH_THRESHOLD)) {
      promises.push(this.refreshRoster().catch(error => {
        console.warn('Background roster refresh failed:', error)
      }))
    }

    // Check if events need refresh
    if (!this.isCacheValid('events', this.REFRESH_THRESHOLD)) {
      promises.push(this.refreshEvents().catch(error => {
        console.warn('Background events refresh failed:', error)
      }))
    }

    // Check if event types need refresh
    if (!this.isCacheValid('event_types', 24 * 60 * 60 * 1000)) { // 24 hours
      promises.push(this.getEventTypes().catch(error => {
        console.warn('Background event types refresh failed:', error)
      }))
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises)
    }
  }

  public async forceRefreshAll(): Promise<void> {
    if (!syncService.getNetworkDetector().isCurrentlyOnline()) {
      throw new Error('Cannot refresh cache while offline')
    }

    const promises = [
      this.refreshRoster(),
      this.refreshEvents(),
      this.getEventTypes()
    ]

    await Promise.allSettled(promises)
    this.notifyRefreshCallbacks()
  }

  // Cache info and management
  public getCacheInfo(): Record<string, CacheInfo> {
    const rosterCache = offlineStorage.get('roster_cache')
    const eventsCache = offlineStorage.get('events_cache')
    const eventTypesCache = offlineStorage.get('event_types_cache')

    return {
      roster: rosterCache ? {
        lastUpdated: rosterCache.timestamp,
        version: rosterCache.version || 1,
        itemCount: rosterCache.data?.length || 0,
        sizeBytes: JSON.stringify(rosterCache).length
      } : {
        lastUpdated: '',
        version: 0,
        itemCount: 0,
        sizeBytes: 0
      },
      events: eventsCache ? {
        lastUpdated: eventsCache.timestamp,
        version: eventsCache.version || 1,
        itemCount: eventsCache.data?.length || 0,
        sizeBytes: JSON.stringify(eventsCache).length
      } : {
        lastUpdated: '',
        version: 0,
        itemCount: 0,
        sizeBytes: 0
      },
      eventTypes: eventTypesCache ? {
        lastUpdated: new Date().toISOString(), // Event types don't store timestamp
        version: 1,
        itemCount: eventTypesCache.length || 0,
        sizeBytes: JSON.stringify(eventTypesCache).length
      } : {
        lastUpdated: '',
        version: 0,
        itemCount: 0,
        sizeBytes: 0
      }
    }
  }

  public clearCache(): void {
    offlineStorage.remove('roster_cache')
    offlineStorage.remove('events_cache')
    offlineStorage.remove('event_types_cache')
  }

  // Event listeners for cache updates
  public addRefreshListener(callback: () => void): () => void {
    this.refreshCallbacks.push(callback)
    
    return () => {
      const index = this.refreshCallbacks.indexOf(callback)
      if (index > -1) {
        this.refreshCallbacks.splice(index, 1)
      }
    }
  }

  private notifyRefreshCallbacks(): void {
    this.refreshCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Error in cache refresh callback:', error)
      }
    })
  }

  // Utility methods
  public getPlayerById(playerId: number): Promise<Player | null> {
    return this.getRoster().then(roster => 
      roster.find(player => player.id === playerId) || null
    )
  }

  public getPlayerByJersey(jersey: string): Promise<Player | null> {
    return this.getRoster().then(roster => 
      roster.find(player => player.jersey === jersey) || null
    )
  }

  public getEventById(eventId: number): Promise<Event | null> {
    return this.getEvents().then(events => 
      events.find(event => event.id === eventId) || null
    )
  }

  public getUpcomingEvents(): Promise<Event[]> {
    return this.getEvents().then(events => 
      events.filter(event => new Date(event.startTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    )
  }
}

// Export singleton instance
export const cacheService = new CacheService()
export default cacheService
