// No import needed - we'll use the existing client from your app

// Types for the enhanced live stat tracker
export interface LiveGameSession {
  id: number
  event_id: number
  game_id?: number
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
  game_id?: number
  player_id?: number
  event_type: string
  event_value?: number
  quarter: number
  game_time: number
  is_opponent_event: boolean
  opponent_jersey?: string
  metadata: any
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed'
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
  gameId?: number
  gameState: any
  events: LiveGameEvent[]
  lastModified: number
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
}

class EnhancedLiveStatTrackerService {
  private supabase: any = null
  private offlineData: Map<string, OfflineGameData> = new Map()
  private isOnline: boolean = navigator.onLine
  private currentSessionKey: string | null = null

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
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncOfflineData()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
  }

  private loadOfflineData() {
    try {
      const stored = localStorage.getItem('enhanced-live-stat-tracker-offline-data')
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
      localStorage.setItem('enhanced-live-stat-tracker-offline-data', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  // Start a new live game session
  async startLiveGame(eventId: number, gameId?: number, initialGameState: any = {}): Promise<LiveGameSession> {
    // Use a more unique timestamp to avoid conflicts
    const timestamp = Date.now() + Math.random().toString(36).substr(2, 9)
    const sessionKey = `live-game-${eventId}-${timestamp}`
    
    try {
      const userId = await this.getCurrentUserId()
      
      const sessionData = {
        event_id: eventId,
        game_id: gameId,
        session_key: sessionKey,
        game_state: {
          currentQuarter: 1,
          timeRemaining: 600,
          homeScore: 0,
          awayScore: 0,
          isPlaying: false,
          ...initialGameState
        },
        is_active: true,
        created_by: userId
      }

      if (this.isOnline && this.supabase) {
        try {
          // Check if session already exists
          const { data: existingSession } = await this.supabase
            .from('live_game_sessions')
            .select('*')
            .eq('event_id', eventId)
            .eq('is_active', true)
            .single()

          if (existingSession) {
            console.log('Found existing active session, using it:', existingSession)
            this.currentSessionKey = existingSession.session_key
            return existingSession
          }

          // Create new session
          const { data, error } = await this.supabase
            .from('live_game_sessions')
            .insert(sessionData)
            .select()
            .single()

          if (error) throw error

          // Also save to offline storage
          this.saveGameSessionOffline(sessionKey, eventId, gameId, sessionData.game_state)
          
          this.currentSessionKey = sessionKey
          return data
        } catch (error) {
          console.error('Failed to create online session, saving offline:', error)
          // Continue with offline session even if online fails
          const offlineSession = this.saveGameSessionOffline(sessionKey, eventId, gameId, sessionData.game_state)
          this.currentSessionKey = sessionKey
          return offlineSession
        }
      } else {
        // No Supabase client or offline - create offline session
        const session = this.saveGameSessionOffline(sessionKey, eventId, gameId, sessionData.game_state)
        this.currentSessionKey = sessionKey
        return session
      }
    } catch (error) {
      console.error('Failed to start live game session:', error)
      // Fallback: create offline session with default values
      const fallbackSession = this.saveGameSessionOffline(sessionKey, eventId, gameId, {
        currentQuarter: 1,
        timeRemaining: 600,
        homeScore: 0,
        awayScore: 0,
        isPlaying: false,
        ...initialGameState
      })
      this.currentSessionKey = sessionKey
      return fallbackSession
    }
  }

  private saveGameSessionOffline(sessionKey: string, eventId: number, gameId: number | undefined, gameState: any): LiveGameSession {
    const session: LiveGameSession = {
      id: Date.now(), // Temporary ID for offline
      event_id: eventId,
      game_id: gameId,
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
      gameId,
      gameState,
      events: [],
      lastModified: Date.now(),
      syncStatus: 'pending'
    })

    this.saveOfflineData()
    return session
  }

  // Record a live stat event
  async recordLiveEvent(
    eventType: string,
    eventValue?: number,
    playerId?: number,
    quarter: number = 1,
    gameTime: number = 0,
    isOpponentEvent: boolean = false,
    opponentJersey?: string,
    metadata: any = {}
  ): Promise<LiveGameEvent> {
    if (!this.currentSessionKey) {
      throw new Error('No active live game session')
    }

    const offlineData = this.offlineData.get(this.currentSessionKey)
    if (!offlineData) {
      throw new Error('Session not found')
    }

    const event: LiveGameEvent = {
      id: Date.now(),
      session_id: 0, // Will be updated when syncing
      game_id: offlineData.gameId,
      player_id: playerId,
      event_type: eventType,
      event_value: eventValue,
      quarter,
      game_time: gameTime,
      is_opponent_event: isOpponentEvent,
      opponent_jersey: opponentJersey,
      metadata,
      sync_status: 'pending',
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

  // Update game state (score, quarter, time, etc.)
  async updateGameState(gameState: any): Promise<void> {
    if (!this.currentSessionKey) {
      throw new Error('No active live game session')
    }

    const offlineData = this.offlineData.get(this.currentSessionKey)
    if (!offlineData) {
      throw new Error('Session not found')
    }

    offlineData.gameState = { ...offlineData.gameState, ...gameState }
    offlineData.lastModified = Date.now()
    offlineData.syncStatus = 'pending'
    this.saveOfflineData()

    // Try to sync online if possible
    if (this.isOnline && this.supabase) {
      this.syncOfflineData()
    }
  }

  // End the live game session
  async endLiveGame(): Promise<void> {
    if (!this.currentSessionKey) {
      throw new Error('No active live game session')
    }

    const sessionKey = this.currentSessionKey // Store before clearing

    try {
      if (this.isOnline && this.supabase) {
        // End session online
        await this.supabase
          .from('live_game_sessions')
          .update({ 
            is_active: false, 
            ended_at: new Date().toISOString() 
          })
          .eq('session_key', sessionKey)

        // Aggregate events into game_stats for stats dashboard compatibility
        await this.aggregateEventsToGameStats(sessionKey)
      }

      // Mark offline data as synced
      const offlineData = this.offlineData.get(sessionKey)
      if (offlineData) {
        offlineData.syncStatus = 'synced'
        this.saveOfflineData()
      }

      // Clear current session (do this last)
      this.currentSessionKey = null

    } catch (error) {
      console.error('Failed to end live game:', error)
      throw error
    }
  }

  // Aggregate live events into existing game_stats table
  private async aggregateEventsToGameStats(sessionKey?: string): Promise<void> {
    const keyToUse = sessionKey || this.currentSessionKey
    if (!keyToUse || !this.supabase) return

    try {
      // First, get the session ID from the session key
      const { data: session, error: sessionError } = await this.supabase
        .from('live_game_sessions')
        .select('id')
        .eq('session_key', keyToUse)
        .single()

      if (sessionError || !session) {
        console.log('Session not found online, skipping aggregation')
        return
      }

      // Call the database function to aggregate events with the numeric session ID
      const { error } = await this.supabase.rpc('aggregate_live_events_to_game_stats', {
        session_id_param: session.id
      })

      if (error) throw error
      console.log('Live events aggregated to game_stats successfully')
    } catch (error) {
      console.error('Failed to aggregate events to game_stats:', error)
    }
  }

  // Get team totals from live events
  async getTeamTotals(): Promise<any> {
    if (!this.currentSessionKey) {
      throw new Error('No active live game session')
    }

    try {
      if (this.isOnline && this.supabase) {
        // Get from database function
        const { data, error } = await this.supabase.rpc('get_team_totals_from_live_events', {
          session_id: this.currentSessionKey
        })

        if (error) throw error
        return data
      } else {
        // Calculate from offline data
        return this.calculateTeamTotalsFromOffline()
      }
    } catch (error) {
      console.error('Failed to get team totals:', error)
      return this.calculateTeamTotalsFromOffline()
    }
  }

  private calculateTeamTotalsFromOffline(): any {
    const offlineData = this.offlineData.get(this.currentSessionKey!)
    if (!offlineData) return []
    
    const totals: any = {}
    
    offlineData.events.forEach(event => {
      const quarter = event.quarter
      if (!totals[quarter]) {
        totals[quarter] = {
          home_score: 0,
          away_score: 0,
          home_rebounds: 0,
          away_rebounds: 0,
          home_assists: 0,
          away_assists: 0,
          home_steals: 0,
          away_steals: 0,
          home_blocks: 0,
          away_blocks: 0,
          home_turnovers: 0,
          away_turnovers: 0,
          home_fouls: 0,
          away_fouls: 0
        }
      }

      if (event.event_type === 'points') {
        if (event.is_opponent_event) {
          totals[quarter].away_score += event.event_value || 0
        } else {
          totals[quarter].home_score += event.event_value || 0
        }
      } else if (event.event_type === 'rebound') {
        if (event.is_opponent_event) {
          totals[quarter].away_rebounds += 1
        } else {
          totals[quarter].home_rebounds += 1
        }
      }
      // Add other stat types as needed...
    })

    return Object.entries(totals).map(([quarter, stats]) => ({
      quarter: parseInt(quarter),
      ...(stats as any)
    }))
  }

  // Sync offline data to the database
  private async syncOfflineData(): Promise<void> {
    console.log('🔄 syncOfflineData called - isOnline:', this.isOnline, 'supabase:', !!this.supabase)
    
    if (!this.isOnline || !this.supabase) {
      console.log('❌ Sync skipped - offline or no supabase client')
      return
    }

    const pendingSessions = Array.from(this.offlineData.values())
      .filter(data => data.syncStatus === 'pending')
    
    console.log('📊 Found pending sessions to sync:', pendingSessions.length)

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

        // Update game state
        await this.updateOnlineGameState(onlineSession.id, sessionData.gameState)

        // Mark as synced
        sessionData.syncStatus = 'synced'
        this.saveOfflineData()
        console.log('✅ Successfully synced session:', sessionData.sessionKey)

      } catch (error) {
        console.error('❌ Failed to sync session:', sessionData.sessionKey, error)
        sessionData.syncStatus = 'failed'
        this.saveOfflineData()
      }
    }
  }

  private async findOrCreateOnlineSession(sessionData: OfflineGameData): Promise<LiveGameSession> {
    if (!this.supabase) throw new Error('No Supabase client available')
    
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
        game_id: sessionData.gameId,
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
    if (!this.supabase) return
    
    const eventsToSync = events.filter(event => event.sync_status !== 'synced')
    
    if (eventsToSync.length > 0) {
      const { error } = await this.supabase
        .from('live_game_events')
        .insert(eventsToSync.map(event => ({
          session_id: sessionId,
          game_id: event.game_id,
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

  private async updateOnlineGameState(sessionId: number, gameState: any): Promise<void> {
    if (!this.supabase) return
    
    const { error } = await this.supabase
      .from('live_game_sessions')
      .update({ game_state: gameState })
      .eq('id', sessionId)

    if (error) throw error
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<number> {
    try {
      if (this.supabase) {
        // Try to get user from Supabase auth first
        const { data: { user } } = await this.supabase.auth.getUser()
        if (user) {
          // Map auth user to users table - try email first (most reliable)
          try {
            const { data } = await this.supabase
              .from('users')
              .select('id')
              .eq('email', user.email)
              .single()
            
            if (data?.id) {
              return data.id
            }
          } catch (error) {
            console.log('Could not find user by email, trying other methods')
          }

          // If email lookup fails, try to find by any existing user (fallback)
          try {
            const { data } = await this.supabase
              .from('users')
              .select('id')
              .limit(1)
              .single()
            
            if (data?.id) {
              console.log('Using first available user ID as fallback:', data.id)
              return data.id
            }
          } catch (error) {
            console.log('Could not find any users in users table')
          }
        }
      }
    } catch (error) {
      console.log('Supabase auth not available, using fallback user ID')
    }
    
    // Fallback: use a stored user ID or default
    try {
      const storedUserId = localStorage.getItem('basketball-user-id')
      if (storedUserId) {
        return parseInt(storedUserId)
      }
    } catch (error) {
      console.log('Could not get user ID from localStorage')
    }
    
    // Final fallback: use a default user ID
    return 1 // Default user ID
  }

  // Get current session key
  getCurrentSessionKey(): string | null {
    return this.currentSessionKey
  }
  
  // Set user ID manually (for apps with custom auth)
  setUserId(userId: number): void {
    localStorage.setItem('basketball-user-id', userId.toString())
  }

  // Get offline data for current session
  getCurrentSessionOfflineData(): OfflineGameData | undefined {
    if (!this.currentSessionKey) return undefined
    return this.offlineData.get(this.currentSessionKey)
  }

  // Get all offline sessions
  getOfflineSessions(): OfflineGameData[] {
    return Array.from(this.offlineData.values())
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

      const available = 5 * 1024 * 1024 // 5MB estimate
      const percentage = Math.round((used / available) * 100)

      return { used, available, percentage }
    } catch (error) {
      return { used: 0, available: 0, percentage: 0 }
    }
  }
}

// Export singleton instance
export const enhancedLiveStatTrackerService = new EnhancedLiveStatTrackerService()
export default enhancedLiveStatTrackerService
