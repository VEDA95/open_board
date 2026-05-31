export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      board_permissions: {
        Row: {
          board: string
          permission: string
        }
        Insert: {
          board: string
          permission: string
        }
        Update: {
          board?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_permissions_board_fkey"
            columns: ["board"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_permissions_permission_fkey"
            columns: ["permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          name: string
          updated_at: string | null
          user_id: string | null
          workspace: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string | null
          user_id?: string | null
          workspace: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string | null
          user_id?: string | null
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_workspace_fkey"
            columns: ["workspace"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      card_activities: {
        Row: {
          activity: string
          card: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          activity: string
          card: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          activity?: string
          card?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_activities_card_fkey"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_attachments: {
        Row: {
          card: string
          file: string
        }
        Insert: {
          card: string
          file: string
        }
        Update: {
          card?: string
          file?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_attachments_card_fkey"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          actual_time_spent: number | null
          actual_time_unit: string | null
          assignee: string | null
          color: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_time_spent: number | null
          estimated_time_unit: string | null
          id: string
          is_active: boolean
          list: string
          name: string
          position: number | null
          reminder_date: string | null
          updated: string | null
        }
        Insert: {
          actual_time_spent?: number | null
          actual_time_unit?: string | null
          assignee?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_time_spent?: number | null
          estimated_time_unit?: string | null
          id?: string
          is_active?: boolean
          list: string
          name: string
          position?: number | null
          reminder_date?: string | null
          updated?: string | null
        }
        Update: {
          actual_time_spent?: number | null
          actual_time_unit?: string | null
          assignee?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_time_spent?: number | null
          estimated_time_unit?: string | null
          id?: string
          is_active?: boolean
          list?: string
          name?: string
          position?: number | null
          reminder_date?: string | null
          updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_list_fkey"
            columns: ["list"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      check_list_items: {
        Row: {
          card: string | null
          created_at: string
          id: string
          is_checked: boolean
          name: string
          position: number | null
          updated_at: string | null
        }
        Insert: {
          card?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean
          name: string
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          card?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean
          name?: string
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_list_items_card_fkey"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_attachments: {
        Row: {
          comment: string
          file: string
        }
        Insert: {
          comment: string
          file: string
        }
        Update: {
          comment?: string
          file?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_attachments_comment_fkey"
            columns: ["comment"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          card: string
          comment: string
          created_at: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card: string
          comment: string
          created_at?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card?: string
          comment?: string
          created_at?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_card_fkey"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      general_settings: {
        Row: {
          announcement_message: string | null
          announcement_type: string
          app_description: string | null
          app_name: string
          id: number
          show_announcement_banner: boolean
          updated_at: string
        }
        Insert: {
          announcement_message?: string | null
          announcement_type?: string
          app_description?: string | null
          app_name?: string
          id?: number
          show_announcement_banner?: boolean
          updated_at?: string
        }
        Update: {
          announcement_message?: string | null
          announcement_type?: string
          app_description?: string | null
          app_name?: string
          id?: number
          show_announcement_banner?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      labels: {
        Row: {
          board: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          board?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          board?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "labels_board_fkey"
            columns: ["board"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          board: string
          color: string | null
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string | null
        }
        Insert: {
          board: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          position: number
          updated_at?: string | null
        }
        Update: {
          board?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_board_fkey"
            columns: ["board"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          id: string
          path: string
        }
        Insert: {
          id?: string
          path: string
        }
        Update: {
          id?: string
          path?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          first_name: string | null
          id: string
          last_name: string | null
          thumbnail: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          first_name?: string | null
          id?: string
          last_name?: string | null
          thumbnail?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          first_name?: string | null
          id?: string
          last_name?: string | null
          thumbnail?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission: string
          role: string
        }
        Insert: {
          permission: string
          role: string
        }
        Update: {
          permission?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_fkey"
            columns: ["permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_permissions: {
        Row: {
          permission: string
          workspace: string
        }
        Insert: {
          permission: string
          workspace: string
        }
        Update: {
          permission?: string
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_permissions_permission_fkey"
            columns: ["permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_permissions_workspace_fkey"
            columns: ["workspace"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_board_permissions:
        | { Args: never; Returns: boolean }
        | { Args: { board_id: string }; Returns: boolean }
      check_card_access: { Args: { card_id: string }; Returns: boolean }
      check_permissions: {
        Args: { required_permissions: string[] }
        Returns: boolean
      }
      check_workspace_permissions:
        | { Args: never; Returns: boolean }
        | { Args: { workspace_id: string }; Returns: boolean }
      get_user_permission_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

