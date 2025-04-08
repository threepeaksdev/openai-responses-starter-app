import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { createClient } from '@/lib/supabase/server';

type Contact = Database['public']['Tables']['contacts']['Row'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search_term = searchParams.get('search_term') || undefined;
    const tags = searchParams.get('tags')?.split(',') || undefined;
    const sort_by = searchParams.get('sort_by') as 'first_name' | 'last_name' | 'created_at' | 'updated_at' || 'updated_at';
    const sort_order = searchParams.get('sort_order') as 'asc' | 'desc' || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');

    const supabase = await createClient();
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id);

    if (search_term) {
      query = query.or(
        `first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%,email.ilike.%${search_term}%`
      );
    }

    if (tags) {
      query = query.contains('tags', tags);
    }

    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    const start = (page - 1) * per_page;
    query = query.range(start, start + per_page - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      contacts: data,
      total: count || 0,
      page,
      per_page
    });
  } catch (error) {
    console.error('Error in GET /api/contacts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const contact: Partial<Contact> = {
      ...body,
      user_id: session.user.id,
    };

    const { data, error } = await supabase
      .from('contacts')
      .insert([contact])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/contacts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updates } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/contacts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get user from session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/contacts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 