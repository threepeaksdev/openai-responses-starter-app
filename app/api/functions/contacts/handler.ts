import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Contact {
  id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company?: string
  location?: string
  relationship_status?: 'friend' | 'family' | 'colleague' | 'acquaintance' | 'other'
  tags?: string[]
  user_id: string
  created_at?: string
  updated_at?: string
}

interface ContactResult {
  success: boolean
  contact?: Contact
  error?: string
}

export interface GetContactsParams {
  search_term?: string;
  tags?: string[];
  sort_by?: 'first_name' | 'last_name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export async function handleGetContacts(params: GetContactsParams = {}) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    search_term,
    tags,
    sort_by = 'updated_at',
    sort_order = 'desc',
    page = 1,
    per_page = 10
  } = params

  let query = supabase
    .from('contacts')
    .select('*')

  // Apply search if provided
  if (search_term) {
    query = query.or(
      `first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%,email.ilike.%${search_term}%`
    )
  }

  // Apply tags filter if provided
  if (tags && tags.length > 0) {
    query = query.contains('tags', tags)
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' })

  // Apply pagination
  const start = (page - 1) * per_page
  query = query.range(start, start + per_page - 1)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    contacts: data as Contact[],
    total: count || 0,
    page,
    per_page
  }
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

export async function handleDeleteContact(id: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }

  return true
}

export async function handleGetContact(id: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data as Contact
} 