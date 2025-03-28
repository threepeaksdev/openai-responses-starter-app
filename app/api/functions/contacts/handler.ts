import { supabase } from "@/lib/supabase"

interface CreateContactParams {
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
  metadata?: Record<string, any>
}

interface UpdateContactParams extends Partial<CreateContactParams> {
  contact_id: string
}

interface GetContactsParams {
  contact_id?: string
  search_term?: string
  relationship_status?: 'friend' | 'family' | 'colleague' | 'acquaintance' | 'other'
}

export const handleCreateContact = async (params: CreateContactParams) => {
  try {
    // Validate required fields
    if (!params.first_name?.trim()) {
      throw new Error('First name is required')
    }

    // Get the authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      throw new Error('User not authenticated')
    }

    // Only include fields that have actual values
    const contactData = Object.fromEntries(
      Object.entries(params).filter(entry => {
        const value = entry[1];
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      })
    );

    // Add the user_id from the authenticated session
    const newContact = {
      ...contactData,
      user_id: userData.user.id
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert([newContact])
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
    console.error('Error creating contact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export const handleUpdateContact = async (params: UpdateContactParams) => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      throw new Error('User not authenticated')
    }

    const { contact_id, ...updateData } = params

    // First check if the contact exists and belongs to the user
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select()
      .eq('id', contact_id)
      .eq('user_id', userData.user.id)
      .single()

    if (fetchError || !existingContact) {
      throw new Error('Contact not found or access denied')
    }

    // Update the contact
    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contact_id)
      .eq('user_id', userData.user.id)
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
    console.error('Error updating contact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export const handleGetContacts = async (params: GetContactsParams) => {
  try {
    // Get the authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      throw new Error('User not authenticated')
    }

    // Start building the query
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userData.user.id)

    // Add filters based on provided parameters
    if (params.contact_id) {
      query = query.eq('id', params.contact_id)
    }

    if (params.relationship_status) {
      query = query.eq('relationship_status', params.relationship_status)
    }

    if (params.search_term) {
      const searchTerm = params.search_term.toLowerCase()
      query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%`)
    }

    // Execute the query
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return {
      success: true,
      contacts: data,
      count: data.length
    }
  } catch (error) {
    console.error('Error retrieving contacts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 