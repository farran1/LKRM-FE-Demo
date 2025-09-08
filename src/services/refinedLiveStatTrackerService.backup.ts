/**
 * BACKUP: Refined Live Stat Tracker Service with Full Offline Functionality
 * This is a complete backup of your offline-enabled service
 * Keep this file for when you want to re-enable offline functionality later
 */

// Core types for the refined service
export interface LiveGameSession {
  id: number
  event_id: number
  game_id?: number
  session_key: string
  game_state: GameState
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

export interface GameState {
  isPlaying: boolean
  currentTime: number // seconds
  quarter: number
  homeScore: number
  awayScore: number
  opponentScore: number
  timeoutHome: number
  timeoutAway: number
}

export interface Player {
  id: number
  name: string
  number: string
  position: string
  minutesPlayed: number
  points: number
  rebounds: number
  offensiveRebounds: number
  defensiveRebounds: number
  assists: number
  steals: number
  blocks: number
  fouls: number
  turnovers: number
  fgAttempted: number
  fgMade: number
  threeAttempted: number
  threeMade: number
  ftAttempted: number
  ftMade: number
  plusMinus: number
  chargesTaken: number
  deflections: number
  isOnCourt: boolean
  isStarter: boolean
  isMainRoster: boolean
}

export interface StatEvent {
  id: string
  timestamp: number
  playerId: number
  playerName: string
  eventType: string
  value?: number
  quarter: number
  gameTime: number
  opponentEvent?: boolean
}

export interface Lineup {
  id: string
  players: number[]
  startTime: number
  endTime?: number
  plusMinus: number
  stats?: any
  name?: string
}

// Comprehensive offline data structure
export interface OfflineGameData {
  id: string
  eventId: number
  sessionKey: string
  gameState: GameState
  players: Player[]
  events: StatEvent[]
  lineups: Lineup[]
  opponentOnCourt: string[]
  substitutionHistory: Array<{
    playerIn: Player
    playerOut: Player
    timestamp: number
    quarter: number
    gameTime: number
    lineupId?: string
  }>
  quickSubHistory: Array<{playerIn: Player, playerOut: Player, timestamp: number}>
  actionHistory: Array<{
    type: 'stat' | 'substitution' | 'timeout' | 'score' | 'quarter'
    timestamp: number
    data: any
    previousState: any
  }>
  timestamp: number
  version: string
  lastSaved: number
  lastModified: number
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
}

// Settings structure
export interface GameSettings {
  quarterDuration: number
  totalQuarters: number
  timeoutCount: number
  shotClock: number
  foulTroubleAlert: boolean
  autoSubstitution: boolean
  statConfirmation: boolean
  soundEffects: boolean
  vibration: boolean
  theme: 'light' | 'dark'
}

// Storage keys
const STORAGE_KEYS = {
  GAME_DATA: 'refined-live-stats-game-data',
  SETTINGS: 'refined-basketball-stats-settings',
  GAME_HISTORY: 'refined-basketball-game-history',
  OFFLINE_STATUS: 'refined-basketball-offline-status',
  USER_ID: 'refined-basketball-user-id'
}

class RefinedLiveStatTrackerService {
  private supabase: any = null
  private offlineData: Map<string, OfflineGameData> = new Map()
  private isOnline: boolean = navigator.onLine
  private currentSessionKey: string | null = null
  private currentEventId: number | null = null
  private syncInProgress: boolean = false

  constructor() {
    this.setupOnlineOfflineListeners()
    this.loadOfflineData()
    this.setupPeriodicSync()
  }

  // ============================================================================
  // INITIALIZATION & SETUP
  // ============================================================================

  setSupabaseClient(client: any) {
    this.supabase = client
    console.log('🔗 Supabase client set, enabling online sync')
    // Trigger immediate sync if we have pending data
    if (this.isOnline) {
      this.syncOfflineData()
    }
  }

  setUserId(userId: number): void {
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId.toString())
  }

