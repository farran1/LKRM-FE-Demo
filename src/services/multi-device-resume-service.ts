/**
 * Multi-Device Resume Service
 * Handles conflict resolution for cross-device game sessions
 */

import { offlineStorage, OfflineSession } from './offline-storage'
import { syncService } from './sync-service'

export interface SessionConflict {
  localSession: OfflineSession
  remoteSession: OfflineSession
  conflictType: 'version' | 'device' | 'time'
  description: string
}

export interface ResumeOption {
  session: OfflineSession
  source: 'local' | 'remote' | 'merged'
  description: string
  lastModified: string
  deviceId: string
  eventCount: number
}

export interface ConflictResolution {
  chosenSession: OfflineSession
  resolution: 'local' | 'remote' | 'merged'
  conflictsResolved: number
}

class MultiDeviceResumeService {
  private readonly MERGE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

  /**
   * Find all available sessions for an event across devices
   */
  public async findAvailableSessions(eventId: number): Promise<ResumeOption[]> {
    const localSessions = offlineStorage.getAllSessions()
      .filter(session => session.eventId === eventId)
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

    const remoteSessions = await this.fetchRemoteSessions(eventId)
    
    const allSessions = [...localSessions, ...remoteSessions]
    const uniqueSessions = this.deduplicateSessions(allSessions)

    return uniqueSessions.map(session => ({
      session,
      source: this.getSessionSource(session, localSessions, remoteSessions),
      description: this.generateSessionDescription(session),
      lastModified: session.lastModified,
      deviceId: session.deviceId,
      eventCount: this.getEventCount(session.id)
    }))
  }

  /**
   * Detect conflicts between local and remote sessions
   */
  public detectConflicts(eventId: number): SessionConflict[] {
    const localSessions = offlineStorage.getAllSessions()
      .filter(session => session.eventId === eventId && session.isActive)
    
    const conflicts: SessionConflict[] = []

    // Check for version conflicts
    localSessions.forEach(localSession => {
      // This would be expanded to check against remote sessions
      // For now, we'll focus on local conflict detection
    })

    return conflicts
  }

  /**
   * Resolve conflicts and choose the best session to resume
   */
  public async resolveConflicts(
    eventId: number, 
    userChoice?: 'local' | 'remote' | 'merged'
  ): Promise<ConflictResolution> {
    const availableSessions = await this.findAvailableSessions(eventId)
    
    if (availableSessions.length === 0) {
      throw new Error('No sessions found for this event')
    }

    if (availableSessions.length === 1) {
      return {
        chosenSession: availableSessions[0].session,
        resolution: availableSessions[0].source,
        conflictsResolved: 0
      }
    }

    // Multiple sessions found - need conflict resolution
    const conflicts = this.detectConflicts(eventId)
    
    if (userChoice) {
      return this.resolveWithUserChoice(availableSessions, userChoice, conflicts)
    }

    // Auto-resolve based on heuristics
    return this.autoResolveConflicts(availableSessions, conflicts)
  }

  /**
   * Merge two sessions intelligently
   */
  public async mergeSessions(
    session1: OfflineSession, 
    session2: OfflineSession
  ): Promise<OfflineSession> {
    const mergedSession: OfflineSession = {
      ...session1,
      id: crypto.randomUUID(), // New ID for merged session
      version: Math.max(session1.version, session2.version) + 1,
      lastModified: new Date().toISOString(),
      deviceId: offlineStorage.getDeviceId()
    }

    // Merge game states
    mergedSession.gameState = this.mergeGameStates(session1.gameState, session2.gameState)

    // Merge events from both sessions
    const events1 = offlineStorage.getEvents(session1.id)
    const events2 = offlineStorage.getEvents(session2.id)
    const mergedEvents = this.mergeEvents(events1, events2)

    // Save merged session
    offlineStorage.saveSession(mergedSession)
    offlineStorage.set(`live_game_events_${mergedSession.id}`, mergedEvents)

    return mergedSession
  }

  /**
   * Show conflict resolution UI to user
   */
  public async showConflictResolutionUI(
    eventId: number,
    onResolved: (resolution: ConflictResolution) => void
  ): Promise<void> {
    const availableSessions = await this.findAvailableSessions(eventId)
    
    if (availableSessions.length <= 1) {
      // No conflicts, proceed with single session
      if (availableSessions.length === 1) {
        onResolved({
          chosenSession: availableSessions[0].session,
          resolution: availableSessions[0].source,
          conflictsResolved: 0
        })
      }
      return
    }

    // Show conflict resolution modal
    this.showConflictModal(availableSessions, onResolved)
  }

