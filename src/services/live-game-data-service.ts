/**
 * Live Game Data Service
 * Offline-first data layer for Statistics component
 * Preserves existing UI while adding offline capabilities
 */

import { offlineStorage, OfflineSession, OfflineEvent } from './offline-storage'
import { syncService, networkDetector } from './sync-service'
import { cacheService, Player, Event } from './cache-service'

export interface GameState {
  currentQuarter: number
  homeScore: number
  awayScore: number
  isGameActive: boolean
  isPaused: boolean
  lastActionTime: string
}

export interface PlayerStats {
  playerId: number
  playerName: string
  jersey: string
  position: string
  points: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointsMade: number
  threePointsAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  rebounds: number
  offensiveRebounds: number
  defensiveRebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  minutesPlayed: number
  plusMinus: number
}

export interface OpponentStats {
  jersey: string
  points: number
  fieldGoalsMade: number
  fieldGoalsAttempted: number
  threePointsMade: number
  threePointsAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
}

export interface LiveGameData {
  session: OfflineSession | null
  gameState: GameState
  playerStats: PlayerStats[]
  opponentStats: OpponentStats[]
  events: OfflineEvent[]
  roster: Player[]
  event: Event | null
  isOnline: boolean
  syncStatus: {
    pendingSyncs: number
    failedSyncs: number
    isSyncing: boolean
  }
}

class LiveGameDataService {
  private currentSessionId: string | null = null
  private dataListeners: ((data: LiveGameData) => void)[] = []
  private isInitialized = false

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Listen for network status changes
    networkDetector.addListener(async (status) => {
      // When coming back online, check if current session needs Supabase session created
      if (status === 'online' && this.currentSessionId) {
        const session = offlineStorage.getSession(this.currentSessionId)
        if (session) {
          const supabaseSessionId = offlineStorage.getSupabaseSessionMapping(session.sessionKey)
          if (!supabaseSessionId) {
            console.log('🌐 Back online - creating Supabase session for existing local session')
            try {
              const { supabaseAPI } = await import('./supabase-api')
              const { cacheService } = await import('./cache-service')
              const event = await cacheService.getEventById(session.eventId)
              
              if (event) {
                const supabaseSession = await supabaseAPI.createLiveGameSession({
                  event_id: session.eventId,
                  session_key: session.sessionKey,
                  game_id: null,
                  started_at: session.startedAt,
                  quarter: session.gameState.currentQuarter,
                  home_score: session.gameState.homeScore,
                  away_score: session.gameState.awayScore
                })
                
                if (supabaseSession) {
                  offlineStorage.storeSupabaseSessionMapping(session.sessionKey, supabaseSession.id)
                  console.log('✅ Supabase session created after reconnecting:', supabaseSession.id)
                  
                  // Trigger sync now that session exists
                  const { syncService } = await import('./sync-service')
                  syncService.manualSync()
                }
              }
            } catch (error) {
              console.error('❌ Failed to create Supabase session after reconnecting:', error)
            }
          }
        }
      }
      
      this.notifyDataListeners()
    })

