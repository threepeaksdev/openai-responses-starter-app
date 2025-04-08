import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Project {
  id?: string
  title: string
  description?: string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  start_date?: string
  end_date?: string
  tags?: string[]
  user_id: string
  created_at?: string
  updated_at?: string
}

interface ProjectResult {
  success: boolean
  project?: Project
  error?: string
}

export async function handleCreateProject(projectData: Project): Promise<ProjectResult> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Insert the project
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      project: data
    }
  } catch (error) {
    console.error('Error in handleCreateProject:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function handleUpdateProject({
  project_id,
  ...updates
}: {
  project_id: string
} & Partial<Project>): Promise<ProjectResult> {
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

    // Update the project
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', project_id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      project: data
    }
  } catch (error) {
    console.error('Error in handleUpdateProject:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function handleDeleteProject(id: string): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in handleDeleteProject:', error)
    throw error
  }
}

export async function handleGetProject(id: string): Promise<Project> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in handleGetProject:', error)
    throw error
  }
} 