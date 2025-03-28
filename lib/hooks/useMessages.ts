import { useCallback, useState } from 'react'
import { supabase } from '../supabase'
import type { Message } from '../../types/supabase'

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  const addMessage = async (content: string, role: 'user' | 'assistant') => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('No user found')

      const newMessage = {
        user_id: userData.user.id,
        content,
        role,
        conversation_id: conversationId,
      }

      // Add message optimistically to local state
      const optimisticMessage = {
        ...newMessage,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, optimisticMessage])

      // Send to Supabase in the background
      const { error } = await supabase.from('messages').insert([newMessage])
      if (error) {
        // If there's an error, revert the optimistic update
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        throw error
      }
    } catch (error) {
      console.error('Error adding message:', error)
    }
  }

  return {
    messages,
    loading,
    fetchMessages,
    addMessage,
  }
} 