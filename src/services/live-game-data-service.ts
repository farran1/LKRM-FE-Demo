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
    networkDetector.addListener((status) => {
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

      // Handle session creation/resume
      if (choice === 'resume') {
        await this.resumeExistingSession(eventId)
      } else if (choice === 'startOver') {
        await this.startNewSession(eventId)
      } else {
        // Check for existing session
        const existingSession = this.findExistingSession(eventId)
        if (existingSession) {
          await this.resumeExistingSession(eventId)
        } else {
          await this.startNewSession(eventId)
        }
      }

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
  }

  private async startNewSession(eventId: number): Promise<void> {
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

    // Add to sync queue if online
    if (networkDetector.isCurrentlyOnline()) {
      offlineStorage.addToSyncQueue({
        type: 'session',
        data: session,
        maxRetries: 3
      })
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

    // Add to sync queue if online
    if (networkDetector.isCurrentlyOnline()) {
      offlineStorage.addToSyncQueue({
        type: 'session',
        data: endedSession,
        maxRetries: 3
      })
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

