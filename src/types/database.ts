export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone_number: string | null
          institute: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone_number?: string | null
          institute?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone_number?: string | null
          institute?: string | null
          avatar_url?: string | null
          bio?: string | null
          updated_at?: string
        }
      }
      positions: {
        Row: {
          id: number
          name: string
          abbreviation: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          abbreviation: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          abbreviation?: string
          description?: string | null
          updated_at?: string
        }
      }
      players: {
        Row: {
          id: number
          name: string
          position_id: number
          jersey: string
          phone_number: string | null
          email: string | null
          height: number | null
          weight: number | null
          avatar_url: string | null
          birth_date: string | null
          is_active: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          position_id: number
          jersey: string
          phone_number?: string | null
          email?: string | null
          height?: number | null
          weight?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          is_active?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          position_id?: number
          jersey?: string
          phone_number?: string | null
          email?: string | null
          height?: number | null
          weight?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      event_types: {
        Row: {
          id: number
          name: string
          color: string
          text_color: string
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          color?: string
          text_color?: string
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          color?: string
          text_color?: string
          icon?: string | null
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: number
          name: string
          description: string | null
          event_type_id: number
          start_time: string
          end_time: string | null
          location: 'HOME' | 'AWAY'
          venue: string
          opposition_team: string | null
          is_repeat: boolean
          occurrence: number
          is_notice: boolean
          notes: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          event_type_id: number
          start_time: string
          end_time?: string | null
          location: 'HOME' | 'AWAY'
          venue: string
          opposition_team?: string | null
          is_repeat?: boolean
          occurrence?: number
          is_notice?: boolean
          notes?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          event_type_id?: number
          start_time?: string
          end_time?: string | null
          location?: 'HOME' | 'AWAY'
          venue?: string
          opposition_team?: string | null
          is_repeat?: boolean
          occurrence?: number
          is_notice?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      task_priorities: {
        Row: {
          id: number
          name: string
          weight: number
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          weight: number
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          weight?: number
          color?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: number
          name: string
          description: string | null
          due_date: string | null
          priority_id: number
          status: 'TODO' | 'IN_PROGRESS' | 'DONE'
          event_id: number | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          due_date?: string | null
          priority_id: number
          status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
          event_id?: number | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          due_date?: string | null
          priority_id?: number
          status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
          event_id?: number | null
          updated_at?: string
        }
      }
      player_tasks: {
        Row: {
          task_id: number
          player_id: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          task_id: number
          player_id: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: number
          event_id: number
          opponent: string
          home_score: number | null
          away_score: number | null
          result: 'WIN' | 'LOSS' | 'TIE' | null
          game_date: string
          season: string
          is_playoffs: boolean
          notes: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          event_id: number
          opponent: string
          home_score?: number | null
          away_score?: number | null
          result?: 'WIN' | 'LOSS' | 'TIE' | null
          game_date: string
          season?: string
          is_playoffs?: boolean
          notes?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          opponent?: string
          home_score?: number | null
          away_score?: number | null
          result?: 'WIN' | 'LOSS' | 'TIE' | null
          game_date?: string
          season?: string
          is_playoffs?: boolean
          notes?: string | null
          updated_at?: string
        }
      }
      game_stats: {
        Row: {
          id: number
          game_id: number
          player_id: number | null
          points: number
          field_goals_made: number
          field_goals_attempted: number
          three_points_made: number
          three_points_attempted: number
          free_throws_made: number
          free_throws_attempted: number
          rebounds: number
          offensive_rebounds: number
          defensive_rebounds: number
          assists: number
          steals: number
          blocks: number
          turnovers: number
          fouls: number
          minutes_played: number
          plus_minus: number
          quarter: number | null
          period: string | null
          timestamp: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          game_id: number
          player_id?: number | null
          points?: number
          field_goals_made?: number
          field_goals_attempted?: number
          three_points_made?: number
          three_points_attempted?: number
          free_throws_made?: number
          free_throws_attempted?: number
          rebounds?: number
          offensive_rebounds?: number
          defensive_rebounds?: number
          assists?: number
          steals?: number
          blocks?: number
          turnovers?: number
          fouls?: number
          minutes_played?: number
          plus_minus?: number
          quarter?: number | null
          period?: string | null
          timestamp?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          points?: number
          field_goals_made?: number
          field_goals_attempted?: number
          three_points_made?: number
          three_points_attempted?: number
          free_throws_made?: number
          free_throws_attempted?: number
          rebounds?: number
          offensive_rebounds?: number
          defensive_rebounds?: number
          assists?: number
          steals?: number
          blocks?: number
          turnovers?: number
          fouls?: number
          minutes_played?: number
          plus_minus?: number
          quarter?: number | null
          period?: string | null
          timestamp?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}