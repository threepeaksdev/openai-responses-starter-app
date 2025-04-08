import { createClient } from '@/lib/supabase/client'
import { Task } from '@/app/api/types'

interface BaseQueryParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

interface TasksQueryParams extends BaseQueryParams {
  search_term?: string
  status?: string
  priority?: string
  tags?: string[]
}

interface DatabaseResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export class DatabaseService {
  private supabase = createClient()
  private projectRef = 'khcalqejjhsggismhfmp' // Your project reference ID

  private async fetchFromApi<T>(
    endpoint: string,
    params: Record<string, any>
  ): Promise<DatabaseResponse<T>> {
    const searchParams = new URLSearchParams()
    
    // Convert params to URLSearchParams
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','))
        } else {
          searchParams.set(key, String(value))
        }
      }
    })

    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(
      `https://${this.projectRef}.supabase.co/functions/v1/${endpoint}?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch data')
    }

    return response.json()
  }

  async getTasks(params: TasksQueryParams = {}): Promise<DatabaseResponse<Task>> {
    return this.fetchFromApi<Task>('tasks', params)
  }

  // Other methods remain unchanged
  // ... existing code ...
} 