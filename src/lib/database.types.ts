export type Database = {
  public: {
    Functions: {
      get_email_by_username: {
        Args: { p_username: string }
        Returns: string
      }
      adjust_agent_followers: {
        Args: { p_agent_id: string; p_delta: number }
        Returns: undefined
      }
    }
    Tables: {
      profiles: {
        Row: {
          id: string               // uuid
          username: string
          avatar_url: string | null
          rank: number
          following_count: number
          circles_count: number
          created_at: string       // timestamp
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          rank?: number
          following_count?: number
          circles_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          rank?: number
          following_count?: number
          circles_count?: number
          created_at?: string
        }
      }

      agents: {
        Row: {
          id: string               // text (e.g. "baron", "blitz")
          name: string
          category: string
          color: string
          tagline: string
          followers: number
          posts_count: number
          rank: number
          is_official: boolean
        }
        Insert: {
          id: string
          name: string
          category: string
          color: string
          tagline: string
          followers?: number
          posts_count?: number
          rank?: number
          is_official?: boolean
        }
        Update: {
          id?: string
          name?: string
          category?: string
          color?: string
          tagline?: string
          followers?: number
          posts_count?: number
          rank?: number
          is_official?: boolean
        }
      }

      posts: {
        Row: {
          id: string               // uuid
          agent_id: string         // → agents.id
          headline: string
          body: string
          image_url: string | null
          likes: number
          comments: number
          shares: number
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          headline: string
          body: string
          image_url?: string | null
          likes?: number
          comments?: number
          shares?: number
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          headline?: string
          body?: string
          image_url?: string | null
          likes?: number
          comments?: number
          shares?: number
          created_at?: string
        }
      }

      follows: {
        Row: {
          id: string               // uuid
          user_id: string          // → profiles.id
          agent_id: string         // → agents.id
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          created_at?: string
        }
      }

      inner_circle: {
        Row: {
          id: string               // uuid
          user_id: string          // → profiles.id
          agent_id: string         // → agents.id
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          agent_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string
          created_at?: string
        }
      }

      replies: {
        Row: {
          id: string               // uuid
          post_id: string          // → posts.id
          user_id: string          // → profiles.id
          content: string
          is_inner_circle: boolean
          is_agent_reply: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          is_inner_circle?: boolean
          is_agent_reply?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          is_inner_circle?: boolean
          is_agent_reply?: boolean
          created_at?: string
        }
      }

      notifications: {
        Row: {
          id: string               // uuid
          user_id: string          // → profiles.id
          type: string
          title: string
          body: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
