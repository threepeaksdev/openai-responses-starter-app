import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleCreateNote, handleUpdateNote, handleDeleteNote, Note } from './handler'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', session.user.id)

    // If noteId is provided, get specific note
    if (noteId) {
      query = query.eq('id', noteId)
    }

    // Apply search if provided
    const search_term = searchParams.get('search_term')
    if (search_term) {
      query = query.or(
        `title.ilike.%${search_term}%,content.ilike.%${search_term}%`
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
    console.error('Error in GET /api/functions/notes:', error)
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
    
    // Add user_id to the note data
    const noteData: Partial<Note> = {
      ...body,
      user_id: session.user.id
    }

    const result = await handleCreateNote(noteData)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.note)
  } catch (error) {
    console.error('Error in POST /api/functions/notes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')
    
    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const result = await handleUpdateNote({
      note_id: noteId,
      ...body
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.note)
  } catch (error) {
    console.error('Error in PUT /api/functions/notes:', error)
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
    const noteId = searchParams.get('id')
    
    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    const result = await handleDeleteNote(noteId)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/functions/notes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 