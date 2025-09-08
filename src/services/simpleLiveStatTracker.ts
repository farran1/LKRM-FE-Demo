/**
 * Simple Live Stat Tracker Service
 * Direct, real-time tracking without offline complexity
 * Focus on getting aggregates working properly first
 */

import { createClient } from '@supabase/supabase-js'

export interface SimpleGameSession {
  id: number
  event_id: number
  game_id?: number
  session_key: string
  is_active: boolean
  started_at: string
  created_by: number
}

export interface SimpleGameEvent {
  id: number
  session_id: number
  player_id: number
  event_type: string
  event_value?: number
  quarter: number
  game_time: number
  is_opponent_event: boolean
  opponent_jersey?: string
  created_at: string
}

export interface SimplePlayer {
  id: number
  name: string
  number: string
  position: string
}

class SimpleLiveStatTrackerService {
  private supabase: any = null
  private currentSessionId: number | null = null
  private currentEventId: number | null = null
  private currentGameId: number | null = null

  constructor() {
    // Initialize Supabase client
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      this.supabase = createClient(supabaseUrl, supabaseKey)
    }
  }

  // Set Supabase client (for server-side usage)
  setSupabaseClient(client: any) {
    this.supabase = client
  }

  // Start a new game session
  async startGameSession(eventId: number, gameId?: number): Promise<SimpleGameSession> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized')
    }

    // Generate unique session key
    const sessionKey = `simple-game-${eventId}-${Date.now()}`

    // Create new session
    const { data: session, error } = await this.supabase
      .from('live_game_sessions')
      .insert({
        event_id: eventId,
        game_id: gameId,
        session_key: sessionKey,
        is_active: true,
        started_at: new Date().toISOString(),
        created_by: 1 // TODO: Get actual user ID
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create game session: ${error.message}`)
    }

    this.currentSessionId = session.id
    this.currentEventId = eventId
    this.currentGameId = gameId ?? null

    console.log(`🎮 Started game session: ${session.id} for event: ${eventId}`)
    return session
  }

  // Record a stat event directly to database
  async recordEvent(
    playerId: number,
    eventType: string,
    eventValue?: number,
    quarter: number = 1,
    gameTime: number = 0,
    isOpponentEvent: boolean = false,
    opponentJersey?: string
  ): Promise<SimpleGameEvent> {
    if (!this.supabase || !this.currentSessionId) {
      throw new Error('No active game session')
    }

    // Insert event directly to database
    const { data: event, error } = await this.supabase
      .from('live_game_events')
      .insert({
        session_id: this.currentSessionId,
        player_id: playerId,
        event_type: eventType,
        event_value: eventValue,
        quarter,
        game_time: gameTime,
        is_opponent_event: isOpponentEvent,
        opponent_jersey: opponentJersey,
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

  // Get current session stats
  async getSessionStats(): Promise<any> {
    if (!this.supabase || !this.currentSessionId) {
      return null
    }

    const { data: events, error } = await this.supabase
      .from('live_game_events')
      .select('*')
      .eq('session_id', this.currentSessionId)

    if (error) {
      console.error('Failed to get session stats:', error)
      return null
    }

    return events
  }

  // End current game session
  async endGameSession(): Promise<void> {
    if (!this.supabase || !this.currentSessionId) {
      return
    }

    await this.supabase
      .from('live_game_sessions')
      .update({ is_active: false })
      .eq('id', this.currentSessionId)

    console.log(`🏁 Ended game session: ${this.currentSessionId}`)
    
    this.currentSessionId = null
    this.currentEventId = null
    this.currentGameId = null
  }

  // Get active session info
  getCurrentSession(): { sessionId: number | null; eventId: number | null; gameId: number | null } {
    return {
      sessionId: this.currentSessionId,
      eventId: this.currentEventId,
      gameId: this.currentGameId
    }
  }

  // Check if session is active
  isSessionActive(): boolean {
    return this.currentSessionId !== null
  }
}

// Export singleton instance
export const simpleLiveStatTracker = new SimpleLiveStatTrackerService()
export default simpleLiveStatTracker
