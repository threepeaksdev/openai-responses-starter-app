import { supabase } from "@/lib/supabase"

interface CreateNoteParams {
  title: string
  content: string
  contact_id?: string
  task_id?: string
  project_id?: string
  type?: 'general' | 'contact' | 'task' | 'project'
  status?: 'active' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  metadata?: Record<string, any>
}

interface UpdateNoteParams extends Partial<CreateNoteParams> {
  note_id: string
}

interface GetNotesParams {
  note_id?: string
  search_term?: string
  type?: 'general' | 'contact' | 'task' | 'project'
  status?: 'active' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  contact_id?: string
  task_id?: string
  project_id?: string
}

export const handleCreateNote = async (params: CreateNoteParams) => {
  try {
    // Validate required fields
    if (!params.title?.trim()) {
      throw new Error('Title is required')
    }
    if (!params.content?.trim()) {
      throw new Error('Content is required')
    }

    // Get the authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      throw new Error('User not authenticated')
    }

    // Only include fields that have actual values
    const noteData = Object.fromEntries(
      Object.entries(params).filter(entry => {
        const value = entry[1];
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      })
    );

    // Add the user_id from the authenticated session
    const newNote = {
      ...noteData,
      user_id: userData.user.id,
      type: params.type || 'general',
      status: params.status || 'active'
    };

    const { data, error } = await supabase
      .from('notes')
      .insert([newNote])
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      note: data
    }
  } catch (error) {
    console.error('Error creating note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export const handleUpdateNote = async (params: UpdateNoteParams) => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      throw new Error('User not authenticated')
    }

    const { note_id, ...updateFields } = params

    // First check if the note exists and belongs to the user
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select()
      .eq('id', note_id)
      .eq('user_id', userData.user.id)
      .single()

    if (fetchError || !existingNote) {
      throw new Error('Note not found or access denied')
    }

    // Filter out undefined, null, and empty string values
    const updateData = Object.fromEntries(
      Object.entries(updateFields).filter(([_key, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      }).map(([key, value]) => [key, value])
    );

    // If we're only updating priority, make sure it's a valid value
    if (Object.keys(updateData).length === 1 && 'priority' in updateData) {
      const priority = updateData.priority as string;
      if (!['low', 'medium', 'high'].includes(priority)) {
        throw new Error('Invalid priority value');
      }
    }

    // Update the note
    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', note_id)
      .eq('user_id', userData.user.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Failed to update note');
    }

    return {
      success: true,
      note: data
    }
  } catch (error) {
    console.error('Error updating note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

export const handleGetNotes = async (params: GetNotesParams) => {
  try {
    // Get the authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser()
    if (authError || !userData.user) {
      throw new Error('User not authenticated')
    }

    // Start building the query
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userData.user.id)

    // Add filters based on provided parameters
    if (params.note_id) {
      query = query.eq('id', params.note_id)
    }
    if (params.type) {
      query = query.eq('type', params.type)
    }
    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.priority) {
      query = query.eq('priority', params.priority)
    }
    if (params.contact_id) {
      query = query.eq('contact_id', params.contact_id)
    }
    if (params.task_id) {
      query = query.eq('task_id', params.task_id)
    }
    if (params.project_id) {
      query = query.eq('project_id', params.project_id)
    }

    if (params.search_term) {
      const searchTerm = params.search_term.toLowerCase()
      query = query.or(
        `title.ilike.%${searchTerm}%,` +
        `content.ilike.%${searchTerm}%,` +
        `tags.ilike.%${searchTerm}%`
      )
    }

    // Execute the query
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Format the results to be more natural language friendly
    const notes = data.map(note => {
      const relatedTo = [];
      if (note.contact_id) relatedTo.push('contact');
      if (note.task_id) relatedTo.push('task');
      if (note.project_id) relatedTo.push('project');

      return {
        ...note,
        related_to: relatedTo.length ? relatedTo.join(', ') : 'general',
        display_status: `${note.priority || 'normal'} priority, ${note.status || 'active'}`
      };
    });

    return {
      success: true,
      notes: notes
    }
  } catch (error) {
    console.error('Error getting notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 