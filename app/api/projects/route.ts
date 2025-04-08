import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search_term = searchParams.get('search_term') || undefined;
  const status = searchParams.get('status') || undefined;
  const priority = searchParams.get('priority') || undefined;
  const category = searchParams.get('category') || undefined;
  const tags = searchParams.get('tags')?.split(',') || undefined;
  const sort_by = searchParams.get('sort_by') || 'start_date';
  const sort_order = searchParams.get('sort_order') as 'asc' | 'desc' || 'asc';
  const page = parseInt(searchParams.get('page') || '1');
  const per_page = parseInt(searchParams.get('per_page') || '10');

  const supabase = createClient(cookies());
  let query = supabase
    .from('projects')
    .select('*');

  if (search_term) {
    query = query.or(
      `title.ilike.%${search_term}%,description.ilike.%${search_term}%`
    );
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (priority) {
    query = query.eq('priority', priority);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (tags) {
    query = query.contains('tags', tags);
  }

  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  const start = (page - 1) * per_page;
  query = query.range(start, start + per_page - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    projects: data,
    total: count || 0,
    page,
    per_page
  });
}

export async function POST(request: Request) {
  const project = await request.json();
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const { id, ...updates } = await request.json();
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const supabase = createClient(cookies());
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 