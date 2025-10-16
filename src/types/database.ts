export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          createdAt: string
          id: number
          ipAddress: string | null
          newData: Json | null
          oldData: Json | null
          recordId: number | null
          table: string
          updated_by: string | null
          userAgent: string | null
          userid: string | null
          userId: number | null
        }
        Insert: {
          action: string
          createdAt?: string
          id?: number
          ipAddress?: string | null
          newData?: Json | null
          oldData?: Json | null
          recordId?: number | null
          table: string
          updated_by?: string | null
          userAgent?: string | null
          userid?: string | null
          userId?: number | null
        }
        Update: {
          action?: string
          createdAt?: string
          id?: number
          ipAddress?: string | null
          newData?: Json | null
          oldData?: Json | null
          recordId?: number | null
          table?: string
          updated_by?: string | null
          userAgent?: string | null
          userid?: string | null
          userId?: number | null
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          color: string
          createdAt: string
          createdBy: number
          description: string | null
          id: number
          name: string
          updatedAt: string
          updatedBy: number
        }
        Insert: {
          color?: string
          createdAt?: string
          createdBy?: number
          description?: string | null
          id?: number
          name: string
          updatedAt?: string
          updatedBy?: number
        }
        Update: {
          color?: string
          createdAt?: string
          createdBy?: number
          description?: string | null
          id?: number
          name?: string
          updatedAt?: string
          updatedBy?: number
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          autoRepeat: boolean
          categoryId: number | null
          createdAt: string
          createdBy: number
          description: string | null
          id: number
          is_pinned: boolean
          name: string
          period: string
          season: string
          updatedAt: string
          updatedBy: number
        }
        Insert: {
          amount: number
          autoRepeat?: boolean
          categoryId?: number | null
          createdAt?: string
          createdBy?: number
          description?: string | null
          id?: number
          is_pinned?: boolean
          name: string
          period: string
          season?: string
          updatedAt?: string
          updatedBy?: number
        }
        Update: {
          amount?: number
          autoRepeat?: boolean
          categoryId?: number | null
          createdAt?: string
          createdBy?: number
          description?: string | null
          id?: number
          is_pinned?: boolean
          name?: string
          period?: string
          season?: string
          updatedAt?: string
          updatedBy?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_mentions: {
        Row: {
          created_at: string | null
          end_position: number
          id: number
          mention_text: string
          mentioned_user_id: string | null
          note_id: number | null
          start_position: number
        }
        Insert: {
          created_at?: string | null
          end_position: number
          id?: number
          mention_text: string
          mentioned_user_id?: string | null
          note_id?: number | null
          start_position: number
        }
        Update: {
          created_at?: string | null
          end_position?: number
          id?: number
          mention_text?: string
          mentioned_user_id?: string | null
          note_id?: number | null
          start_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_mentions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "quick_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      event_coaches: {
        Row: {
          coachUsername: string
          eventId: number
        }
        Insert: {
          coachUsername: string
          eventId: number
        }
        Update: {
          coachUsername?: string
          eventId?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_coaches_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          color: string
          created_at: string
          createdBy: number
          icon: string | null
          id: number
          name: string
          updated_at: string
          updatedBy: number
        }
        Insert: {
          color?: string
          created_at?: string
          createdBy?: number
          icon?: string | null
          id?: number
          name: string
          updated_at?: string
          updatedBy?: number
        }
        Update: {
          color?: string
          created_at?: string
          createdBy?: number
          icon?: string | null
          id?: number
          name?: string
          updated_at?: string
          updatedBy?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          createdAt: string
          createdBy: string
          daysOfWeek: number[] | null
          description: string | null
          endTime: string | null
          eventTypeId: number
          id: number
          isNotice: boolean
          isRepeat: boolean
          location: Database["public"]["Enums"]["location"] | null
          name: string
          notes: string | null
          occurence: number
          oppositionTeam: string | null
          repeatType: string | null
          startTime: string
          updatedAt: string
          updatedBy: string
          venue: string
        }
        Insert: {
          createdAt?: string
          createdBy: string
          daysOfWeek?: number[] | null
          description?: string | null
          endTime?: string | null
          eventTypeId: number
          id?: number
          isNotice?: boolean
          isRepeat?: boolean
          location?: Database["public"]["Enums"]["location"] | null
          name: string
          notes?: string | null
          occurence?: number
          oppositionTeam?: string | null
          repeatType?: string | null
          startTime: string
          updatedAt?: string
          updatedBy: string
          venue: string
        }
        Update: {
          createdAt?: string
          createdBy?: string
          daysOfWeek?: number[] | null
          description?: string | null
          endTime?: string | null
          eventTypeId?: number
          id?: number
          isNotice?: boolean
          isRepeat?: boolean
          location?: Database["public"]["Enums"]["location"] | null
          name?: string
          notes?: string | null
          occurence?: number
          oppositionTeam?: string | null
          repeatType?: string | null
          startTime?: string
          updatedAt?: string
          updatedBy?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_eventTypeId_fkey"
            columns: ["eventTypeId"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          budgetId: number | null
          category: string
          createdAt: string
          createdBy: string
          date: string
          description: string | null
          eventId: number | null
          id: number
          merchant: string
          receiptUrl: string | null
          updatedAt: string
          updatedBy: string
        }
        Insert: {
          amount: number
          budgetId?: number | null
          category: string
          createdAt?: string
          createdBy?: string
          date: string
          description?: string | null
          eventId?: number | null
          id?: number
          merchant: string
          receiptUrl?: string | null
          updatedAt?: string
          updatedBy?: string
        }
        Update: {
          amount?: number
          budgetId?: number | null
          category?: string
          createdAt?: string
          createdBy?: string
          date?: string
          description?: string | null
          eventId?: number | null
          id?: number
          merchant?: string
          receiptUrl?: string | null
          updatedAt?: string
          updatedBy?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_budgetId_fkey"
            columns: ["budgetId"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      game_stats: {
        Row: {
          assists: number | null
          blocks: number | null
          created_at: string | null
          defensive_rebounds: number | null
          field_goals_attempted: number | null
          field_goals_made: number | null
          fouls: number | null
          free_throws_attempted: number | null
          free_throws_made: number | null
          game_id: number
          id: number
          minutes_played: number | null
          offensive_rebounds: number | null
          period: string | null
          player_id: number | null
          plus_minus: number | null
          points: number | null
          quarter: number | null
          rebounds: number | null
          steals: number | null
          three_points_attempted: number | null
          three_points_made: number | null
          turnovers: number | null
          updated_at: string | null
        }
        Insert: {
          assists?: number | null
          blocks?: number | null
          created_at?: string | null
          defensive_rebounds?: number | null
          field_goals_attempted?: number | null
          field_goals_made?: number | null
          fouls?: number | null
          free_throws_attempted?: number | null
          free_throws_made?: number | null
          game_id: number
          id?: number
          minutes_played?: number | null
          offensive_rebounds?: number | null
          period?: string | null
          player_id?: number | null
          plus_minus?: number | null
          points?: number | null
          quarter?: number | null
          rebounds?: number | null
          steals?: number | null
          three_points_attempted?: number | null
          three_points_made?: number | null
          turnovers?: number | null
          updated_at?: string | null
        }
        Update: {
          assists?: number | null
          blocks?: number | null
          created_at?: string | null
          defensive_rebounds?: number | null
          field_goals_attempted?: number | null
          field_goals_made?: number | null
          fouls?: number | null
          free_throws_attempted?: number | null
          free_throws_made?: number | null
          game_id?: number
          id?: number
          minutes_played?: number | null
          offensive_rebounds?: number | null
          period?: string | null
          player_id?: number | null
          plus_minus?: number | null
          points?: number | null
          quarter?: number | null
          rebounds?: number | null
          steals?: number | null
          three_points_attempted?: number | null
          three_points_made?: number | null
          turnovers?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          created_at: string | null
          event_id: number
          game_date: string | null
          home_score: number | null
          id: number
          is_playoffs: boolean | null
          notes: string | null
          opponent: string
          result: string | null
          season: string | null
          updated_at: string | null
        }
        Insert: {
          away_score?: number | null
          created_at?: string | null
          event_id: number
          game_date?: string | null
          home_score?: number | null
          id?: number
          is_playoffs?: boolean | null
          notes?: string | null
          opponent: string
          result?: string | null
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          away_score?: number | null
          created_at?: string | null
          event_id?: number
          game_date?: string | null
          home_score?: number | null
          id?: number
          is_playoffs?: boolean | null
          notes?: string | null
          opponent?: string
          result?: string | null
          season?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      live_game_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          event_type: string
          event_value: number | null
          game_id: number | null
          id: number
          is_opponent_event: boolean | null
          metadata: Json | null
          opponent_jersey: string | null
          player_id: number | null
          quarter: number
          session_id: number
          sync_status: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          event_type: string
          event_value?: number | null
          game_id?: number | null
          id?: number
          is_opponent_event?: boolean | null
          metadata?: Json | null
          opponent_jersey?: string | null
          player_id?: number | null
          quarter: number
          session_id: number
          sync_status?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          event_type?: string
          event_value?: number | null
          game_id?: number | null
          id?: number
          is_opponent_event?: boolean | null
          metadata?: Json | null
          opponent_jersey?: string | null
          player_id?: number | null
          quarter?: number
          session_id?: number
          sync_status?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_game_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_game_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_game_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          ended_at: string | null
          event_id: number
          game_id: number | null
          game_state: Json
          id: number
          is_active: boolean | null
          session_key: string
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          event_id: number
          game_id?: number | null
          game_state?: Json
          id?: number
          is_active?: boolean | null
          session_key: string
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          ended_at?: string | null
          event_id?: number
          game_id?: number | null
          game_state?: Json
          id?: number
          is_active?: boolean | null
          session_key?: string
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_game_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      live_game_sync_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          last_synced_at: string | null
          retry_count: number | null
          session_id: number
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          last_synced_at?: string | null
          retry_count?: number | null
          session_id: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          last_synced_at?: string | null
          retry_count?: number | null
          session_id?: number
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_game_sync_status_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mention_notifications: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          mentioned_by: string | null
          note_id: number | null
          read_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          mentioned_by?: string | null
          note_id?: number | null
          read_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          mentioned_by?: string | null
          note_id?: number | null
          read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mention_notifications_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "quick_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          createdAt: string
          data: Json | null
          id: number
          isRead: boolean
          message: string
          readAt: string | null
          title: string
          type: string
          userId: number
        }
        Insert: {
          createdAt?: string
          data?: Json | null
          id?: number
          isRead?: boolean
          message: string
          readAt?: string | null
          title: string
          type: string
          userId: number
        }
        Update: {
          createdAt?: string
          data?: Json | null
          id?: number
          isRead?: boolean
          message?: string
          readAt?: string | null
          title?: string
          type?: string
          userId?: number
        }
        Relationships: []
      }
      player_events: {
        Row: {
          createdAt: string
          createdBy: number
          eventId: number
          playerId: number
          status: string
          updatedAt: string
          updatedBy: number
        }
        Insert: {
          createdAt?: string
          createdBy?: number
          eventId: number
          playerId: number
          status?: string
          updatedAt?: string
          updatedBy?: number
        }
        Update: {
          createdAt?: string
          createdBy?: number
          eventId?: number
          playerId?: number
          status?: string
          updatedAt?: string
          updatedBy?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_events_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_events_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_goals: {
        Row: {
          achievedAt: string | null
          category: string | null
          created_at: string | null
          createdAt: string
          createdBy: number | null
          goal: string
          goal_text: string | null
          id: number
          isAchieved: boolean
          player_id: number | null
          playerId: number
          targetDate: string | null
          updatedAt: string
          updatedBy: number | null
          user_id: string | null
        }
        Insert: {
          achievedAt?: string | null
          category?: string | null
          created_at?: string | null
          createdAt?: string
          createdBy?: number | null
          goal: string
          goal_text?: string | null
          id?: number
          isAchieved?: boolean
          player_id?: number | null
          playerId: number
          targetDate?: string | null
          updatedAt?: string
          updatedBy?: number | null
          user_id?: string | null
        }
        Update: {
          achievedAt?: string | null
          category?: string | null
          created_at?: string | null
          createdAt?: string
          createdBy?: number | null
          goal?: string
          goal_text?: string | null
          id?: number
          isAchieved?: boolean
          player_id?: number | null
          playerId?: number
          targetDate?: string | null
          updatedAt?: string
          updatedBy?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_goals_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_notes: {
        Row: {
          created_at: string | null
          createdAt: string
          createdBy: number | null
          id: number
          isPublic: boolean
          note: string
          note_text: string | null
          player_id: number | null
          playerId: number
          tags: string[] | null
          updatedAt: string
          updatedBy: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          createdAt?: string
          createdBy?: number | null
          id?: number
          isPublic?: boolean
          note: string
          note_text?: string | null
          player_id?: number | null
          playerId: number
          tags?: string[] | null
          updatedAt?: string
          updatedBy?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          createdAt?: string
          createdBy?: number | null
          id?: number
          isPublic?: boolean
          note?: string
          note_text?: string | null
          player_id?: number | null
          playerId?: number
          tags?: string[] | null
          updatedAt?: string
          updatedBy?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_notes_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar: string | null
          birthDate: string | null
          created_at: string | null
          createdAt: string
          email: string | null
          first_name: string
          height: number | null
          id: number
          is_active: boolean | null
          isActive: boolean
          jersey: string
          jersey_number: string
          last_name: string
          name: string
          phoneNumber: string | null
          positionId: number
          profile_id: number
          school_year: Database["public"]["Enums"]["school_year_enum"]
          updated_at: string | null
          updatedAt: string
          updatedBy: number
          user_id: string
          weight: number | null
        }
        Insert: {
          avatar?: string | null
          birthDate?: string | null
          created_at?: string | null
          createdAt?: string
          email?: string | null
          first_name: string
          height?: number | null
          id?: number
          is_active?: boolean | null
          isActive?: boolean
          jersey: string
          jersey_number: string
          last_name: string
          name: string
          phoneNumber?: string | null
          positionId: number
          profile_id: number
          school_year: Database["public"]["Enums"]["school_year_enum"]
          updated_at?: string | null
          updatedAt?: string
          updatedBy?: number
          user_id: string
          weight?: number | null
        }
        Update: {
          avatar?: string | null
          birthDate?: string | null
          created_at?: string | null
          createdAt?: string
          email?: string | null
          first_name?: string
          height?: number | null
          id?: number
          is_active?: boolean | null
          isActive?: boolean
          jersey?: string
          jersey_number?: string
          last_name?: string
          name?: string
          phoneNumber?: string | null
          positionId?: number
          profile_id?: number
          school_year?: Database["public"]["Enums"]["school_year_enum"]
          updated_at?: string | null
          updatedAt?: string
          updatedBy?: number
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_positionId_fkey"
            columns: ["positionId"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          abbreviation: string
          createdAt: string
          createdBy: number
          description: string | null
          id: number
          name: string
          updatedAt: string
          updatedBy: number
        }
        Insert: {
          abbreviation: string
          createdAt?: string
          createdBy?: number
          description?: string | null
          id?: number
          name: string
          updatedAt?: string
          updatedBy?: number
        }
        Update: {
          abbreviation?: string
          createdAt?: string
          createdBy?: number
          description?: string | null
          id?: number
          name?: string
          updatedAt?: string
          updatedBy?: number
        }
        Relationships: []
      }
      quick_note_tags: {
        Row: {
          note_id: number
          tag_id: number
        }
        Insert: {
          note_id: number
          tag_id: number
        }
        Update: {
          note_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "quick_note_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "quick_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_note_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "coach_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_notes: {
        Row: {
          color: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: number
          is_pinned: boolean | null
          position_x: number | null
          position_y: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_pinned?: boolean | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: number
          is_pinned?: boolean | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          createdAt: string
          createdBy: number
          description: string | null
          endDate: string
          id: number
          isActive: boolean
          name: string
          startDate: string
          updatedAt: string
          updatedBy: number
        }
        Insert: {
          createdAt?: string
          createdBy?: number
          description?: string | null
          endDate: string
          id?: number
          isActive?: boolean
          name: string
          startDate: string
          updatedAt?: string
          updatedBy?: number
        }
        Update: {
          createdAt?: string
          createdBy?: number
          description?: string | null
          endDate?: string
          id?: number
          isActive?: boolean
          name?: string
          startDate?: string
          updatedAt?: string
          updatedBy?: number
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          severity: string
          success: boolean | null
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity: string
          success?: boolean | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity?: string
          success?: boolean | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          createdAt: string
          id: number
          key: string
          updatedAt: string
          userId: number
          value: string
        }
        Insert: {
          createdAt?: string
          id?: number
          key: string
          updatedAt?: string
          userId: number
          value: string
        }
        Update: {
          createdAt?: string
          id?: number
          key?: string
          updatedAt?: string
          userId?: number
          value?: string
        }
        Relationships: []
      }
      stat_metrics: {
        Row: {
          calculation_type: string
          category: string
          created_at: string | null
          description: string | null
          event_types: Json
          id: number
          is_active: boolean
          name: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          calculation_type: string
          category: string
          created_at?: string | null
          description?: string | null
          event_types?: Json
          id?: number
          is_active?: boolean
          name: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          calculation_type?: string
          category?: string
          created_at?: string | null
          description?: string | null
          event_types?: Json
          id?: number
          is_active?: boolean
          name?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      task_priorities: {
        Row: {
          color: string
          createdAt: string
          createdBy: number
          id: number
          name: string
          updatedAt: string
          updatedBy: number
          weight: number
        }
        Insert: {
          color?: string
          createdAt?: string
          createdBy?: number
          id?: number
          name: string
          updatedAt?: string
          updatedBy?: number
          weight: number
        }
        Update: {
          color?: string
          createdAt?: string
          createdBy?: number
          id?: number
          name?: string
          updatedAt?: string
          updatedBy?: number
          weight?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigneeId: string | null
          createdAt: string
          createdBy: string
          description: string | null
          dueDate: string | null
          eventId: number | null
          name: string
          priorityId: number
          status: Database["public"]["Enums"]["taskstatus"]
          updatedAt: string
          updatedBy: string
          userId: number
        }
        Insert: {
          assigneeId?: string | null
          createdAt?: string
          createdBy?: string
          description?: string | null
          dueDate?: string | null
          eventId?: number | null
          name: string
          priorityId: number
          status?: Database["public"]["Enums"]["taskstatus"]
          updatedAt?: string
          updatedBy?: string
          userId?: number
        }
        Update: {
          assigneeId?: string | null
          createdAt?: string
          createdBy?: string
          description?: string | null
          dueDate?: string | null
          eventId?: number | null
          name?: string
          priorityId?: number
          status?: Database["public"]["Enums"]["taskstatus"]
          updatedAt?: string
          updatedBy?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_priorityId_fkey"
            columns: ["priorityId"]
            isOneToOne: false
            referencedRelation: "task_priorities"
            referencedColumns: ["id"]
          },
        ]
      }
      team_goal_progress: {
        Row: {
          actual_value: number
          calculated_at: string | null
          delta: number
          game_session_id: number
          goal_id: number
          id: number
          status: string
          target_value: number
        }
        Insert: {
          actual_value: number
          calculated_at?: string | null
          delta: number
          game_session_id: number
          goal_id: number
          id?: number
          status: string
          target_value: number
        }
        Update: {
          actual_value?: number
          calculated_at?: string | null
          delta?: number
          game_session_id?: number
          goal_id?: number
          id?: number
          status?: string
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_goal_progress_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "live_game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "team_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_goals: {
        Row: {
          comparison_operator: string
          competition_filter: Json | null
          created_at: string | null
          created_by: string
          id: number
          metric_id: number
          notes: string | null
          period_type: string
          season: string
          status: string
          target_value: number
          updated_at: string | null
          visibility: string
        }
        Insert: {
          comparison_operator: string
          competition_filter?: Json | null
          created_at?: string | null
          created_by: string
          id?: number
          metric_id: number
          notes?: string | null
          period_type?: string
          season?: string
          status?: string
          target_value: number
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          comparison_operator?: string
          competition_filter?: Json | null
          created_at?: string | null
          created_by?: string
          id?: number
          metric_id?: number
          notes?: string | null
          period_type?: string
          season?: string
          status?: string
          target_value?: number
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_goals_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "stat_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity: string | null
          metadata: Json | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          metadata?: Json | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity?: string | null
          metadata?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          createdAt: string
          createdBy: number
          status: string
          taskId: number
          updatedAt: string
          updatedBy: number
          userId: number
        }
        Insert: {
          createdAt?: string
          createdBy?: number
          status?: string
          taskId: number
          updatedAt?: string
          updatedBy?: number
          userId: number
        }
        Update: {
          createdAt?: string
          createdBy?: number
          status?: string
          taskId?: number
          updatedAt?: string
          updatedBy?: number
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_taskId_fkey"
            columns: ["taskId"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["userId"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_live_events_to_game_stats: {
        Args: { session_id: number }
        Returns: undefined
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_game_events_for_analysis: {
        Args: { session_id: number }
        Returns: {
          created_at: string
          event_type: string
          event_value: number
          id: number
          is_opponent_event: boolean
          metadata: Json
          opponent_jersey: string
          player_id: number
          quarter: number
        }[]
      }
      log_security_event: {
        Args: {
          p_action?: string
          p_details?: Json
          p_error_message?: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_session_id?: string
          p_severity?: string
          p_success?: boolean
          p_user_agent?: string
          p_user_email?: string
          p_user_id?: string
          p_user_role?: string
        }
        Returns: string
      }
    }
    Enums: {
      location: "HOME" | "AWAY"
      school_year_enum: "freshman" | "sophomore" | "junior" | "senior"
      taskstatus: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      location: ["HOME", "AWAY"],
      school_year_enum: ["freshman", "sophomore", "junior", "senior"],
      taskstatus: ["TODO", "IN_PROGRESS", "DONE", "ARCHIVE"],
    },
  },
} as const