  private async fetchRemoteSessions(eventId: number): Promise<OfflineSession[]> {
    if (!syncService.getNetworkDetector().isCurrentlyOnline()) {
      return []
    }

    try {
      const response = await fetch(`/api/live-stat-tracker/sessions?eventId=${eventId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        return data.map((session: any) => this.convertToOfflineSession(session))
      }
    } catch (error) {
      console.warn('Failed to fetch remote sessions:', error)
    }

    return []
  }

  private convertToOfflineSession(supabaseSession: any): OfflineSession {
    return {
      id: supabaseSession.session_key,
      eventId: supabaseSession.event_id,
      gameId: supabaseSession.game_id,
      sessionKey: supabaseSession.session_key,
      gameState: supabaseSession.game_state || {},
      isActive: supabaseSession.is_active,
      startedAt: supabaseSession.started_at,
      endedAt: supabaseSession.ended_at,
      createdBy: supabaseSession.created_by,
      lastModified: supabaseSession.updated_at,
      version: supabaseSession.version || 1,
      deviceId: supabaseSession.device_id || 'unknown'
    }
  }

  private deduplicateSessions(sessions: OfflineSession[]): OfflineSession[] {
    const seen = new Set<string>()
    return sessions.filter(session => {
      const key = `${session.eventId}-${session.sessionKey}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private getSessionSource(
    session: OfflineSession, 
    localSessions: OfflineSession[], 
    remoteSessions: OfflineSession[]
  ): 'local' | 'remote' | 'merged' {
    const isLocal = localSessions.some(s => s.id === session.id)
    const isRemote = remoteSessions.some(s => s.id === session.id)
    
    if (isLocal && isRemote) return 'merged'
    if (isLocal) return 'local'
    return 'remote'
  }

  private generateSessionDescription(session: OfflineSession): string {
    const deviceInfo = session.deviceId === offlineStorage.getDeviceId() ? 'This device' : 'Other device'
    const status = session.isActive ? 'Active' : 'Ended'
    const eventCount = this.getEventCount(session.id)
    
    return `${deviceInfo} • ${status} • ${eventCount} events • ${this.formatDate(session.lastModified)}`
  }

  private getEventCount(sessionId: string): number {
    const events = offlineStorage.getEvents(sessionId)
    return events.length
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString()
  }

  private mergeGameStates(state1: any, state2: any): any {
    // Merge game states intelligently
    return {
      ...state1,
      ...state2,
      // Take the maximum values for scores, time, etc.
      homeScore: Math.max(state1.homeScore || 0, state2.homeScore || 0),
      awayScore: Math.max(state1.awayScore || 0, state2.awayScore || 0),
      currentQuarter: Math.max(state1.currentQuarter || 1, state2.currentQuarter || 1),
      // Use the most recent action time
      lastActionTime: new Date(state1.lastActionTime) > new Date(state2.lastActionTime) 
        ? state1.lastActionTime 
        : state2.lastActionTime
    }
  }

  private mergeEvents(events1: any[], events2: any[]): any[] {
    // Combine events and remove duplicates based on timestamp and type
    const allEvents = [...events1, ...events2]
    const uniqueEvents = new Map<string, any>()

    allEvents.forEach(event => {
      const key = `${event.timestamp}-${event.eventType}-${event.playerId || event.opponentJersey}`
      if (!uniqueEvents.has(key) || new Date(event.timestamp) > new Date(uniqueEvents.get(key).timestamp)) {
        uniqueEvents.set(key, event)
      }
    })

    return Array.from(uniqueEvents.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  private resolveWithUserChoice(
    availableSessions: ResumeOption[], 
    userChoice: 'local' | 'remote' | 'merged',
    conflicts: SessionConflict[]
  ): ConflictResolution {
    let chosenSession: OfflineSession
    let resolution: 'local' | 'remote' | 'merged'

    switch (userChoice) {
      case 'local':
        chosenSession = availableSessions.find(s => s.source === 'local')?.session || availableSessions[0].session
        resolution = 'local'
        break
      case 'remote':
        chosenSession = availableSessions.find(s => s.source === 'remote')?.session || availableSessions[0].session
        resolution = 'remote'
        break
      case 'merged':
        const localSession = availableSessions.find(s => s.source === 'local')?.session
        const remoteSession = availableSessions.find(s => s.source === 'remote')?.session
        
        if (localSession && remoteSession) {
          chosenSession = this.mergeSessionsSync(localSession, remoteSession)
          resolution = 'merged'
        } else {
          chosenSession = availableSessions[0].session
          resolution = availableSessions[0].source
        }
        break
      default:
        chosenSession = availableSessions[0].session
        resolution = availableSessions[0].source
    }

    return {
      chosenSession,
      resolution,
      conflictsResolved: conflicts.length
    }
  }

  private autoResolveConflicts(
    availableSessions: ResumeOption[], 
    conflicts: SessionConflict[]
  ): ConflictResolution {
    // Auto-resolve based on heuristics:
    // 1. Prefer local sessions (more recent)
    // 2. Prefer active sessions
    // 3. Prefer sessions with more events
    
    const sortedSessions = availableSessions.sort((a, b) => {
      // Priority: local > remote, active > inactive, more events > fewer events
      if (a.source === 'local' && b.source !== 'local') return -1
      if (b.source === 'local' && a.source !== 'local') return 1
      
      if (a.session.isActive && !b.session.isActive) return -1
      if (b.session.isActive && !a.session.isActive) return 1
      
      return b.eventCount - a.eventCount
    })

    return {
      chosenSession: sortedSessions[0].session,
      resolution: sortedSessions[0].source,
      conflictsResolved: conflicts.length
    }
  }

  private mergeSessionsSync(session1: OfflineSession, session2: OfflineSession): OfflineSession {
    // Synchronous version of merge for immediate use
    const mergedSession: OfflineSession = {
      ...session1,
      id: crypto.randomUUID(),
      version: Math.max(session1.version, session2.version) + 1,
      lastModified: new Date().toISOString(),
      deviceId: offlineStorage.getDeviceId()
    }

    mergedSession.gameState = this.mergeGameStates(session1.gameState, session2.gameState)
    
    return mergedSession
  }

  private showConflictModal(
    availableSessions: ResumeOption[], 
    onResolved: (resolution: ConflictResolution) => void
  ): void {
    // This would show a modal with conflict resolution options
    // For now, we'll auto-resolve
    const resolution = this.autoResolveConflicts(availableSessions, [])
    onResolved(resolution)
  }
}

// Export singleton instance
export const multiDeviceResumeService = new MultiDeviceResumeService()
export default multiDeviceResumeService



