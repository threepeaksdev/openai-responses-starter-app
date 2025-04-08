import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Contact {
  id?: string
  first_name: string
  last_name?: string
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
  user_id: string
}

interface ContactResult {
  success: boolean
  contact?: Contact
  error?: string
}

export async function handleCreateContact(contactData: Contact): Promise<ContactResult> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Insert the contact
    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      contact: data
    }
  } catch (error) {
    console.error('Error in handleCreateContact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function handleUpdateContact({
  contact_id,
  ...updates
}: {
  contact_id: string
} & Partial<Contact>): Promise<ContactResult> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session to ensure ownership
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }

    // Update the contact
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contact_id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      contact: data
    }
  } catch (error) {
    console.error('Error in handleUpdateContact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 