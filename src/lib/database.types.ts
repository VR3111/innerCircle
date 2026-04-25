export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                   string        // uuid
          username:             string
          avatar_url:           string | null
          rank:                 number
          following_count:      number        // legacy always-zero column, do not use
          circles_count:        number
          created_at:           string        // timestamp
          // Added migration 012:
          display_name:          string | null
          bio:                   string | null
          is_inner_circle:       boolean
          signal_score:          number
          posts_count:           number
          followers_count:       number
          user_following_count:  number
          // Future — added in Step 6 (Leaderboard / Creators Club):
          creators_club_category: string | null
        }
        Insert: {
          id:                    string
          username:              string
          avatar_url?:           string | null
          rank?:                 number
          following_count?:      number
          circles_count?:        number
          created_at?:           string
          display_name?:           string | null
          bio?:                    string | null
          is_inner_circle?:        boolean
          signal_score?:           number
          posts_count?:            number
          followers_count?:        number
          user_following_count?:   number
          creators_club_category?: string | null
        }
        Update: {
          id?:                     string
          username?:               string
          avatar_url?:             string | null
          rank?:                   number
          following_count?:        number
          circles_count?:          number
          created_at?:             string
          display_name?:           string | null
          bio?:                    string | null
          is_inner_circle?:        boolean
          signal_score?:           number
          posts_count?:            number
          followers_count?:        number
          user_following_count?:   number
          creators_club_category?: string | null
        }
        Relationships: []
      }

      agents: {
        Row: {
          id:          string               // text (e.g. "baron", "blitz")
          name:        string
          category:    string
          color:       string
          tagline:     string
          followers:   number
          posts_count: number
          rank:        number
          is_official: boolean
        }
        Insert: {
          id:           string
          name:         string
          category:     string
          color:        string
          tagline:      string
          followers?:   number
          posts_count?: number
          rank?:        number
          is_official?: boolean
        }
        Update: {
          id?:          string
          name?:        string
          category?:    string
          color?:       string
          tagline?:     string
          followers?:   number
          posts_count?: number
          rank?:        number
          is_official?: boolean
        }
        Relationships: []
      }

      posts: {
        Row: {
          id:         string               // uuid
          agent_id:   string               // → agents.id (category tag)
          headline:   string
          body:       string
          image_url:  string | null
          likes:      number
          comments:   number
          shares:     number
          created_at: string
          // Added migration 012:
          user_id:    string | null        // NULL = agent post; NOT NULL = user post
        }
        Insert: {
          id?:        string
          agent_id:   string
          headline:   string
          body:       string
          image_url?: string | null
          likes?:     number
          comments?:  number
          shares?:    number
          created_at?: string
          user_id?:   string | null
        }
        Update: {
          id?:        string
          agent_id?:  string
          headline?:  string
          body?:      string
          image_url?: string | null
          likes?:     number
          comments?:  number
          shares?:    number
          created_at?: string
          user_id?:   string | null
        }
        Relationships: [
          {
            foreignKeyName: 'posts_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'posts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      follows: {
        Row: {
          id:         string               // uuid
          user_id:    string               // → profiles.id
          agent_id:   string               // → agents.id
          created_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          agent_id:   string
          created_at?: string
        }
        Update: {
          id?:        string
          user_id?:   string
          agent_id?:  string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'follows_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'follows_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          }
        ]
      }

      // Added migration 012: user→user follow graph.
      // Separate from follows (user→agent).
      user_follows: {
        Row: {
          id:          string               // uuid
          follower_id: string               // → profiles.id
          followed_id: string               // → profiles.id
          created_at:  string
        }
        Insert: {
          id?:         string
          follower_id: string
          followed_id: string
          created_at?: string
        }
        Update: {
          id?:          string
          follower_id?: string
          followed_id?: string
          created_at?:  string
        }
        Relationships: [
          {
            foreignKeyName: 'user_follows_follower_id_fkey'
            columns: ['follower_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_follows_followed_id_fkey'
            columns: ['followed_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      inner_circle: {
        Row: {
          id:         string               // uuid
          user_id:    string               // → profiles.id
          agent_id:   string               // → agents.id
          created_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          agent_id:   string
          created_at?: string
        }
        Update: {
          id?:        string
          user_id?:   string
          agent_id?:  string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inner_circle_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inner_circle_agent_id_fkey'
            columns: ['agent_id']
            isOneToOne: false
            referencedRelation: 'agents'
            referencedColumns: ['id']
          }
        ]
      }

      replies: {
        Row: {
          id:              string               // uuid
          post_id:         string               // → posts.id
          user_id:         string               // → profiles.id
          content:         string
          is_inner_circle: boolean
          is_agent_reply:  boolean
          is_pinned:       boolean              // added migration 009
          parent_reply_id: string | null        // added migration 009
          created_at:      string
        }
        Insert: {
          id?:              string
          post_id:          string
          user_id:          string
          content:          string
          is_inner_circle?: boolean
          is_agent_reply?:  boolean
          is_pinned?:       boolean
          parent_reply_id?: string | null
          created_at?:      string
        }
        Update: {
          id?:              string
          post_id?:         string
          user_id?:         string
          content?:         string
          is_inner_circle?: boolean
          is_agent_reply?:  boolean
          is_pinned?:       boolean
          parent_reply_id?: string | null
          created_at?:      string
        }
        Relationships: [
          {
            foreignKeyName: 'replies_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'replies_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      post_likes: {
        Row: {
          id:         string               // uuid
          post_id:    string               // → posts.id
          user_id:    string               // → profiles.id
          created_at: string
        }
        Insert: {
          id?:        string
          post_id:    string
          user_id:    string
          created_at?: string
        }
        Update: {
          id?:        string
          post_id?:   string
          user_id?:   string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey'
            columns: ['post_id']
            isOneToOne: false
            referencedRelation: 'posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'post_likes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      daily_spend: {
        Row: {
          date:                 string   // DATE stored as 'YYYY-MM-DD'
          agent_reply_count:    number
          estimated_cost_cents: number
          updated_at:           string
        }
        Insert: {
          date:                  string
          agent_reply_count?:    number
          estimated_cost_cents?: number
          updated_at?:           string
        }
        Update: {
          date?:                 string
          agent_reply_count?:    number
          estimated_cost_cents?: number
          updated_at?:           string
        }
        Relationships: []
      }

      notifications: {
        Row: {
          id:         string               // uuid
          user_id:    string               // → profiles.id
          type:       string
          title:      string
          body:       string
          is_read:    boolean
          created_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          type:       string
          title:      string
          body:       string
          is_read?:   boolean
          created_at?: string
        }
        Update: {
          id?:        string
          user_id?:   string
          type?:      string
          title?:     string
          body?:      string
          is_read?:   boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_by_username: {
        Args: { p_username: string }
        Returns: string
      }
      adjust_agent_followers: {
        Args: { p_agent_id: string; p_delta: number }
        Returns: undefined
      }
      increment_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      decrement_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_daily_spend: {
        Args: { p_date: string; p_cents: number }
        Returns: undefined
      }
      // Added migration 012:
      recompute_signal_score: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      adjust_user_followers: {
        Args: { p_followed_id: string; p_delta: number }
        Returns: undefined
      }
      adjust_user_following: {
        Args: { p_follower_id: string; p_delta: number }
        Returns: undefined
      }
      adjust_user_posts_count: {
        Args: { p_user_id: string; p_delta: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
