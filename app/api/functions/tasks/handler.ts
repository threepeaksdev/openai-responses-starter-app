import { Task } from '@/types/supabase'
import { supabase } from "@/lib/supabase";

interface ManageTasksParams {
  action: 'create' | 'read' | 'update' | 'delete'
  taskId?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  task?: Partial<Task>
}

interface CreateTaskParams {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

interface EditTaskParams {
  task_id: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export async function handleManageTasks(params: ManageTasksParams) {
  const { action, taskId, status, task } = params
  const baseUrl = '/api/functions/tasks'

  try {
    switch (action) {
      case 'create': {
        if (!task) {
          throw new Error('Task data is required for create action')
        }

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })

        if (!response.ok) {
          throw new Error(`Failed to create task: ${response.statusText}`)
        }

        return await response.json()
      }

      case 'read': {
        const url = new URL(baseUrl, window.location.origin)
        if (taskId) url.searchParams.set('id', taskId)
        if (status) url.searchParams.set('status', status)

        const response = await fetch(url.toString())
        if (!response.ok) {
          throw new Error(`Failed to read tasks: ${response.statusText}`)
        }

        return await response.json()
      }

      case 'update': {
        if (!taskId) {
          throw new Error('Task ID is required for update action')
        }
        if (!task) {
          throw new Error('Task data is required for update action')
        }

        const url = new URL(baseUrl, window.location.origin)
        url.searchParams.set('id', taskId)

        const response = await fetch(url.toString(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })

        if (!response.ok) {
          throw new Error(`Failed to update task: ${response.statusText}`)
        }

        return await response.json()
      }

      case 'delete': {
        if (!taskId) {
          throw new Error('Task ID is required for delete action')
        }

        const url = new URL(baseUrl, window.location.origin)
        url.searchParams.set('id', taskId)

        const response = await fetch(url.toString(), {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`Failed to delete task: ${response.statusText}`)
        }

        return await response.json()
      }

      default:
        throw new Error(`Invalid action: ${action}`)
    }
  } catch (error) {
    console.error('Error in handleManageTasks:', error)
    throw error
  }
}

export const handleCreateTask = async (params: CreateTaskParams) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const newTask = {
      user_id: userData.user.id,
      title: params.title,
      description: params.description,
      status: params.status || 'pending',
      due_date: params.due_date,
      priority: params.priority || 'medium',
      tags: params.tags || []
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      task: data
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const handleEditTask = async (params: EditTaskParams) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // First check if the task exists and belongs to the user
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select()
      .eq('id', params.task_id)
      .eq('user_id', userData.user.id)
      .single();

    if (fetchError || !existingTask) {
      throw new Error('Task not found or access denied');
    }

    // Prepare update data (only include fields that are provided)
    const updateData: Partial<Task> = {};
    if (params.title !== undefined) updateData.title = params.title;
    if (params.description !== undefined) updateData.description = params.description;
    if (params.status !== undefined) updateData.status = params.status;

    // Update the task
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', params.task_id)
      .eq('user_id', userData.user.id) // Extra safety check
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      task: data
    };
  } catch (error) {
    console.error('Error editing task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}; 