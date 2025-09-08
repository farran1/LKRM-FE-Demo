// Example: How to integrate the Supabase Live Stat Tracker Service
// with your existing live stat tracker component

import { liveStatTrackerService } from '@/services/liveStatTrackerService'
import type { OfflineGameData } from '@/services/liveStatTrackerService'

// Example integration with your existing Statistics component
export class LiveStatTrackerIntegration {
  private currentSessionKey: string | null = null
  private realtimeChannel: any = null

  // Initialize a new game session
  async startNewGame(eventId: number, initialGameState: any) {
    try {
      // Create a new session in Supabase (or offline if no connection)
      const session = await liveStatTrackerService.createGameSession(
        eventId,
        initialGameState
      )

      this.currentSessionKey = session.session_key

      // Subscribe to real-time updates for this session
      this.realtimeChannel = liveStatTrackerService.subscribeToSession(
        session.session_key,
        this.handleRealtimeUpdate.bind(this)
      )

      console.log('Game session started:', session.session_key)
      return session

    } catch (error) {
      console.error('Failed to start game session:', error)
      throw error
    }
  }

  // Record a stat event (points, rebounds, etc.)
  async recordStatEvent(
    playerId: number,
    eventType: string,
    eventValue: number,
    quarter: number,
    gameTime: number,
    metadata: any = {}
  ) {
    if (!this.currentSessionKey) {
      throw new Error('No active game session')
    }

    try {
      const event = await liveStatTrackerService.recordGameEvent(
        this.currentSessionKey,
        {
          player_id: playerId,
          event_type: eventType,
          event_value: eventValue,
          quarter,
          game_time: gameTime,
          is_opponent_event: false,
          metadata
        }
      )

      console.log('Stat event recorded:', event)
      return event

    } catch (error) {
      console.error('Failed to record stat event:', error)
      throw error
    }
  }

  // Record opponent stat event
  async recordOpponentStatEvent(
    opponentJersey: string,
    eventType: string,
    eventValue: number,
    quarter: number,
    gameTime: number,
    metadata: any = {}
  ) {
    if (!this.currentSessionKey) {
      throw new Error('No active game session')
    }

    try {
      const event = await liveStatTrackerService.recordGameEvent(
        this.currentSessionKey,
        {
          player_id: undefined,
          event_type: eventType,
          event_value: eventValue,
          quarter,
          game_time: gameTime,
          is_opponent_event: true,
          opponent_jersey: opponentJersey,
          metadata
        }
      )

      console.log('Opponent stat event recorded:', event)
      return event

    } catch (error) {
      console.error('Failed to record opponent stat event:', error)
      throw error
    }
  }

  // Update the current game state
  async updateGameState(gameState: any) {
    if (!this.currentSessionKey) {
      throw new Error('No active game session')
    }

    try {
      await liveStatTrackerService.updateGameState(this.currentSessionKey, gameState)
      console.log('Game state updated')
    } catch (error) {
      console.error('Failed to update game state:', error)
      throw error
    }
  }

  // Record a substitution
  async recordSubstitution(
    playerInId: number,
    playerOutId: number,
    quarter: number,
    gameTime: number,
    lineupId?: number
  ) {
    if (!this.currentSessionKey) {
      throw new Error('No active game session')
    }

    try {
      // This would typically go through the API endpoint
      const response = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-substitution',
          data: {
            sessionKey: this.currentSessionKey,
            playerInId,
            playerOutId,
            quarter,
            gameTime,
            lineupId
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to record substitution')
      }

      console.log('Substitution recorded')
    } catch (error) {
      console.error('Failed to record substitution:', error)
      throw error
    }
  }

  // Record a timeout
  async recordTimeout(
    team: 'home' | 'away',
    quarter: number,
    gameTime: number,
    duration: number = 60
  ) {
    if (!this.currentSessionKey) {
      throw new Error('No active game session')
    }

    try {
      const response = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-timeout',
          data: {
            sessionKey: this.currentSessionKey,
            team,
            quarter,
            gameTime,
            duration
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to record timeout')
      }

      console.log('Timeout recorded')
    } catch (error) {
      console.error('Failed to record timeout:', error)
      throw error
    }
  }

