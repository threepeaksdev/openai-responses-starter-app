import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface FetchParams {
  endpoint: 'functions/contacts' | 'functions/tasks' | 'functions/projects' | 'functions/notes';
  searchTerm?: string;
  status?: string;
  priority?: string;
  type?: string;
  category?: string;
  contact_id?: string;
  task_id?: string;
  project_id?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export function useDataFetch<T>({
  endpoint,
  searchTerm = '',
  status,
  priority,
  type,
  category,
  contact_id,
  task_id,
  project_id,
  tags = [],
  sortBy,
  sortOrder = 'asc',
  page = 1,
  pageSize = 10
}: FetchParams) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const projectRef = 'khcalqejjhsggismhfmp';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const queryParams = new URLSearchParams();
      
      if (searchTerm) queryParams.append('search_term', searchTerm);
      if (status) queryParams.append('status', status);
      if (priority) queryParams.append('priority', priority);
      if (type) queryParams.append('type', type);
      if (category) queryParams.append('category', category);
      if (contact_id) queryParams.append('contact_id', contact_id);
      if (task_id) queryParams.append('task_id', task_id);
      if (project_id) queryParams.append('project_id', project_id);
      if (tags.length > 0) queryParams.append('tags', tags.join(','));
      if (sortBy) queryParams.append('sort_by', sortBy);
      if (sortOrder) queryParams.append('sort_order', sortOrder);
      if (page) queryParams.append('page', page.toString());
      if (pageSize) queryParams.append('per_page', pageSize.toString());

      // Extract the function name from the endpoint
      const functionName = endpoint.split('/')[1];
      
      const response = await fetch(
        `https://${projectRef}.supabase.co/functions/v1/${functionName}?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.data || []); // Extract data from the paginated response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    searchTerm,
    status,
    priority,
    type,
    category,
    contact_id,
    task_id,
    project_id,
    tags,
    sortBy,
    sortOrder,
    page,
    pageSize,
    projectRef,
    supabase.auth
  ]);

  const mutate = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [supabase.auth, fetchData]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchData]);

  return { data, loading, error, mutate };
} 