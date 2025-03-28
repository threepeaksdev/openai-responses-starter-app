import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { handleCreateContact, handleUpdateContact } from './handler'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('id')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)

    // If contactId is provided, get specific contact
    if (contactId) {
      query = query.eq('id', contactId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/functions/contacts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Get authenticated Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Add user_id to the contact data
    const contactData = {
      ...body,
      user_id: session.user.id
    }

    const result = await handleCreateContact(contactData)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.contact)
  } catch (error) {
    console.error('Error in POST /api/functions/contacts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('id')
    
    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const result = await handleUpdateContact({
      contact_id: contactId,
      ...body
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result.contact)
  } catch (error) {
    console.error('Error in PUT /api/functions/contacts:', error)
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
    const contactId = searchParams.get('id')
    
    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/functions/contacts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 