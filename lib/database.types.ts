/**
 * Database types for the `public` schema.
 *
 * Hand-written to match supabase/migrations/, in the same shape the CLI emits so
 * it can be replaced wholesale:
 *
 *     yarn types:generate      # supabase gen types typescript --local
 *
 * Regenerate rather than edit after any migration. The `Relationships` blocks
 * are not decoration — postgrest-js reads them to decide whether an embedded
 * resource like `home_member.select("home(...)")` is an object or an array.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type HomeRow = {
  id: string;
  code: string;
  name: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

type TaskRow = {
  id: string;
  homeId: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  createdByUserId: string;
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  public: {
    Tables: {
      user: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          image: string | null;
        };
        // Rows are created by the handle_new_auth_user trigger; INSERT is
        // revoked from `authenticated`.
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          image?: string | null;
        };
        Update: {
          name?: string | null;
          email?: string | null;
          image?: string | null;
        };
        Relationships: [];
      };

      home: {
        Row: HomeRow;
        // `code` and `createdByUserId` come from column defaults, and INSERT is
        // revoked anyway — create_home() is the only writer.
        Insert: {
          id?: string;
          code?: string;
          name: string;
          createdByUserId?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          name?: string;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "home_createdByUserId_user_id_fk";
            columns: ["createdByUserId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };

      home_member: {
        Row: {
          homeId: string;
          userId: string;
          role: string;
          joinedAt: string;
        };
        // INSERT/UPDATE revoked; join_home() and create_home() are the writers.
        Insert: {
          homeId: string;
          userId?: string;
          role?: string;
          joinedAt?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "home_member_homeId_home_id_fk";
            columns: ["homeId"];
            isOneToOne: false;
            referencedRelation: "home";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "home_member_userId_user_id_fk";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };

      task: {
        Row: TaskRow;
        Insert: {
          id?: string;
          homeId: string;
          title: string;
          description?: string | null;
          status?: string;
          position?: number;
          createdByUserId?: string;
          assignedToUserId?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        // id, homeId, createdByUserId and createdAt are rejected by the
        // task_guard_immutable trigger.
        Update: {
          title?: string;
          description?: string | null;
          status?: string;
          position?: number;
          assignedToUserId?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_homeId_home_id_fk";
            columns: ["homeId"];
            isOneToOne: false;
            referencedRelation: "home";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_createdByUserId_user_id_fk";
            columns: ["createdByUserId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_assignedToUserId_user_id_fk";
            columns: ["assignedToUserId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_assignee_home_member_fk";
            columns: ["homeId", "assignedToUserId"];
            isOneToOne: false;
            referencedRelation: "home_member";
            referencedColumns: ["homeId", "userId"];
          },
        ];
      };

      chat_conversation: {
        Row: {
          id: string;
          homeId: string;
          title: string;
          systemPrompt: string | null;
          aiSource: string | null;
          aiModel: string | null;
          aiUrl: string | null;
          aiAccountId: string | null;
          aiApiKey: string | null;
          createdByUserId: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          homeId: string;
          title?: string;
          systemPrompt?: string | null;
          aiSource?: string | null;
          aiModel?: string | null;
          aiUrl?: string | null;
          aiAccountId?: string | null;
          aiApiKey?: string | null;
          createdByUserId?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          title?: string;
          systemPrompt?: string | null;
          aiSource?: string | null;
          aiModel?: string | null;
          aiUrl?: string | null;
          aiAccountId?: string | null;
          aiApiKey?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversation_homeId_home_id_fk";
            columns: ["homeId"];
            isOneToOne: false;
            referencedRelation: "home";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversation_createdByUserId_user_id_fk";
            columns: ["createdByUserId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };

      chat_message: {
        Row: {
          id: string;
          conversationId: string;
          homeId: string;
          role: string;
          content: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          conversationId: string;
          homeId: string;
          role: string;
          content: string;
          createdAt?: string;
        };
        Update: {
          role?: string;
          content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_message_conversation_home_fk";
            columns: ["conversationId", "homeId"];
            isOneToOne: false;
            referencedRelation: "chat_conversation";
            referencedColumns: ["id", "homeId"];
          },
        ];
      };

      user_ai_key: {
        Row: {
          id: string;
          userId: string;
          source: string;
          url: string | null;
          model: string | null;
          accountId: string | null;
          apiKey: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId?: string;
          source: string;
          url?: string | null;
          model?: string | null;
          accountId?: string | null;
          apiKey?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          source?: string;
          url?: string | null;
          model?: string | null;
          accountId?: string | null;
          apiKey?: string | null;
          updatedAt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_ai_key_userId_user_id_fk";
            columns: ["userId"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: { [_ in never]: never };

    Functions: {
      // RETURNS public.home / public.task, not SETOF, so PostgREST answers with
      // a single object rather than an array.
      create_home: {
        Args: { p_name: string };
        Returns: HomeRow;
      };
      join_home: {
        Args: { p_code: string };
        Returns: HomeRow;
      };
      create_task: {
        Args: {
          p_home_id: string;
          p_title: string;
          p_status?: string;
          p_description?: string | null;
        };
        Returns: TaskRow;
      };
      is_home_member: {
        Args: { p_home_id: string };
        Returns: boolean;
      };
      is_home_owner: {
        Args: { p_home_id: string };
        Returns: boolean;
      };
      home_created_by_current_user: {
        Args: { p_home_id: string };
        Returns: boolean;
      };
      user_created_home_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      user_joined_home_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      shares_home_with: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };

    Enums: { [_ in never]: never };

    CompositeTypes: { [_ in never]: never };
  };
};
