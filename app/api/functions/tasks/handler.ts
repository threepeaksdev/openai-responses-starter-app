import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface GetTasksParams {
  search_term?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  tags?: string[];
  sort_by?: 'title' | 'created_at' | 'updated_at' | 'due_date' | 'priority';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export async function handleGetTasks(params: GetTasksParams = {}) {
  const supabase = createClient(cookies());
  const {
    search_term,
    status,
    priority,
    tags,
    sort_by = 'due_date',
    sort_order = 'asc',
    page = 1,
    per_page = 10
  } = params;

  let query = supabase
    .from('tasks')
    .select('*');

  // Apply search if provided
  if (search_term) {
    query = query.or(
      `title.ilike.%${search_term}%,description.ilike.%${search_term}%`
    );
  }

  // Apply status filter
  if (status) {
    query = query.eq('status', status);
  }

  // Apply priority filter
  if (priority) {
    query = query.eq('priority', priority);
  }

  // Apply tags filter if provided
  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Apply pagination
  const start = (page - 1) * per_page;
  query = query.range(start, start + per_page - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    tasks: data as Task[],
    total: count || 0,
    page,
    per_page
  };
}

export async function handleCreateTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Task;
}

export async function handleUpdateTask(id: string, updates: Partial<Task>) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Task;
}

export async function handleDeleteTask(id: string) {
  const supabase = createClient(cookies());
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}

export async function handleGetTask(id: string) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as Task;
} 