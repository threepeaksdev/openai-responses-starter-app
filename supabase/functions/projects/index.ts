import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request details
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
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

    switch (req.method) {
      case 'GET': {
        // Parse query parameters
        const url = new URL(req.url)
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

        return new Response(
          JSON.stringify({
            data,
            total: count || 0,
            page,
            per_page,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'POST': {
        const body = await req.json()
        
        console.log('POST body:', body)

        // Validate required fields
        if (!body.title) {
          throw new Error('Title is required')
        }

        // Prepare project data with defaults
        const projectData: Project = {
          title: body.title,
          description: body.description || '',
          status: body.status || 'planning',
          priority: body.priority || 'medium',
          start_date: body.start_date || new Date().toISOString().split('T')[0],
          end_date: body.end_date || null,
          user_id: user.id
        }

        // Only add tags if they exist in the request
        if (body.tags) {
          projectData.tags = Array.isArray(body.tags) ? body.tags : (body.tags ? [body.tags] : [])
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

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })
      }

      case 'PUT': {
        const url = new URL(req.url)
        const projectId = url.searchParams.get('id')
        
        if (!projectId) {
          throw new Error('Project ID is required')
        }

        const body = await req.json()
        console.log('PUT body:', { id: projectId, ...body })

        // Ensure status is valid if provided
        if (body.status && !['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'].includes(body.status)) {
          throw new Error('Invalid status value')
        }

        const { data, error } = await supabaseClient
          .from('projects')
          .update(body)
          .eq('id', projectId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const projectId = url.searchParams.get('id')
        
        if (!projectId) {
          throw new Error('Project ID is required')
        }

        console.log('DELETE project:', projectId)

        const { error } = await supabaseClient
          .from('projects')
          .delete()
          .eq('id', projectId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        throw new Error(`Method ${req.method} not allowed`)
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 