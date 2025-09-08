import { RealtimeChannel } from '@supabase/supabase-js'

// Types for the live stat tracker
export interface LiveGameSession {
  id: number
  event_id: number
  session_key: string
  game_state: any
  is_active: boolean
  started_at: string
  ended_at?: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface LiveGameEvent {
  id: number
  session_id: number
  player_id?: number
  event_type: string
  event_value?: number
  quarter: number
  game_time: number
  is_opponent_event: boolean
  opponent_jersey?: string
  metadata: any
  created_at: string
}

export interface LiveGameLineup {
  id: number
  session_id: number
  lineup_name?: string
  player_ids: number[]
  start_time: number
  end_time?: number
  plus_minus: number
  created_at: string
}

export interface LiveGameSubstitution {
  id: number
  session_id: number
  player_in_id: number
  player_out_id: number
  quarter: number
  game_time: number
  lineup_id?: number
  created_at: string
}

export interface LiveGameSettings {
  id: number
  session_id: number
  quarter_duration: number
  total_quarters: number
  timeout_count: number
  shot_clock: number
  auto_pause_on_timeout: boolean
  auto_pause_on_quarter_end: boolean
  created_at: string
  updated_at: string
}

export interface LiveGameTimeout {
  id: number
  session_id: number
  team: 'home' | 'away'
  quarter: number
  game_time: number
  duration: number
  created_at: string
}

export interface LiveGameSyncStatus {
  id: number
  session_id: number
  last_synced_at: string
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed'
  error_message?: string
  retry_count: number
  created_at: string
  updated_at: string
}

// Offline data structure for sync
export interface OfflineGameData {
  sessionKey: string
  eventId: number
  gameState: any
  events: LiveGameEvent[]
  lineups: LiveGameLineup[]
  substitutions: LiveGameSubstitution[]
  settings: LiveGameSettings
  timeouts: LiveGameTimeout[]
  lastModified: number
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount?: number
}

class LiveStatTrackerService {
  private supabase: any = null
  private realtimeChannels: Map<string, RealtimeChannel> = new Map()
  private offlineData: Map<string, OfflineGameData> = new Map()
  private syncQueue: OfflineGameData[] = []
  private isOnline: boolean = navigator.onLine

  constructor() {
    // Don't create a Supabase client here - we'll set it later
    this.supabase = null
    
    // Setup online/offline listeners
    this.setupOnlineOfflineListeners()
    
    // Load offline data from localStorage
    this.loadOfflineData()
  }

  // Method to set the Supabase client from your existing app
  setSupabaseClient(client: any) {
    this.supabase = client
  }

  private setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private loadOfflineData() {
    try {
      const stored = localStorage.getItem('live-stat-tracker-offline-data')
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([key, value]) => {
          this.offlineData.set(key, value as OfflineGameData)
        })
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }

