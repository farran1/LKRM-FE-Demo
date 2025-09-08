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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      events: {
        Row: {
          id: number
          name: string
          description: string | null
          eventTypeId: number
          startTime: string
          endTime: string | null
          location: 'HOME' | 'AWAY'
          venue: string
          oppositionTeam: string | null
          isRepeat: boolean
          occurence: number
          repeatType: string | null
          daysOfWeek: number[] | null
          isNotice: boolean
          notes: string | null
          createdAt: string
          createdBy: string
          updatedAt: string
          updatedBy: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          eventTypeId: number
          startTime: string
          endTime?: string | null
          location: 'HOME' | 'AWAY'
          venue: string
          oppositionTeam?: string | null
          isRepeat?: boolean
          occurence?: number
          repeatType?: string | null
          daysOfWeek?: number[] | null
          isNotice?: boolean
          notes?: string | null
          createdAt?: string
          createdBy: string
          updatedAt?: string
          updatedBy: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          eventTypeId?: number
          startTime?: string
          endTime?: string | null
          location?: 'HOME' | 'AWAY'
          venue?: string
          oppositionTeam?: string | null
          isRepeat?: boolean
          occurence?: number
          repeatType?: string | null
          daysOfWeek?: number[] | null
          isNotice?: boolean
          notes?: string | null
          createdAt?: string
          createdBy?: number
          updatedAt?: string
          updatedBy?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_createdBy_fkey"
            columns: ["createdBy"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_eventTypeId_fkey"
            columns: ["eventTypeId"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          userId: number
          name: string
          description: string | null
          dueDate: string | null
          priorityId: number
          eventId: number | null
          status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVE'
          assigneeId: string | null
          createdAt: string
          createdBy: string
          updatedAt: string
          updatedBy: string
        }
        Insert: {
          userId?: number
          name: string
          description?: string | null
          dueDate?: string | null
          priorityId: number
          eventId?: number | null
          status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVE'
          assigneeId?: string | null
          createdAt?: string
          createdBy?: string
          updatedAt?: string
          updatedBy?: string
        }
        Update: {
          userId?: number
          name?: string
          description?: string | null
          dueDate?: string | null
          priorityId?: number
          eventId?: number | null
          status?: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVE'
          assigneeId?: string | null
          createdAt?: string
          createdBy?: string
          updatedAt?: string
          updatedBy?: string
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
      users: {
        Row: {
          id: number
          username: string
          email: string
          password: string
          role: 'COACH' | 'ADMIN' | 'TRAINEE' | 'PLAYER'
          isActive: boolean
          profileId: number | null
          createdAt: string
          createdBy: string
          updatedAt: string
          updatedBy: string
        }
        Insert: {
          id?: number
          username: string
          email: string
          password: string
          role?: 'COACH' | 'ADMIN' | 'TRAINEE' | 'PLAYER'
          isActive?: boolean
          profileId?: number | null
          createdAt?: string
          createdBy?: number
          updatedAt?: string
          updatedBy?: number
        }
        Update: {
          id?: number
          username?: string
          email?: string
          password?: string
          role?: 'COACH' | 'ADMIN' | 'TRAINEE' | 'PLAYER'
          isActive?: boolean
          profileId?: number | null
          createdAt?: string
          createdBy?: number
          updatedAt?: string
          updatedBy?: number
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      Location: "HOME" | "AWAY"
      Role: "COACH" | "ADMIN" | "TRAINEE" | "PLAYER"
      TaskStatus: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVE"
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
      Location: ["HOME", "AWAY"],
      Role: ["COACH", "ADMIN", "TRAINEE", "PLAYER"],
      TaskStatus: ["TODO", "IN_PROGRESS", "DONE", "ARCHIVE"],
    },
  },
} as const