  // End the current game session
  async endGame() {
    if (!this.currentSessionKey) {
      throw new Error('No active game session')
    }

    try {
      // End the session in Supabase
      const response = await fetch('/api/live-stat-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end-session',
          data: {
            sessionKey: this.currentSessionKey
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to end game session')
      }

      // Unsubscribe from real-time updates
      if (this.realtimeChannel) {
        liveStatTrackerService.unsubscribeFromSession(this.currentSessionKey!)
        this.realtimeChannel = null
      }

      console.log('Game session ended:', this.currentSessionKey)
      this.currentSessionKey = null

    } catch (error) {
      console.error('Failed to end game session:', error)
      throw error
    }
  }

  // Handle real-time updates from other devices
  private handleRealtimeUpdate(data: any) {
    console.log('Real-time update received:', data)
    
    // Update your UI based on the received data
    // This could be:
    // - New stat events
    // - Lineup changes
    // - Game state updates
    // - Timeout calls
    
    // Example: Update the game state if it's a game state update
    if (data.table === 'live_game_sessions' && data.eventType === 'UPDATE') {
      // Update your local game state
      this.updateLocalGameState(data.new.game_state)
    }
    
    // Example: Add new events to your play-by-play
    if (data.table === 'live_game_events' && data.eventType === 'INSERT') {
      // Add the new event to your events array
      this.addEventToPlayByPlay(data.new)
    }
  }

  // Update local game state (implement based on your UI)
  private updateLocalGameState(gameState: any) {
    // This would update your React state
    // setGameState(gameState)
    console.log('Local game state updated:', gameState)
  }

  // Add event to play-by-play (implement based on your UI)
  private addEventToPlayByPlay(event: any) {
    // This would add to your events array
    // setEvents(prev => [...prev, event])
    console.log('Event added to play-by-play:', event)
  }

  // Get offline data for the current session
  getCurrentSessionOfflineData(): OfflineGameData | undefined {
    if (!this.currentSessionKey) return undefined
    return liveStatTrackerService.getOfflineSession(this.currentSessionKey)
  }

  // Get all offline sessions
  getAllOfflineSessions(): OfflineGameData[] {
    return liveStatTrackerService.getOfflineSessions()
  }

  // Export offline data
  exportOfflineData(): string {
    return liveStatTrackerService.exportOfflineData()
  }

  // Import offline data
  importOfflineData(data: string): void {
    liveStatTrackerService.importOfflineData(data)
  }

  // Get storage usage
  getStorageUsage() {
    return liveStatTrackerService.getStorageUsage()
  }

  // Clear all offline data
  clearAllOfflineData(): void {
    liveStatTrackerService.clearAllOfflineData()
  }
}

// Usage example in your React component:
/*
import { useEffect, useState } from 'react'
import { LiveStatTrackerIntegration } from '@/examples/liveStatTrackerIntegration'

export function Statistics({ eventId, onExit }) {
  const [integration] = useState(() => new LiveStatTrackerIntegration())
  const [gameStarted, setGameStarted] = useState(false)

  // Start a new game
  const handleStartGame = async () => {
    try {
      const initialGameState = {
        currentQuarter: 1,
        timeRemaining: 600,
        homeScore: 0,
        awayScore: 0,
        isPlaying: false
      }

      await integration.startNewGame(eventId, initialGameState)
      setGameStarted(true)
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  // Record a point
  const handleRecordPoint = async (playerId: number, points: number) => {
    try {
      await integration.recordStatEvent(
        playerId,
        'points',
        points,
        1, // quarter
        120, // game time in seconds
        { shot_type: 'field_goal' }
      )
    } catch (error) {
      console.error('Failed to record point:', error)
    }
  }

  // End the game
  const handleEndGame = async () => {
    try {
      await integration.endGame()
      setGameStarted(false)
      onExit()
    } catch (error) {
      console.error('Failed to end game:', error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameStarted) {
        integration.endGame().catch(console.error)
      }
    }
  }, [gameStarted, integration])

  return (
    <div>
      {!gameStarted ? (
        <button onClick={handleStartGame}>Start Game</button>
      ) : (
        <div>
          <button onClick={() => handleRecordPoint(1, 2)}>Record 2 Points</button>
          <button onClick={handleEndGame}>End Game</button>
        </div>
      )}
    </div>
  )
}
*/
