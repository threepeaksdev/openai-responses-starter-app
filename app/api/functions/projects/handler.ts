import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  team_members?: string[];
  contact_ids?: string[];
  tags?: string[];
}

export interface GetProjectsParams {
  search_term?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  category?: string;
  tags?: string[];
  sort_by?: 'title' | 'created_at' | 'updated_at' | 'start_date' | 'due_date' | 'priority';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export async function handleGetProjects(params: GetProjectsParams = {}) {
  const supabase = createClient(cookies());
  const {
    search_term,
    status,
    priority,
    category,
    tags,
    sort_by = 'due_date',
    sort_order = 'asc',
    page = 1,
    per_page = 10
  } = params;

  let query = supabase
    .from('projects')
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

  // Apply category filter
  if (category) {
    query = query.eq('category', category);
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
    projects: data as Project[],
    total: count || 0,
    page,
    per_page
  };
}

export async function handleCreateProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Project;
}

export async function handleUpdateProject(id: string, updates: Partial<Project>) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Project;
}

export async function handleDeleteProject(id: string) {
  const supabase = createClient(cookies());
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}

export async function handleGetProject(id: string) {
  const supabase = createClient(cookies());
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data as Project;
} 