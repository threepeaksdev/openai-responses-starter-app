import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors'
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface Task {
  id?: string
  title: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
  tags?: string[]
  user_id: string
  created_at?: string
  updated_at?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS')
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    return res.status(200).end()
  }

  try {
    // Log request details
    console.log('Request method:', req.method)
    console.log('Request headers:', req.headers)
    
    const supabaseUrl = process.env.SUPABASE_URL || 'default_url'
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'default_key'
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

    // Get the authorization header
    const authHeader = req.headers.authorization || ''

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the session of the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    console.log('Auth result:', { user: !!user, error: authError })

    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`)
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Test database connection
    const { data: testData, error: testError } = await supabaseClient
      .from('tasks')
      .select('id')
      .limit(1)

    console.log('Database connection test:', { data: testData, error: testError })

    if (testError) {
      throw new Error(`Database connection error: ${testError.message}`)
    }

    switch (req.method) {
      case 'GET': {
        // Parse query parameters
        const search_term = req.query.search_term as string || undefined
        const status = req.query.status as string || undefined
        const priority = req.query.priority as string || undefined
        const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined
        const sort_by = req.query.sort_by as string || 'created_at'
        const sort_order = req.query.sort_order as string || 'desc'
        const page = parseInt(req.query.page as string || '1')
        const per_page = parseInt(req.query.per_page as string || '10')

        console.log('GET params:', { search_term, status, priority, tags, sort_by, sort_order, page, per_page })

        // Build the query
        let query = supabaseClient
          .from('tasks')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)

        if (search_term) {
          query = query.or(
            `title.ilike.%${search_term}%,description.ilike.%${search_term}%`
          )
        }

        if (status) {
          query = query.eq('status', status)
        }

        if (priority) {
          query = query.eq('priority', priority)
        }

        if (tags) {
          query = query.contains('tags', tags)
        }

        query = query.order(sort_by, { ascending: sort_order === 'asc' })

        const start = (page - 1) * per_page
        query = query.range(start, start + per_page - 1)

        const { data, error, count } = await query

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        return res.status(200).json({
          data,
          total: count || 0,
          page,
          per_page,
        })
      }

      case 'POST': {
        const taskData = { 
          ...req.body, 
          user_id: user.id, 
          status: req.body.status || 'pending', 
          priority: req.body.priority || 'medium' 
        }
        
        console.log('POST body:', taskData)

        // Validate required fields
        if (!taskData.title) {
          return res.status(400).json({ error: 'Title is required' })
        }

        console.log('Creating task:', taskData)

        // First, check if we can query the tasks table
        const { error: checkError } = await supabaseClient
          .from('tasks')
          .select('id')
          .limit(1)

        if (checkError) {
          console.error('Table access error:', checkError)
          throw new Error(`Table access error: ${checkError.message}`)
        }

        // Try to insert the task
        const { data, error } = await supabaseClient
          .from('tasks')
          .insert([taskData])
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        console.log('Task created successfully:', data)

        return res.status(201).json(data)
      }

      case 'PUT': {
        const taskId = req.query.id as string

        if (!taskId) {
          return res.status(400).json({ error: 'Task ID is required' })
        }

        console.log('PUT body:', req.body)

        // Try to update the task
        const { data, error } = await supabaseClient
          .from('tasks')
          .update(req.body)
          .eq('id', taskId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        return res.status(200).json(data)
      }

      case 'DELETE': {
        const taskId = req.query.id as string

        if (!taskId) {
          return res.status(400).json({ error: 'Task ID is required' })
        }

        // Try to delete the task
        const { error } = await supabaseClient
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        return res.status(204).end()
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}