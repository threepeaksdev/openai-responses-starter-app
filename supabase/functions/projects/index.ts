import { createClient } from '@supabase/supabase-js'
import { createServer } from 'http'
import { corsHeaders } from '../_shared/cors'

interface Project {
  id?: string
  title: string
  description?: string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
  priority?: 'low' | 'medium' | 'high'
  start_date?: string
  end_date?: string
  tags?: string[]
  user_id: string
  created_at?: string
  updated_at?: string
}

// Replace Deno's serve function with Node.js HTTP server
createServer(async (req, res) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    return res.end('ok')
  }

  try {
    // Log request details
    console.log('Request method:', req.method)
    console.log('Request headers:', req.headers)
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers['authorization']! },
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
      throw new Error('User not authenticated')
    }

    // Test database connection
    const { data: testData, error: testError } = await supabaseClient
      .from('projects')
      .select('id')
      .limit(1)

    console.log('Database connection test:', { data: testData, error: testError })

    if (testError) {
      throw new Error(`Database connection error: ${testError.message}`)
    }

    // Handle different request methods
    switch (req.method) {
      case 'GET': {
        // Parse query parameters
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const search_term = url.searchParams.get('search_term') || undefined
        const status = url.searchParams.get('status') || undefined
        const sort_by = url.searchParams.get('sort_by') || 'created_at'
        const sort_order = url.searchParams.get('sort_order') || 'desc'
        const page = parseInt(url.searchParams.get('page') || '1')
        const per_page = parseInt(url.searchParams.get('per_page') || '10')

        console.log('GET params:', { 
          search_term, 
          status,
          sort_by, 
          sort_order, 
          page, 
          per_page 
        })

        // Build the query
        let query = supabaseClient
          .from('projects')
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

        query = query.order(sort_by, { ascending: sort_order === 'asc' })

        const start = (page - 1) * per_page
        query = query.range(start, start + per_page - 1)

        const { data, error, count } = await query

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({
          data,
          total: count || 0,
          page,
          per_page,
        }))
      }

      case 'POST': {
        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        req.on('end', async () => {
          const parsedBody = JSON.parse(body)
          console.log('POST body:', parsedBody)

          // Validate required fields
          if (!parsedBody.title) {
            throw new Error('Title is required')
          }

          // Prepare project data with defaults
          const projectData: Project = {
            title: parsedBody.title,
            description: parsedBody.description || '',
            status: parsedBody.status || 'planning',
            priority: parsedBody.priority || 'medium',
            start_date: parsedBody.start_date || new Date().toISOString().split('T')[0],
            end_date: parsedBody.end_date || null,
            user_id: user.id
          }

          // Only add tags if they exist in the request
          if (parsedBody.tags) {
            projectData.tags = Array.isArray(parsedBody.tags) ? parsedBody.tags : (parsedBody.tags ? [parsedBody.tags] : [])
          }

          console.log('Creating project with data:', projectData)

          // Try to insert the project
          const { data, error } = await supabaseClient
            .from('projects')
            .insert([projectData])
            .select()
            .single()

          if (error) {
            console.error('Database error:', error)
            throw new Error(`Database error: ${error.message}`)
          }

          console.log('Project created successfully:', data)

          res.writeHead(201, { ...corsHeaders, 'Content-Type': 'application/json' })
          return res.end(JSON.stringify(data))
        })
        break
      }

      case 'PUT': {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const projectId = url.searchParams.get('id')
        
        if (!projectId) {
          throw new Error('Project ID is required')
        }

        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        req.on('end', async () => {
          const parsedBody = JSON.parse(body)
          console.log('PUT body:', { id: projectId, ...parsedBody })

          // Ensure status is valid if provided
          if (parsedBody.status && !['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'].includes(parsedBody.status)) {
            throw new Error('Invalid status value')
          }

          // Update the project
          const { data, error } = await supabaseClient
            .from('projects')
            .update(parsedBody)
            .eq('id', projectId)
            .select()
            .single()

          if (error) {
            console.error('Database error:', error)
            throw new Error(`Database error: ${error.message}`)
          }

          console.log('Project updated successfully:', data)

          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
          return res.end(JSON.stringify(data))
        })
        break
      }

      case 'DELETE': {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const projectId = url.searchParams.get('id')
        
        if (!projectId) {
          throw new Error('Project ID is required')
        }

        // Delete the project
        const { data, error } = await supabaseClient
          .from('projects')
          .delete()
          .eq('id', projectId)
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        console.log('Project deleted successfully:', data)

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        return res.end(JSON.stringify(data))
      }

      default: {
        res.writeHead(405, { ...corsHeaders, 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'Method not allowed' }))
      }
    }
  } catch (error) {
    console.error('Error:', error)
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }))
  }
}).listen(3000, () => {
  console.log('Server running on http://localhost:3000')
}) 