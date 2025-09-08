/**
 * Refined Live Stat Tracker Service - SIMPLIFIED MODE
 * Temporarily disabled offline complexity to focus on real-time tracking
 * Full offline functionality is backed up in refinedLiveStatTrackerService.backup.ts
 * 
 * TODO: Re-enable offline functionality after aggregates are working properly
 */

// Core types for the simplified service
export interface LiveGameSession {
  id: number
  event_id: number
  game_id?: number
  session_key: string
  is_active: boolean
  started_at: string
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

// Simplified offline data structure (minimal)
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

class RefinedLiveStatTrackerService {
  private supabase: any = null
  private currentSessionId: number | null = null
  private currentEventId: number | null = null
  private currentGameId: number | null = null
  private userId: number | null = null

  constructor() {
    // Simplified mode - no offline complexity
    console.log('🔧 RefinedLiveStatTrackerService running in SIMPLIFIED MODE')
    console.log('📱 Offline functionality temporarily disabled - focus on real-time tracking')
  }

  // ============================================================================
  // INITIALIZATION & SETUP
  // ============================================================================

  setSupabaseClient(client: any) {
    this.supabase = client
    console.log('🔌 Supabase client set')
  }

  setUserId(userId: number): void {
    this.userId = userId
    console.log('👤 User ID set:', userId)
  }

  // ============================================================================
  // GAME SESSION MANAGEMENT
  // ============================================================================

  async startLiveGame(eventId: number, gameId: number | undefined, gameState: GameState): Promise<{ sessionKey: string }> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Create a new live game session
      const { data: session, error } = await this.supabase
        .from('live_game_sessions')
        .insert({
          event_id: eventId,
          game_id: gameId,
          session_key: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          is_active: true,
          started_at: new Date().toISOString(),
          created_by: this.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create live game session: ${error.message}`)
      }

      this.currentSessionId = session.id
      console.log('🎮 Live game session started:', session.session_key)
      
      return { sessionKey: session.session_key }
    } catch (error) {
      console.error('Failed to start live game:', error)
      throw error
    }
  }

  async updateGameState(gameState: GameState): Promise<void> {
    try {
      if (!this.currentSessionId || !this.supabase) {
        console.warn('No active session or Supabase client')
        return
      }

      // Update the game state in the database
      const { error } = await this.supabase
        .from('live_game_sessions')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentSessionId)

      if (error) {
        console.error('Failed to update game state:', error)
      } else {
        console.log('🔄 Game state updated')
      }
    } catch (error) {
      console.error('Failed to update game state:', error)
    }
  }

  // Update analytics inside game_state (merge, not replace)
  async updateAnalytics(analytics: any): Promise<void> {
    try {
      if (!this.currentSessionId || !this.supabase) {
        return
      }

      // Fetch current game_state
      const { data: session, error: fetchError } = await this.supabase
        .from('live_game_sessions')
        .select('game_state')
        .eq('id', this.currentSessionId)
        .single()

      if (fetchError) {
        console.error('Failed to fetch game_state:', fetchError)
        return
      }

      const currentState = (session?.game_state as any) || {}
      const merged = { ...currentState, analytics }

      const { error: updateError } = await this.supabase
        .from('live_game_sessions')
        .update({ game_state: merged, updated_at: new Date().toISOString() })
        .eq('id', this.currentSessionId)

      if (updateError) {
        console.error('Failed to update analytics into game_state:', updateError)
      }
    } catch (error) {
      console.error('updateAnalytics error:', error)
    }
  }

  async endLiveGame(): Promise<void> {
    try {
      if (!this.currentSessionId || !this.supabase) {
        console.warn('No active session or Supabase client')
        return
      }

      // Mark the session as inactive
      const { error } = await this.supabase
        .from('live_game_sessions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentSessionId)

      if (error) {
        console.error('Failed to end live game:', error)
      } else {
        console.log('🏁 Live game ended')
        this.currentSessionId = null
      }
    } catch (error) {
      console.error('Failed to end live game:', error)
    }
  }

  getAllSavedGames(): Array<{ 
    id: string; 
    eventId: number; 
    sessionKey: string; 
    startedAt: string; 
    timestamp: string; 
    events: any[] 
  }> {
    // In simplified mode, return empty array since we're not storing offline games
    // This could be enhanced to fetch from live_game_sessions table if needed
    return []
  }

  async getAllSavedGamesFromDatabase(): Promise<Array<{ 
    id: string; 
    eventId: number; 
    sessionKey: string; 
    startedAt: string; 
    timestamp: string; 
    events: any[] 
  }>> {
    try {
      if (!this.supabase) {
        return []
      }

      // Fetch all live game sessions
      const { data: sessions, error } = await this.supabase
        .from('live_game_sessions')
        .select(`
          id,
          event_id,
          session_key,
          started_at,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch saved games:', error)
        return []
      }

      // For each session, get the event count
      const gamesWithEventCounts = await Promise.all(
        sessions.map(async (session: any) => {
          const { count: eventCount } = await this.supabase
            .from('live_game_events')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id)

          return {
            id: session.id.toString(),
            eventId: session.event_id,
            sessionKey: session.session_key,
            startedAt: session.started_at,
            timestamp: session.created_at,
            events: Array(eventCount || 0).fill(null) // Mock events array with count
          }
        })
      )

