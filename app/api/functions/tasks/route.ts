import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleCreateTask, handleUpdateTask } from './handler'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)

    // If taskId is provided, get specific task
    if (taskId) {
      query = query.eq('id', taskId)
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
    console.error('Error in GET /api/functions/tasks:', error)
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
    
    // Add user_id to the task data
    const taskData = {
      ...body,
      user_id: session.user.id
    }

    const result = await handleCreateTask(taskData)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.task)
  } catch (error) {
    console.error('Error in POST /api/functions/tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const result = await handleUpdateTask({
      task_id: taskId,
      ...body
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.task)
  } catch (error) {
    console.error('Error in PUT /api/functions/tasks:', error)
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
    const taskId = searchParams.get('id')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/functions/tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 