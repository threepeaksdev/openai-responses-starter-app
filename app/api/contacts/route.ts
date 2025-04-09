import { NextRequest, NextResponse } from 'next/server'
import {
  handleGetContacts,
  handleCreateContact,
  handleUpdateContact,
  handleDeleteContact,
  handleGetContact
} from '../functions/contacts/handler'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = {
      search_term: searchParams.get('search_term') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      sort_by: searchParams.get('sort_by') as any || undefined,
      sort_order: searchParams.get('sort_order') as 'asc' | 'desc' | undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      per_page: searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : undefined,
    }

    const result = await handleGetContacts(params)
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/contacts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await handleCreateContact(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.contact, { status: 201 })
  } catch (error) {
    console.error('POST /api/contacts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contact_id = searchParams.get('id')
    
    if (!contact_id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const updates = await req.json()
    const result = await handleUpdateContact({ contact_id, ...updates })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result.contact)
  } catch (error) {
    console.error('PUT /api/contacts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    await handleDeleteContact(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/contacts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 