      return gamesWithEventCounts
    } catch (error) {
      console.error('Failed to fetch saved games from database:', error)
      return []
    }
  }

  async getSessionIdForEvent(eventId: number): Promise<number | null> {
    try {
      if (!this.supabase) {
        return null
      }

      // Get the most recent session for this event
      const { data: session, error } = await this.supabase
        .from('live_game_sessions')
        .select('id')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Failed to get session ID for event:', error)
        return null
      }

      return session?.id || null
    } catch (error) {
      console.error('Failed to get session ID for event:', error)
      return null
    }
  }

  async isSessionAlreadyAggregated(sessionId: number): Promise<boolean> {
    try {
      if (!this.supabase) {
        return false
      }

      // Check if there's already a game record for this session
      const { data: game, error } = await this.supabase
        .from('games')
        .select('id')
        .eq('live_session_id', sessionId)
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Failed to check if session is aggregated:', error)
        return false
      }

      return !!game
    } catch (error) {
      console.error('Failed to check if session is aggregated:', error)
      return false
    }
  }

  loadGameData(eventId: number): any {
    // In simplified mode, return null since we're not storing offline games
    // This could be enhanced to fetch from live_game_sessions and related tables if needed
    return null
  }

  saveGameData(eventId: number, gameData: any): void {
    // In simplified mode, do nothing since we're not storing offline games
    // Data is already being saved to Supabase in real-time
    console.log('💾 Game data save called (simplified mode)')
  }

  clearAllOfflineData(): void {
    // In simplified mode, do nothing since there's no offline data
    console.log('🗑️ Clear offline data called (simplified mode)')
  }

  deleteGameData(eventId: number): void {
    // In simplified mode, do nothing since we're not storing offline games
    console.log('🗑️ Delete game data called (simplified mode)')
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
    if (!this.currentSessionId || !this.supabase) {
      throw new Error('No active live game session')
    }

    // Defensive: coerce invalid player IDs to null to satisfy FK
    const safePlayerId = (typeof playerId === 'number' && playerId > 0) ? playerId : null
    const safeGameTime = Math.max(0, Math.min(3599, Math.floor(gameTime || 0)))

    // Insert event directly to database
    const { data: event, error } = await this.supabase
      .from('live_game_events')
      .insert({
        session_id: this.currentSessionId,
        player_id: safePlayerId,
        event_type: eventType,
        event_value: eventValue,
        quarter,
        game_time: safeGameTime,
        is_opponent_event: isOpponentEvent,
        opponent_jersey: opponentJersey,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to record event: ${error.message}`)
    }

    console.log(`📊 Recorded event: ${eventType} for player ${playerId}`)
    return event
  }

  // ============================================================================
  // PUBLIC API METHODS (Simplified)
  // ============================================================================

  getOfflineStatus(): { isOnline: boolean; lastUpdated: number } {
    // Simplified mode - always return online
    return { isOnline: true, lastUpdated: Date.now() }
  }

  getPendingEventsCount(): number {
    // Simplified mode - no pending events
    return 0
  }

  getLastSyncTime(): string | null {
    // Simplified mode - no sync needed
    return new Date().toISOString()
  }

  hasActiveSession(): boolean {
    return this.currentSessionId !== null
  }

  hasSupabaseClient(): boolean {
    return this.supabase !== null
  }

  getCurrentSessionKey(): string | null {
    return this.currentSessionId ? this.currentSessionId.toString() : null
  }

  getStorageUsage(): { used: number; available: number; percentage: number } {
    // Simplified mode - no offline storage
    return { used: 0, available: 0, percentage: 0 }
  }

  exportOfflineData(): string {
    // Simplified mode - no offline data
    return JSON.stringify({ message: 'Offline functionality disabled', timestamp: Date.now() })
  }

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  private getDefaultSettings(): GameSettings {
    return {
      quarterDuration: 600,
      totalQuarters: 4,
      timeoutCount: 4,
      shotClock: 30,
      foulTroubleAlert: true,
      autoSubstitution: false,
      statConfirmation: true,
      soundEffects: false,
      vibration: false,
      theme: 'light'
    }
  }

  async saveSettings(settings: Partial<GameSettings>): Promise<void> {
    try {
      // Always mirror to localStorage as a fallback
      try {
        const merged = { ...this.getDefaultSettings(), ...settings }
        localStorage.setItem('basketballStatsSettings', JSON.stringify(merged))
      } catch {}

      if (!this.supabase || !this.currentSessionId) {
        console.log('⚙️ Saved settings locally (no session or client)')
        return
      }

      // Map to DB columns
      const payload = {
        session_id: this.currentSessionId,
        quarter_duration: (settings.quarterDuration ?? this.getDefaultSettings().quarterDuration),
        total_quarters: (settings.totalQuarters ?? this.getDefaultSettings().totalQuarters),
        timeout_count: (settings.timeoutCount ?? this.getDefaultSettings().timeoutCount),
        shot_clock: (settings.shotClock ?? this.getDefaultSettings().shotClock),
        auto_pause_on_timeout: true, // conservative default
        auto_pause_on_quarter_end: true // conservative default
      }

      // Upsert into live_game_settings
      const { error } = await this.supabase
        .from('live_game_settings')
        .upsert(payload, { onConflict: 'session_id' })

      if (error) {
        console.error('Failed to save settings to Supabase:', error)
      } else {
        console.log('⚙️ Settings saved to Supabase')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  async loadSettings(): Promise<GameSettings> {
    // Try Supabase for current session first
    try {
      if (this.supabase && this.currentSessionId) {
        const { data, error } = await this.supabase
          .from('live_game_settings')
          .select('*')
          .eq('session_id', this.currentSessionId)
          .single()

        if (!error && data) {
          const merged: GameSettings = {
            ...this.getDefaultSettings(),
            quarterDuration: data.quarter_duration ?? this.getDefaultSettings().quarterDuration,
            totalQuarters: data.total_quarters ?? this.getDefaultSettings().totalQuarters,
            timeoutCount: data.timeout_count ?? this.getDefaultSettings().timeoutCount,
            shotClock: data.shot_clock ?? this.getDefaultSettings().shotClock
          }
          // Mirror to localStorage for next time
          try { localStorage.setItem('basketballStatsSettings', JSON.stringify(merged)) } catch {}
          return merged
        }
      }
    } catch (e) {
      console.warn('Failed to load settings from Supabase, falling back to localStorage')
    }

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('basketballStatsSettings')
      if (saved) {
        return { ...this.getDefaultSettings(), ...JSON.parse(saved) }
      }
    } catch {}

    // Final fallback
    return this.getDefaultSettings()
  }

  // ============================================================================
  // SIMPLIFIED SYNC (Direct database operations)
  // ============================================================================

  async syncOfflineData(): Promise<void> {
    // Simplified mode - no offline sync needed
    console.log('🔄 Sync called but not needed in simplified mode')
  }

  // ============================================================================
  // GAME AGGREGATION & STATISTICS
  // ============================================================================

  async aggregateGameStats(sessionId: number): Promise<{ gameId: number; playerStats: any[] }> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Get the live game session
      const { data: session, error: sessionError } = await this.supabase
        .from('live_game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        throw new Error('Session not found')
      }

      // Get all events for this session
      const { data: events, error: eventsError } = await this.supabase
        .from('live_game_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (eventsError) {
        throw new Error(`Failed to fetch events: ${eventsError.message}`)
      }

      // Get the event details to get opponent team name
      const { data: event, error: eventError } = await this.supabase
        .from('events')
        .select('oppositionTeam')
        .eq('id', session.event_id)
        .single()

      if (eventError) {
        console.warn('Could not fetch event details, using default opponent name')
      }

      // Create a new game record
      const { data: game, error: gameError } = await this.supabase
        .from('games')
        .insert({
          eventId: session.event_id,
          opponent: event?.oppositionTeam || 'Opponent Team',
          homeScore: 0, // Will be calculated from events
          awayScore: 0, // Will be calculated from events
          gameDate: session.started_at,
          season: '2024-25',
          createdBy: session.created_by || 1
        })
        .select()
        .single()

      if (gameError) {
        throw new Error(`Failed to create game record: ${gameError.message}`)
      }

      // Aggregate player statistics
      const playerStats = await this.aggregatePlayerStats(events, game.id, session.created_by || 1)

      // Update game with final scores
      const homeScore = playerStats.reduce((sum: number, stat: any) => sum + stat.points, 0)
      const awayScore = events
        .filter((e: any) => e.is_opponent_event && (e.event_type.includes('made') || e.event_type === 'points'))
        .reduce((sum: number, e: any) => sum + (e.event_value || (e.event_type === 'three_made' ? 3 : e.event_type === 'ft_made' ? 1 : 2)), 0)

      await this.supabase
        .from('games')
        .update({
          homeScore,
          awayScore,
          result: homeScore > awayScore ? 'WIN' : homeScore < awayScore ? 'LOSS' : 'TIE'
        })
        .eq('id', game.id)

      // Mark session as ended
      await this.supabase
        .from('live_game_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      console.log(`🏁 Game aggregated successfully: ${game.id}`)
      return { gameId: game.id, playerStats }
    } catch (error) {
      console.error('Failed to aggregate game stats:', error)
      throw error
    }
  }

  private async aggregatePlayerStats(events: any[], gameId: number, userId: number): Promise<any[]> {
    const playerStatsMap = new Map<number, any>()

    // Initialize player stats
    for (const event of events) {
      if (event.player_id && event.player_id > 0) {
        if (!playerStatsMap.has(event.player_id)) {
          playerStatsMap.set(event.player_id, {
            gameId,
            playerId: event.player_id,
            userId,
            points: 0,
            fieldGoalsMade: 0,
            fieldGoalsAttempted: 0,
            threePointsMade: 0,
            threePointsAttempted: 0,
            freeThrowsMade: 0,
            freeThrowsAttempted: 0,
            rebounds: 0,
            offensiveRebounds: 0,
            defensiveRebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fouls: 0,
            minutesPlayed: 0,
            plusMinus: 0,
            quarter: 1,
            period: 'game',
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    // Aggregate stats from events
    for (const event of events) {
      if (event.player_id && event.player_id > 0) {
        const stats = playerStatsMap.get(event.player_id)
        if (stats) {
          switch (event.event_type) {
            case 'fg_made':
              stats.fieldGoalsMade++
              stats.fieldGoalsAttempted++
              stats.points += event.event_value || 2
              break
            case 'fg_missed':
              stats.fieldGoalsAttempted++
              break
            case 'three_made':
              stats.threePointsMade++
              stats.threePointsAttempted++
              stats.points += 3
              break
            case 'three_missed':
              stats.threePointsAttempted++
              break
            case 'ft_made':
              stats.freeThrowsMade++
              stats.freeThrowsAttempted++
              stats.points += 1
              break
            case 'ft_missed':
              stats.freeThrowsAttempted++
              break
            case 'rebound':
              stats.rebounds++
              // Assume offensive if it's after a missed shot
              if (event.metadata?.isOffensive) {
                stats.offensiveRebounds++
              } else {
                stats.defensiveRebounds++
              }
              break
            case 'assist':
              stats.assists++
              break
            case 'steal':
              stats.steals++
              break
            case 'block':
              stats.blocks++
              break
            case 'turnover':
              stats.turnovers++
              break
            case 'foul':
              stats.fouls++
              break
          }
        }
      }
    }

    // Insert aggregated stats into game_stats table
    const playerStats = Array.from(playerStatsMap.values())
    if (playerStats.length > 0) {
      const { error: insertError } = await this.supabase
        .from('game_stats')
        .insert(playerStats)

      if (insertError) {
        console.error('Failed to insert game stats:', insertError)
        throw new Error(`Failed to insert game stats: ${insertError.message}`)
      }
    }

    return playerStats
  }

  // ============================================================================
  // END GAME & FINALIZE
  // ============================================================================

  async endGameAndAggregate(sessionId: number): Promise<{ gameId: number; playerStats: any[] }> {
    try {
      // First aggregate the stats
      const result = await this.aggregateGameStats(sessionId)
      
      // Then end the live session
      await this.endLiveGame()
      
      console.log('🏁 Game ended and stats aggregated successfully')
      return result
    } catch (error) {
      console.error('Failed to end game and aggregate:', error)
      throw error
    }
  }

  // Aggregate stats for any existing session (useful for testing)
  async aggregateExistingSession(sessionId: number): Promise<{ gameId: number; playerStats: any[] }> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Check if session exists and is active
      const { data: session, error: sessionError } = await this.supabase
        .from('live_game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        throw new Error('Session not found')
      }

      // Check if stats were already aggregated
      const { data: existingGame, error: gameCheckError } = await this.supabase
        .from('games')
        .select('id')
        .eq('eventId', session.event_id)
        .single()

      if (existingGame && !gameCheckError) {
        console.log('Stats already aggregated for this session')
        return { gameId: existingGame.id, playerStats: [] }
      }

      // Aggregate the stats
      return await this.aggregateGameStats(sessionId)
    } catch (error) {
      console.error('Failed to aggregate existing session:', error)
      throw error
    }
  }
}

// Export singleton instance
export const refinedLiveStatTrackerService = new RefinedLiveStatTrackerService()
export default refinedLiveStatTrackerService
