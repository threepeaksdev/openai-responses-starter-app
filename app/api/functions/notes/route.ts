import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'
import { createClient } from '@/lib/supabase/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { handleCreateNote, handleUpdateNote, handleDeleteNote, Note } from './handler'

type Note = Database['public']['Tables']['notes']['Row']

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('id')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    
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

    // If type is provided, filter by type
    if (type) {
      query = query.eq('type', type)
    }

    // If status is provided, filter by status
    if (status) {
      query = query.eq('status', status)
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
    const supabase = await createClient()
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const note: any = {
      ...body,
      user_id: session.user.id,
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([note])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in create note route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
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

    const body = await request.json()
    const { data, error } = await supabase
      .from('notes')
      .update(body)
      .eq('id', noteId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in update note route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
} 