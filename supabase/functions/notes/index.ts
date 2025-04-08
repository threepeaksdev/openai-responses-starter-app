import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface Note {
  id?: string
  title: string
  content: string
  contact_id?: string
  task_id?: string
  project_id?: string
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
      .from('notes')
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
        const contact_id = url.searchParams.get('contact_id') || undefined
        const task_id = url.searchParams.get('task_id') || undefined
        const project_id = url.searchParams.get('project_id') || undefined
        const sort_by = url.searchParams.get('sort_by') || 'created_at'
        const sort_order = url.searchParams.get('sort_order') || 'desc'
        const page = parseInt(url.searchParams.get('page') || '1')
        const per_page = parseInt(url.searchParams.get('per_page') || '10')

        console.log('GET params:', { 
          search_term, 
          contact_id, 
          task_id, 
          project_id, 
          sort_by, 
          sort_order, 
          page, 
          per_page 
        })

        // Build the query
        let query = supabaseClient
          .from('notes')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)

        if (search_term) {
          query = query.or(
            `title.ilike.%${search_term}%,content.ilike.%${search_term}%`
          )
        }

        if (contact_id) {
          query = query.eq('contact_id', contact_id)
        }

        if (task_id) {
          query = query.eq('task_id', task_id)
        }

        if (project_id) {
          query = query.eq('project_id', project_id)
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
        if (!body.title || !body.content) {
          throw new Error('Title and content are required')
        }

        // Convert empty strings to null for UUID fields
        const noteData: Note = {
          ...body,
          user_id: user.id,
          contact_id: body.contact_id || null,
          task_id: body.task_id || null,
          project_id: body.project_id || null,
        }

        console.log('Creating note:', noteData)

        // First, check if we can query the notes table
        const { error: checkError } = await supabaseClient
          .from('notes')
          .select('id')
          .limit(1)

        if (checkError) {
          console.error('Table access error:', checkError)
          throw new Error(`Table access error: ${checkError.message}`)
        }

        // Try to insert the note
        const { data, error } = await supabaseClient
          .from('notes')
          .insert([noteData])
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        console.log('Note created successfully:', data)

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })
      }

      case 'PUT': {
        const url = new URL(req.url)
        const noteId = url.searchParams.get('id')
        
        if (!noteId) {
          throw new Error('Note ID is required')
        }

        const body = await req.json()
        console.log('PUT body:', { id: noteId, ...body })

        const { data, error } = await supabaseClient
          .from('notes')
          .update(body)
          .eq('id', noteId)
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
        const noteId = url.searchParams.get('id')
        
        if (!noteId) {
          throw new Error('Note ID is required')
        }

        console.log('DELETE note:', noteId)

        const { error } = await supabaseClient
          .from('notes')
          .delete()
          .eq('id', noteId)
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