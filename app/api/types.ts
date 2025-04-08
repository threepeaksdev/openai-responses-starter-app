export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface GetContactsParams {
  search_term?: string;
  tags?: string[];
  sort_by?: 'first_name' | 'last_name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface GetTasksParams {
  search_term?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  tags?: string[];
  sort_by?: 'title' | 'status' | 'priority' | 'due_date' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
} 