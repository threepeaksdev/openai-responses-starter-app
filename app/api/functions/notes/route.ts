import { NextResponse } from 'next/server'
import { handleCreateNote, handleUpdateNote, handleGetNotes } from './handler'

export async function POST(request: Request) {
  try {
    const params = await request.json()
    const result = await handleCreateNote(params)
    return NextResponse.json(result)
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
    const params = await request.json()
    const result = await handleUpdateNote(params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in update note route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      note_id: searchParams.get('note_id') || undefined,
      search_term: searchParams.get('search_term') || undefined,
      type: searchParams.get('type') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      priority: searchParams.get('priority') as any || undefined,
      contact_id: searchParams.get('contact_id') || undefined,
      task_id: searchParams.get('task_id') || undefined,
      project_id: searchParams.get('project_id') || undefined
    }
    const result = await handleGetNotes(params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in get notes route:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
} 