  private saveOfflineData() {
    try {
      const data = Object.fromEntries(this.offlineData)
      localStorage.setItem('live-stat-tracker-offline-data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  // Create a new live game session
  async createGameSession(eventId: number, initialGameState: any): Promise<LiveGameSession> {
    const sessionKey = `game-${eventId}-${Date.now()}`
    
    const sessionData = {
      event_id: eventId,
      session_key: sessionKey,
      game_state: initialGameState,
      is_active: true,
      created_by: await this.getCurrentUserId()
    }

    if (this.isOnline && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('live_game_sessions')
          .insert(sessionData)
          .select()
          .single()

        if (error) throw error

        // Also save to offline storage
        this.saveGameSessionOffline(sessionKey, eventId, initialGameState)
        
        return data
      } catch (error) {
        console.error('Failed to create online session, saving offline:', error)
        return this.saveGameSessionOffline(sessionKey, eventId, initialGameState)
      }
    } else {
      return this.saveGameSessionOffline(sessionKey, eventId, initialGameState)
    }
  }

  private saveGameSessionOffline(sessionKey: string, eventId: number, gameState: any): LiveGameSession {
    const session: LiveGameSession = {
      id: Date.now(), // Temporary ID for offline
      event_id: eventId,
      session_key: sessionKey,
      game_state: gameState,
      is_active: true,
      started_at: new Date().toISOString(),
      created_by: 0, // Will be updated when syncing
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to offline storage
    this.offlineData.set(sessionKey, {
      sessionKey,
      eventId,
      gameState,
      events: [],
      lineups: [],
      substitutions: [],
      settings: this.getDefaultSettings(),
      timeouts: [],
      lastModified: Date.now(),
      syncStatus: 'pending'
    })

    this.saveOfflineData()
    return session
  }

  private getDefaultSettings(): LiveGameSettings {
    return {
      id: 0,
      session_id: 0,
      quarter_duration: 600,
      total_quarters: 4,
      timeout_count: 4,
      shot_clock: 30,
      auto_pause_on_timeout: true,
      auto_pause_on_quarter_end: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // Record a game event (stat, substitution, etc.)
  async recordGameEvent(
    sessionKey: string, 
    eventData: Omit<LiveGameEvent, 'id' | 'session_id' | 'created_at'>
  ): Promise<LiveGameEvent> {
    const offlineData = this.offlineData.get(sessionKey)
    if (!offlineData) {
      throw new Error('Session not found')
    }

    const event: LiveGameEvent = {
      id: Date.now(),
      session_id: 0, // Will be updated when syncing
      ...eventData,
      created_at: new Date().toISOString()
    }

    // Add to offline storage
    offlineData.events.push(event)
    offlineData.lastModified = Date.now()
    offlineData.syncStatus = 'pending'
    this.saveOfflineData()

    // Try to sync online if possible
    if (this.isOnline && this.supabase) {
      this.syncOfflineData()
    }

    return event
  }

  // Update game state
  async updateGameState(sessionKey: string, gameState: any): Promise<void> {
    const offlineData = this.offlineData.get(sessionKey)
    if (!offlineData) {
      throw new Error('Session not found')
    }

    offlineData.gameState = gameState
    offlineData.lastModified = Date.now()
    offlineData.syncStatus = 'pending'
    this.saveOfflineData()

    // Try to sync online if possible
    if (this.isOnline && this.supabase) {
      this.syncOfflineData()
    }
  }

  // Subscribe to real-time updates for a session
  subscribeToSession(sessionKey: string, callback: (data: any) => void): RealtimeChannel {
    if (!this.supabase) {
      throw new Error('Supabase client not available')
    }
    
    if (this.realtimeChannels.has(sessionKey)) {
      return this.realtimeChannels.get(sessionKey)!
    }

    const channel = this.supabase
      .channel(`live-game-${sessionKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_game_events',
          filter: `session_key=eq.${sessionKey}`
        },
        callback
      )
      .subscribe()

    this.realtimeChannels.set(sessionKey, channel)
    return channel
  }

  // Unsubscribe from real-time updates
  unsubscribeFromSession(sessionKey: string): void {
    const channel = this.realtimeChannels.get(sessionKey)
    if (channel) {
      channel.unsubscribe()
      this.realtimeChannels.delete(sessionKey)
    }
  }

  // Sync offline data to the database
  private async syncOfflineData(): Promise<void> {
    if (!this.isOnline || !this.supabase) return

    const pendingSessions = Array.from(this.offlineData.values())
      .filter(data => data.syncStatus === 'pending')

    for (const sessionData of pendingSessions) {
      try {
        sessionData.syncStatus = 'syncing'
        this.saveOfflineData()

        // First, ensure the session exists online
        let onlineSession = await this.findOrCreateOnlineSession(sessionData)

        // Sync events
        if (sessionData.events.length > 0) {
          await this.syncEvents(onlineSession.id, sessionData.events)
        }

        // Sync lineups
        if (sessionData.lineups.length > 0) {
          await this.syncLineups(onlineSession.id, sessionData.lineups)
        }

        // Sync substitutions
        if (sessionData.substitutions.length > 0) {
          await this.syncSubstitutions(onlineSession.id, sessionData.substitutions)
        }

        // Update game state
        await this.updateOnlineGameState(onlineSession.id, sessionData.gameState)

        // Mark as synced
        sessionData.syncStatus = 'synced'
        this.saveOfflineData()

      } catch (error) {
        console.error('Failed to sync session:', sessionData.sessionKey, error)
        sessionData.syncStatus = 'failed'
        sessionData.retryCount = (sessionData.retryCount || 0) + 1
        this.saveOfflineData()
      }
    }
  }

  private async findOrCreateOnlineSession(sessionData: OfflineGameData): Promise<LiveGameSession> {
    // Try to find existing session
    const { data: existing } = await this.supabase
      .from('live_game_sessions')
      .select()
      .eq('session_key', sessionData.sessionKey)
      .single()

    if (existing) {
      return existing
    }

    // Create new session
    const { data: newSession, error } = await this.supabase
      .from('live_game_sessions')
      .insert({
        event_id: sessionData.eventId,
        session_key: sessionData.sessionKey,
        game_state: sessionData.gameState,
        is_active: true,
        created_by: await this.getCurrentUserId()
      })
      .select()
      .single()

    if (error) throw error
    return newSession
  }

  private async syncEvents(sessionId: number, events: LiveGameEvent[]): Promise<void> {
    const eventsToSync = (events as any[]).filter(event => (event as any).syncStatus !== 'synced')
    
    if (eventsToSync.length > 0) {
      const { error } = await this.supabase
        .from('live_game_events')
        .insert(eventsToSync.map(event => ({
          session_id: sessionId,
          player_id: event.player_id,
          event_type: event.event_type,
          event_value: event.event_value,
          quarter: event.quarter,
          game_time: event.game_time,
          is_opponent_event: event.is_opponent_event,
          opponent_jersey: event.opponent_jersey,
          metadata: event.metadata
        })))

      if (error) throw error
    }
  }

  private async syncLineups(sessionId: number, lineups: LiveGameLineup[]): Promise<void> {
    const lineupsToSync = (lineups as any[]).filter(lineup => (lineup as any).syncStatus !== 'synced')
    
    if (lineupsToSync.length > 0) {
      const { error } = await this.supabase
        .from('live_game_lineups')
        .insert(lineupsToSync.map(lineup => ({
          session_id: sessionId,
          lineup_name: lineup.lineup_name,
          player_ids: lineup.player_ids,
          start_time: lineup.start_time,
          end_time: lineup.end_time,
          plus_minus: lineup.plus_minus
        })))

      if (error) throw error
    }
  }

  private async syncSubstitutions(sessionId: number, substitutions: LiveGameSubstitution[]): Promise<void> {
    const subsToSync = (substitutions as any[]).filter(sub => (sub as any).syncStatus !== 'synced')
    
    if (subsToSync.length > 0) {
      const { error } = await this.supabase
        .from('live_game_substitutions')
        .insert(subsToSync.map(sub => ({
          session_id: sessionId,
          player_in_id: sub.player_in_id,
          player_out_id: sub.player_out_id,
          quarter: sub.quarter,
          game_time: sub.game_time,
          lineup_id: sub.lineup_id
        })))

      if (error) throw error
    }
  }

  private async updateOnlineGameState(sessionId: number, gameState: any): Promise<void> {
    const { error } = await this.supabase
      .from('live_game_sessions')
      .update({ game_state: gameState })
      .eq('id', sessionId)

    if (error) throw error
  }

  // Get current user ID (you'll need to implement this based on your auth setup)
  private async getCurrentUserId(): Promise<number> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    console.log('Auth user found:', { id: user.id, email: user.email })
    
    // Get the profile_number from profiles table to use as integer ID
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('profile_number')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.log('Database query error when looking up profile:', error)
        throw error
      }

      if (data?.profile_number) {
        console.log('Profile found in database:', data)
        return data.profile_number
      } else {
        console.log('No profile_number returned from database')
        return 1 // Default user ID
      }
    } catch (error) {
      console.log('Could not find profile in profiles table for user:', user.id, error)
      
      // Let's check what profiles are available in the database
      try {
        const { data: allProfiles } = await this.supabase
          .from('profiles')
          .select('user_id, profile_number, first_name, last_name')
          .limit(5)
        
        console.log('Available profiles in database:', allProfiles)
      } catch (checkError) {
        console.log('Could not check available profiles:', checkError)
      }
      
      return 1 // Default user ID
    }
  }

  // Get all offline sessions
  getOfflineSessions(): OfflineGameData[] {
    return Array.from(this.offlineData.values())
  }

  // Get offline session by key
  getOfflineSession(sessionKey: string): OfflineGameData | undefined {
    return this.offlineData.get(sessionKey)
  }

  // Delete offline session
  deleteOfflineSession(sessionKey: string): void {
    this.offlineData.delete(sessionKey)
    this.saveOfflineData()
  }

  // Clear all offline data
  clearAllOfflineData(): void {
    this.offlineData.clear()
    this.saveOfflineData()
  }

  // Get storage usage
  getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      let used = 0
      this.offlineData.forEach((data) => {
        used += new Blob([JSON.stringify(data)]).size
      })

      // Estimate available storage (localStorage typically 5-10MB)
      const available = 5 * 1024 * 1024 // 5MB estimate
      const percentage = Math.round((used / available) * 100)

      return { used, available, percentage }
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 }
    }
  }

  // Export offline data
  exportOfflineData(): string {
    return JSON.stringify(Array.from(this.offlineData.values()), null, 2)
  }

  // Import offline data
  importOfflineData(data: string): void {
    try {
      const importedData: OfflineGameData[] = JSON.parse(data)
      importedData.forEach(session => {
        this.offlineData.set(session.sessionKey, session)
      })
      this.saveOfflineData()
    } catch (error) {
      console.error('Failed to import offline data:', error)
      throw new Error('Invalid offline data format')
    }
  }
}

// Export singleton instance
export const liveStatTrackerService = new LiveStatTrackerService()
export default liveStatTrackerService
