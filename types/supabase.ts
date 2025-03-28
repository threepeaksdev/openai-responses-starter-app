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

export type Database = {
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
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
} 