  private setupOnlineOfflineListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.updateOfflineStatus()
        console.log('📡 Online - triggering sync')
        this.syncOfflineData()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
        this.updateOfflineStatus()
        console.log('📴 Offline - data will be stored locally')
      })
    }
  }

  private setupPeriodicSync() {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && this.supabase && !this.syncInProgress) {
        this.syncOfflineData()
      }
    }, 30000)
  }

  private updateOfflineStatus() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_STATUS, JSON.stringify({
        isOnline: this.isOnline,
        lastUpdated: Date.now()
      }))
    }
  }

  // ============================================================================
  // OFFLINE DATA MANAGEMENT
  // ============================================================================

  private loadOfflineData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAME_DATA)
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([key, value]) => {
          this.offlineData.set(key, value as OfflineGameData)
        })
        console.log(`📱 Loaded ${this.offlineData.size} offline game sessions`)
      }
    } catch (error) {
      console.error('❌ Failed to load offline data:', error)
    }
  }

  private saveOfflineData() {
    try {
      const data = Object.fromEntries(this.offlineData)
      localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(data))
      
      // Manage storage size - keep only recent 10 games
      this.cleanupOldData()
    } catch (error) {
      console.error('❌ Failed to save offline data:', error)
      
      // If storage is full, cleanup and try again
      this.cleanupOldData()
      try {
        const data = Object.fromEntries(this.offlineData)
        localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(data))
      } catch (retryError) {
        console.error('❌ Failed to save even after cleanup:', retryError)
      }
    }
  }

  private cleanupOldData() {
    const sessions = Array.from(this.offlineData.values())
      .sort((a, b) => b.lastModified - a.lastModified)
    
    // Keep only the 10 most recent sessions
    if (sessions.length > 10) {
      const toRemove = sessions.slice(10)
      toRemove.forEach(session => {
        this.offlineData.delete(session.sessionKey)
      })
      console.log(`🧹 Cleaned up ${toRemove.length} old sessions`)
    }
  }

  // ============================================================================
  // GAME SESSION MANAGEMENT
  // ============================================================================

  async startLiveGame(eventId: number, gameId?: number, initialGameState: Partial<GameState> = {}): Promise<OfflineGameData> {
    console.log(`🎮 Starting live game for event ${eventId}`)

    // If an existing session for this event exists, resume it
    const existing = Array.from(this.offlineData.values()).find(s => s.eventId === eventId)
    if (existing) {
      console.log('🔁 Resuming existing session for event:', eventId, existing.sessionKey)
      // Ensure action history is present for syncing
      if ((!existing.actionHistory || existing.actionHistory.length === 0) && Array.isArray(existing.events) && existing.events.length > 0) {
        try {
          existing.actionHistory = existing.events.map((e: any) => ({
            type: 'stat',
            timestamp: e.created_at || Date.now(),
            data: {
              player_id: e.player_id ?? null,
              event_type: e.event_type,
              event_value: e.event_value ?? null,
              quarter: e.quarter ?? existing.gameState?.quarter ?? 1,
              game_time: e.game_time ?? existing.gameState?.currentTime ?? 0,
              is_opponent_event: !!e.is_opponent_event,
              opponent_jersey: e.opponent_jersey ?? null,
              metadata: e.metadata ?? {}
            },
            previousState: null
          }))
        } catch (error) {
          console.error('Failed to reconstruct action history:', error)
        }
      }
      this.currentSessionKey = existing.sessionKey
      this.currentEventId = existing.eventId
      return existing
    }

    // Create new session
    const sessionKey = `refined-live-game-${eventId}-${Date.now()}`
    const gameData: OfflineGameData = {
      id: sessionKey,
      eventId,
      sessionKey,
      gameState: {
        isPlaying: false,
        currentTime: 0,
        quarter: 1,
        homeScore: 0,
        awayScore: 0,
        opponentScore: 0,
        timeoutHome: 3,
        timeoutAway: 3,
        ...initialGameState
      },
      players: [],
      events: [],
      lineups: [],
      opponentOnCourt: [],
      substitutionHistory: [],
      quickSubHistory: [],
      actionHistory: [],
      timestamp: Date.now(),
      version: '2.0',
      lastSaved: Date.now(),
      lastModified: Date.now(),
      syncStatus: 'pending'
    }

    this.offlineData.set(sessionKey, gameData)
    this.currentSessionKey = sessionKey
    this.currentEventId = eventId
    this.saveOfflineData()

    console.log(`🎮 Created new live game session: ${sessionKey}`)
    return gameData
  }

  // ============================================================================
  // STAT RECORDING
  // ============================================================================

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

    const event: LiveGameEvent = {
      id: Date.now(),
      session_id: 0, // Will be updated during sync
      game_id: undefined,
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

    // Queue for sync
    const gameData = this.offlineData.get(this.currentSessionKey)
    if (gameData) {
      // Store in metadata for sync
      if (!gameData.actionHistory) {
        gameData.actionHistory = []
      }
      gameData.actionHistory.push({
        type: 'stat',
        timestamp: Date.now(),
        data: event,
        previousState: null
      })
      gameData.lastModified = Date.now()
      gameData.syncStatus = 'pending'
      this.saveOfflineData()
    }

    // Queue sync if online
    if (this.isOnline && this.supabase) {
      this.debouncedSync()
    }

    return event
  }

  // ============================================================================
  // SYNC FUNCTIONALITY
  // ============================================================================

  private debouncedSyncTimeout: NodeJS.Timeout | null = null

  private debouncedSync() {
    if (this.debouncedSyncTimeout) {
      clearTimeout(this.debouncedSyncTimeout)
    }
    
    this.debouncedSyncTimeout = setTimeout(() => {
      this.syncOfflineData()
    }, 2000) // Wait 2 seconds after last change
  }

  private async syncOfflineData(): Promise<void> {
    if (!this.isOnline || !this.supabase || this.syncInProgress) {
      return
    }

    this.syncInProgress = true
    console.log('🔄 Starting sync of offline data...')

    try {
      const pendingSessions = Array.from(this.offlineData.values())
        .filter(data => data.syncStatus === 'pending')

      console.log(`📊 Found ${pendingSessions.length} sessions to sync`)

      for (const sessionData of pendingSessions) {
        try {
          sessionData.syncStatus = 'syncing'
          this.saveOfflineData()

          await this.syncSession(sessionData)

          sessionData.syncStatus = 'synced'
          this.saveOfflineData()
          console.log(`✅ Synced session: ${sessionData.sessionKey}`)
        } catch (error) {
          console.error(`❌ Failed to sync session ${sessionData.sessionKey}:`, error)
          sessionData.syncStatus = 'failed'
          this.saveOfflineData()
        }
      }
    } catch (error) {
      console.error('❌ Sync failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncSession(sessionData: OfflineGameData): Promise<void> {
    // Create or update session in database
    const { data: session, error: sessionError } = await this.supabase
      .from('live_game_sessions')
      .upsert({
        event_id: sessionData.eventId,
        game_id: undefined, // TODO: Handle game ID
        session_key: sessionData.sessionKey,
        is_active: true,
        started_at: new Date(sessionData.timestamp).toISOString(),
        created_by: 1 // TODO: Get actual user ID
      })
      .select()
      .single()

    if (sessionError) {
      throw new Error(`Failed to sync session: ${sessionError.message}`)
    }

    // Sync all events
    if (sessionData.actionHistory && sessionData.actionHistory.length > 0) {
      const eventsToSync = sessionData.actionHistory
        .filter(action => action.type === 'stat')
        .map(action => action.data)

      if (eventsToSync.length > 0) {
        const { error: eventsError } = await this.supabase
          .from('live_game_events')
          .insert(
            eventsToSync.map(event => ({
              session_id: session.id,
              player_id: event.player_id,
              event_type: event.event_type,
              event_value: event.event_value,
              quarter: event.quarter,
              game_time: event.game_time,
              is_opponent_event: event.is_opponent_event,
              opponent_jersey: event.opponent_jersey,
              metadata: event.metadata,
              created_at: new Date(event.timestamp || Date.now()).toISOString()
            }))
          )

        if (eventsError) {
          throw new Error(`Failed to sync events: ${eventsError.message}`)
        }

        console.log(`📊 Synced ${eventsToSync.length} events for session ${session.id}`)
      }
    }

    // Update sync status
    await this.supabase
      .from('live_game_sync_status')
      .upsert({
        session_id: session.id,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  getOfflineStatus(): { isOnline: boolean; lastUpdated: number } {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_STATUS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to get offline status:', error)
    }
    
    return { isOnline: this.isOnline, lastUpdated: Date.now() }
  }

  getPendingEventsCount(): number {
    let totalPending = 0
    
    this.offlineData.forEach((gameData) => {
      if (gameData.syncStatus === 'pending' || gameData.syncStatus === 'failed') {
        totalPending += gameData.events?.length || 0
      }
    })
    
    return totalPending
  }

  getLastSyncTime(): string | null {
    let lastSync: string | null = null
    
    this.offlineData.forEach((gameData) => {
      if (gameData.syncStatus === 'synced' && gameData.lastSaved) {
        const syncTime = new Date(gameData.lastSaved).toISOString()
        if (!lastSync || syncTime > lastSync) {
          lastSync = syncTime
        }
      }
    })
    
    return lastSync
  }

  hasActiveSession(): boolean {
    return this.currentSessionKey !== null
  }

  getCurrentSessionKey(): string | null {
    return this.currentSessionKey
  }

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

  exportOfflineData(): string {
    const exportData = {
      timestamp: Date.now(),
      version: '2.0',
      sessions: Array.from(this.offlineData.values())
    }
    return JSON.stringify(exportData, null, 2)
  }

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  loadSettings(): GameSettings | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return null
  }
}

// Export singleton instance
export const refinedLiveStatTrackerService = new RefinedLiveStatTrackerService()
export default refinedLiveStatTrackerService
