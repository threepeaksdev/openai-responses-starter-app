import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Note {
  id?: string
  title: string
  content: string
  contact_id?: string
  task_id?: string
  project_id?: string
  type: 'general' | 'contact' | 'task' | 'project'
  status: 'active' | 'archived'
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  user_id: string
  created_at?: string
  updated_at?: string
}

interface NoteResult {
  success: boolean
  note?: Note
  error?: string
}

export interface GetNotesParams {
  search_term?: string;
  type?: Note['type'];
  status?: Note['status'];
  priority?: Note['priority'];
  contact_id?: string;
  task_id?: string;
  project_id?: string;
  tags?: string[];
  sort_by?: 'title' | 'created_at' | 'updated_at' | 'priority';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export async function handleGetNotes(params: GetNotesParams = {}) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    search_term,
    type,
    status = 'active',
    priority,
    contact_id,
    task_id,
    project_id,
    tags,
    sort_by = 'updated_at',
    sort_order = 'desc',
    page = 1,
    per_page = 10
  } = params

  let query = supabase
    .from('notes')
    .select('*')

  // Apply search if provided
  if (search_term) {
    query = query.or(
      `title.ilike.%${search_term}%,content.ilike.%${search_term}%`
    )
  }

  // Apply type filter
  if (type) {
    query = query.eq('type', type)
  }

  // Apply status filter
  if (status) {
    query = query.eq('status', status)
  }

  // Apply priority filter
  if (priority) {
    query = query.eq('priority', priority)
  }

  // Apply relationship filters
  if (contact_id) {
    query = query.eq('contact_id', contact_id)
  }
  if (task_id) {
    query = query.eq('task_id', task_id)
  }
  if (project_id) {
    query = query.eq('project_id', project_id)
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
    notes: data as Note[],
    total: count || 0,
    page,
    per_page
  }
}

export async function handleCreateNote(noteData: Note): Promise<NoteResult> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Insert the note
    const { data, error } = await supabase
      .from('notes')
      .insert([noteData])
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
    console.error('Error in handleCreateNote:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function handleUpdateNote({
  note_id,
  ...updates
}: {
  note_id: string
} & Partial<Note>): Promise<NoteResult> {
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

    // Update the note
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', note_id)
      .eq('user_id', session.user.id)
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
    console.error('Error in handleUpdateNote:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function handleDeleteNote(id: string): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in handleDeleteNote:', error)
    throw error
  }
}

export async function handleGetNote(id: string): Promise<Note> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in handleGetNote:', error)
    throw error
  }
} 