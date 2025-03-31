import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export const useNotes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHighPriorityNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('priority', 'high')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch high priority notes';
      setError(message);
      console.error('Error fetching high priority notes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getHighPriorityNotes,
    loading,
    error
  };
}; 