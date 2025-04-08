import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleCreateProject, handleUpdateProject, handleDeleteProject } from './handler'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)

    // If projectId is provided, get specific project
    if (projectId) {
      query = query.eq('id', projectId)
    }

    // Apply search if provided
    const search_term = searchParams.get('search_term')
    if (search_term) {
      query = query.or(
        `title.ilike.%${search_term}%,description.ilike.%${search_term}%`
      )
    }

    // Apply status filter
    const status = searchParams.get('status')
    if (status) {
      query = query.eq('status', status)
    }

    // Apply priority filter
    const priority = searchParams.get('priority')
    if (priority) {
      query = query.eq('priority', priority)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/functions/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Add user_id to the project data
    const projectData = {
      ...body,
      user_id: session.user.id
    }

    const result = await handleCreateProject(projectData)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.project)
  } catch (error) {
    console.error('Error in POST /api/functions/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const result = await handleUpdateProject({
      project_id: projectId,
      ...body
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.project)
  } catch (error) {
    console.error('Error in PUT /api/functions/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const success = await handleDeleteProject(projectId)

    if (!success) {
      throw new Error('Failed to delete project')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/functions/projects:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 