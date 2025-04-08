export type Message = {
  id: string
  created_at: string
  user_id: string
  content: string
  role: 'user' | 'assistant'
  conversation_id: string
}

export type Profile = {
  id: string
  created_at: string
  email: string
  name?: string
}

export type Task = {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  priority: 'low' | 'medium' | 'high'
  tags?: string[]
  metadata?: Record<string, any>
}

export type Contact = {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  first_name: string
  last_name: string
  nickname?: string
  email?: string
  phone?: string
  birthday?: string
  occupation?: string
  company?: string
  location?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  relationship_status?: 'friend' | 'family' | 'colleague' | 'acquaintance' | 'other'
  met_at?: string
  met_through?: string
  bio?: string
  interests?: string[]
  tags?: string[]
  notes?: string
  metadata?: Record<string, any>
}

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
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date: string | null
          priority: 'low' | 'medium' | 'high'
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          tags?: string[] | null
        }
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          company: string | null
          location: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          location?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          location?: string | null
          tags?: string[] | null
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string | null
          type: 'general' | 'contact' | 'task' | 'project'
          status: 'active' | 'archived'
          priority: 'low' | 'medium' | 'high'
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content?: string | null
          type?: 'general' | 'contact' | 'task' | 'project'
          status?: 'active' | 'archived'
          priority?: 'low' | 'medium' | 'high'
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string | null
          type?: 'general' | 'contact' | 'task' | 'project'
          status?: 'active' | 'archived'
          priority?: 'low' | 'medium' | 'high'
          tags?: string[] | null
        }
      }
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
          start_date: string | null
          end_date: string | null
          priority: 'low' | 'medium' | 'high'
          category: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          status?: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          category?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          status?: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          category?: string | null
          tags?: string[] | null
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