    // Listen for sync status changes
    setInterval(() => {
      this.notifyDataListeners()
    }, 5000) // Update every 5 seconds
  }

  public async initialize(eventId: number, choice?: 'resume' | 'startOver'): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Load roster and event data
      const [roster, event] = await Promise.all([
        cacheService.getRoster(),
        cacheService.getEventById(eventId)
      ])

      console.log('LiveGameDataService initialize - eventId:', eventId)
      console.log('LiveGameDataService initialize - event found:', !!event)
      console.log('LiveGameDataService initialize - event:', event)

      if (!event) {
        // Try to refresh events cache and try again
        console.log('Event not found, trying to refresh events cache...')
        try {
          await cacheService.refreshEvents()
          const refreshedEvent = await cacheService.getEventById(eventId)
          console.log('After refresh - event found:', !!refreshedEvent)
          console.log('After refresh - event:', refreshedEvent)
          
          if (!refreshedEvent) {
            throw new Error(`Event ${eventId} not found after cache refresh`)
          }
        } catch (refreshError) {
          console.error('Failed to refresh events cache:', refreshError)
          throw new Error(`Event ${eventId} not found`)
        }
      }

      // Handle session creation - always start new (resume disabled)
      // Always start a new session - resume functionality commented out per user request
      await this.startNewSession(eventId)

      this.isInitialized = true
      this.notifyDataListeners()
    } catch (error) {
      console.error('Failed to initialize live game data:', error)
      throw error
    }
  }

  private async resumeExistingSession(eventId: number): Promise<void> {
    const existingSession = this.findExistingSession(eventId)
    if (!existingSession) {
      throw new Error('No existing session found to resume')
    }

    console.log('🔄 Resuming session - existingSession.id:', existingSession.id)
    console.log('🔄 Resuming session - existingSession.id type:', typeof existingSession.id)
    console.log('🔄 Resuming session - currentSessionId before:', this.currentSessionId)

    this.currentSessionId = existingSession.id
    
    console.log('🔄 Resuming session - currentSessionId after:', this.currentSessionId)
    console.log('Resumed existing session:', existingSession.id)
    
    // Check if this session has a Supabase mapping, if not create one
    if (networkDetector.isCurrentlyOnline()) {
      const supabaseSessionId = offlineStorage.getSupabaseSessionMapping(existingSession.sessionKey)
      if (!supabaseSessionId) {
        console.log('⚠️ No Supabase session mapping found, creating one...')
        try {
          const { supabaseAPI } = await import('./supabase-api')
          const { cacheService } = await import('./cache-service')
          const event = await cacheService.getEventById(eventId)
          
          if (event) {
            const supabaseSession = await supabaseAPI.createLiveGameSession({
              event_id: eventId,
              session_key: existingSession.sessionKey,
              game_id: null,
              started_at: existingSession.startedAt,
              quarter: existingSession.gameState.currentQuarter,
              home_score: existingSession.gameState.homeScore,
              away_score: existingSession.gameState.awayScore
            })
            
            if (supabaseSession) {
              offlineStorage.storeSupabaseSessionMapping(existingSession.sessionKey, supabaseSession.id)
              console.log('✅ Supabase session created for resumed session:', supabaseSession.id)
            }
          }
        } catch (error) {
          console.error('❌ Failed to create Supabase session on resume:', error)
        }
      }
    }
  }

  private async startNewSession(eventId: number): Promise<void> {
    // Deactivate any existing sessions for this event (cleanup old sessions)
    const existingSessions = offlineStorage.getAllSessions().filter(s => s.eventId === eventId && s.isActive)
    existingSessions.forEach(session => {
      const deactivatedSession = {
        ...session,
        isActive: false,
        endedAt: new Date().toISOString()
      }
      offlineStorage.saveSession(deactivatedSession)
      console.log('🔄 Deactivated old session:', session.id)
    })
    
    const sessionId = crypto.randomUUID()
    console.log('🆕 Starting new session - sessionId:', sessionId)
    console.log('🆕 Starting new session - sessionId type:', typeof sessionId)
    console.log('🆕 Starting new session - currentSessionId before:', this.currentSessionId)
    
    const session: OfflineSession = {
      id: sessionId,
      eventId,
      sessionKey: `session_${sessionId}`,
      gameState: {
        currentQuarter: 1,
        homeScore: 0,
        awayScore: 0,
        isGameActive: false,
        isPaused: false,
        lastActionTime: new Date().toISOString()
      },
      isActive: true,
      startedAt: new Date().toISOString(),
      createdBy: 'current_user', // TODO: Get from auth
      lastModified: new Date().toISOString(),
      version: 1,
      deviceId: offlineStorage.getDeviceId()
    }

    offlineStorage.saveSession(session)
    this.currentSessionId = sessionId
    
    console.log('🆕 Starting new session - currentSessionId after:', this.currentSessionId)

    // Create session in Supabase immediately if online
    if (networkDetector.isCurrentlyOnline()) {
      try {
        const { supabaseAPI } = await import('./supabase-api')
        const { cacheService } = await import('./cache-service')
        const event = await cacheService.getEventById(eventId)
        
        if (event) {
          const supabaseSession = await supabaseAPI.createLiveGameSession({
            event_id: eventId,
            session_key: session.sessionKey,
            game_id: null,
            started_at: session.startedAt,
            quarter: session.gameState.currentQuarter,
            home_score: session.gameState.homeScore,
            away_score: session.gameState.awayScore
          })
          
          if (supabaseSession) {
            // Store the Supabase session ID mapping
            offlineStorage.storeSupabaseSessionMapping(session.sessionKey, supabaseSession.id)
            console.log('✅ Session created in Supabase:', supabaseSession.id)
          }
        }
      } catch (error) {
        console.error('❌ Failed to create Supabase session, will retry:', error)
        // Add to sync queue as fallback
        offlineStorage.addToSyncQueue({
          type: 'session',
          data: session,
          maxRetries: 3
        })
      }
    }

    console.log('Started new session:', sessionId)
  }

  private findExistingSession(eventId: number): OfflineSession | null {
    const sessions = offlineStorage.getAllSessions()
    return sessions.find(session => 
      session.eventId === eventId && session.isActive
    ) || null
  }

  public async addGameEvent(eventData: {
    playerId?: number
    eventType: string
    eventValue?: number
    quarter: number
    isOpponentEvent?: boolean
    opponentJersey?: string
    metadata?: any
  }): Promise<void> {
    if (!this.currentSessionId) {
      throw new Error('No active session')
    }

    console.log('🎯 Creating event with currentSessionId:', this.currentSessionId)
    console.log('🎯 CurrentSessionId type:', typeof this.currentSessionId)

    const event: OfflineEvent = {
      id: crypto.randomUUID(),
      sessionId: this.currentSessionId,
      eventType: eventData.eventType,
      eventValue: eventData.eventValue,
      quarter: eventData.quarter,
      isOpponentEvent: eventData.isOpponentEvent || false,
      opponentJersey: eventData.opponentJersey,
      metadata: eventData.metadata || {},
      timestamp: new Date().toISOString(),
      version: 1
    }

    // Save event locally
    offlineStorage.saveEvent(event)

    // Add to sync queue if online
    if (networkDetector.isCurrentlyOnline()) {
      offlineStorage.addToSyncQueue({
        type: 'event',
        data: event,
        maxRetries: 3
      })
    }

    // Update game state
    await this.updateGameState(event)

    this.notifyDataListeners()
  }

  private async updateGameState(event: OfflineEvent): Promise<void> {
    if (!this.currentSessionId) {
      return
    }

    const session = offlineStorage.getSession(this.currentSessionId)
    if (!session) {
      return
    }

    // Update game state based on event
    const gameState = { ...session.gameState }
    
    // Update scores, time, etc. based on event type
    switch (event.eventType) {
      case 'field_goal':
        if (event.isOpponentEvent) {
          gameState.awayScore += event.eventValue || 2
        } else {
          gameState.homeScore += event.eventValue || 2
        }
        break
      case 'free_throw':
        if (event.isOpponentEvent) {
          gameState.awayScore += event.eventValue || 1
        } else {
          gameState.homeScore += event.eventValue || 1
        }
        break
      case 'quarter_end':
        gameState.currentQuarter = Math.min(gameState.currentQuarter + 1, 4)
        break
      case 'game_start':
        gameState.isGameActive = true
        gameState.isPaused = false
        break
      case 'game_pause':
        gameState.isPaused = true
        break
      case 'game_resume':
        gameState.isPaused = false
        break
      case 'game_end':
        gameState.isGameActive = false
        break
    }

    gameState.lastActionTime = event.timestamp

    // Update session
    const updatedSession = {
      ...session,
      gameState,
      lastModified: new Date().toISOString(),
      version: session.version + 1
    }

    offlineStorage.saveSession(updatedSession)

    // Add to sync queue if online
    if (networkDetector.isCurrentlyOnline()) {
      offlineStorage.addToSyncQueue({
        type: 'session',
        data: updatedSession,
        maxRetries: 3
      })
    }
  }

  public async getLiveGameData(): Promise<LiveGameData> {
    const session = this.currentSessionId ? offlineStorage.getSession(this.currentSessionId) : null
    const events = this.currentSessionId ? offlineStorage.getEvents(this.currentSessionId) : []
    const roster = await cacheService.getRoster()
    const event = session ? await cacheService.getEventById(session.eventId) : null
    const syncStatus = syncService.getSyncStatus()

    // Calculate player stats from events
    const playerStats = this.calculatePlayerStats(events, roster)
    
    // Calculate opponent stats from events
    const opponentStats = this.calculateOpponentStats(events)

    return {
      session,
      gameState: session?.gameState || {
        currentQuarter: 1,
        homeScore: 0,
        awayScore: 0,
        isGameActive: false,
        isPaused: false,
        lastActionTime: new Date().toISOString()
      },
      playerStats,
      opponentStats,
      events,
      roster,
      event,
      isOnline: networkDetector.isCurrentlyOnline(),
      syncStatus: {
        pendingSyncs: syncStatus.pendingSyncs,
        failedSyncs: syncStatus.failedSyncs,
        isSyncing: syncStatus.isSyncing
      }
    }
  }

  private calculatePlayerStats(events: OfflineEvent[], roster: Player[]): PlayerStats[] {
    const statsMap = new Map<number, PlayerStats>()

    // Initialize stats for all players
    roster.forEach(player => {
      statsMap.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        jersey: player.jersey,
        position: 'Unknown', // TODO: Get from position data
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
        plusMinus: 0
      })
    })

    // Process events
    events.forEach(event => {
      if (event.isOpponentEvent || !event.playerId) {
        return
      }

      const stats = statsMap.get(event.playerId)
      if (!stats) {
        return
      }

      switch (event.eventType) {
        case 'field_goal':
          stats.fieldGoalsMade++
          stats.fieldGoalsAttempted++
          stats.points += event.eventValue || 2
          break
        case 'field_goal_miss':
          stats.fieldGoalsAttempted++
          break
        case 'three_point':
          stats.threePointsMade++
          stats.threePointsAttempted++
          stats.fieldGoalsMade++
          stats.fieldGoalsAttempted++
          stats.points += event.eventValue || 3
          break
        case 'three_point_miss':
          stats.threePointsAttempted++
          stats.fieldGoalsAttempted++
          break
        case 'free_throw':
          stats.freeThrowsMade++
          stats.freeThrowsAttempted++
          stats.points += event.eventValue || 1
          break
        case 'free_throw_miss':
          stats.freeThrowsAttempted++
          break
        case 'rebound':
          stats.rebounds++
          if (event.metadata?.type === 'offensive') {
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
    })

    return Array.from(statsMap.values())
  }

  private calculateOpponentStats(events: OfflineEvent[]): OpponentStats[] {
    const statsMap = new Map<string, OpponentStats>()

    events.forEach(event => {
      if (!event.isOpponentEvent || !event.opponentJersey) {
        return
      }

      let stats = statsMap.get(event.opponentJersey)
      if (!stats) {
        stats = {
          jersey: event.opponentJersey,
          points: 0,
          fieldGoalsMade: 0,
          fieldGoalsAttempted: 0,
          threePointsMade: 0,
          threePointsAttempted: 0,
          freeThrowsMade: 0,
          freeThrowsAttempted: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fouls: 0
        }
        statsMap.set(event.opponentJersey, stats)
      }

      switch (event.eventType) {
        case 'field_goal':
          stats.fieldGoalsMade++
          stats.fieldGoalsAttempted++
          stats.points += event.eventValue || 2
          break
        case 'field_goal_miss':
          stats.fieldGoalsAttempted++
          break
        case 'three_point':
          stats.threePointsMade++
          stats.threePointsAttempted++
          stats.fieldGoalsMade++
          stats.fieldGoalsAttempted++
          stats.points += event.eventValue || 3
          break
        case 'three_point_miss':
          stats.threePointsAttempted++
          stats.fieldGoalsAttempted++
          break
        case 'free_throw':
          stats.freeThrowsMade++
          stats.freeThrowsAttempted++
          stats.points += event.eventValue || 1
          break
        case 'free_throw_miss':
          stats.freeThrowsAttempted++
          break
        case 'rebound':
          stats.rebounds++
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
    })

    return Array.from(statsMap.values())
  }

  public addDataListener(listener: (data: LiveGameData) => void): () => void {
    this.dataListeners.push(listener)
    
    return () => {
      const index = this.dataListeners.indexOf(listener)
      if (index > -1) {
        this.dataListeners.splice(index, 1)
      }
    }
  }

  private notifyDataListeners(): void {
    this.getLiveGameData().then(data => {
      this.dataListeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error('Error in data listener:', error)
        }
      })
    })
  }

  public async endGame(): Promise<void> {
    if (!this.currentSessionId) {
      return
    }

    const session = offlineStorage.getSession(this.currentSessionId)
    if (!session) {
      return
    }

    const endedSession = {
      ...session,
      isActive: false,
      endedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: session.version + 1
    }

    offlineStorage.saveSession(endedSession)

    // Always add to sync queue so it syncs when online
    offlineStorage.addToSyncQueue({
      type: 'session',
      data: endedSession,
      maxRetries: 3
    })

    // If online, create Supabase session if needed and trigger immediate sync
    if (networkDetector.isCurrentlyOnline()) {
      const supabaseSessionId = offlineStorage.getSupabaseSessionMapping(session.sessionKey)
      
      // If no Supabase session exists, create one before syncing
      if (!supabaseSessionId) {
        console.log('🌐 Creating Supabase session before ending game...')
        try {
          const { supabaseAPI } = await import('./supabase-api')
          const { cacheService } = await import('./cache-service')
          const event = await cacheService.getEventById(session.eventId)
          
          if (event) {
            const supabaseSession = await supabaseAPI.createLiveGameSession({
              event_id: session.eventId,
              session_key: session.sessionKey,
              game_id: null,
              started_at: session.startedAt,
              quarter: session.gameState.currentQuarter,
              home_score: session.gameState.homeScore,
              away_score: session.gameState.awayScore
            })
            
            if (supabaseSession) {
              offlineStorage.storeSupabaseSessionMapping(session.sessionKey, supabaseSession.id)
              console.log('✅ Supabase session created before ending game:', supabaseSession.id)
            }
          }
        } catch (error) {
          console.error('❌ Failed to create Supabase session before ending game:', error)
        }
      }
      
      // Trigger immediate sync to push all data to database
      try {
        await syncService.manualSync()
        console.log('🔄 Game ended - data synced to database')
      } catch (error) {
        console.warn('⚠️ Sync after endGame failed:', error)
      }
    } else {
      console.log('📴 Offline - session queued for sync when back online')
    }

    this.currentSessionId = null
    this.notifyDataListeners()
  }

  public getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  public async getPlayers(): Promise<Player[]> {
    try {
      return await cacheService.getRoster()
    } catch (error) {
      console.error('Failed to get players from cache service:', error)
      return []
    }
  }
}

// Export singleton instance
export const liveGameDataService = new LiveGameDataService()
export default liveGameDataService

