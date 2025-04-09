import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';

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

createServer(async (req, res) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    res.end()
    return
  }

  try {
    // Log request details
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    const supabaseUrl = process.env.SUPABASE_URL || 'default_url';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'default_key';
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

    // Get the authorization header
    const authHeader = req.headers['authorization'] || '';

    // Ensure req.url is defined before using it
    const url = req.url ? new URL(req.url) : new URL('http://default');

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

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          data,
          total: count || 0,
          page,
          per_page,
        }))
      }

      case 'POST': {
        // Ensure req is defined and has the necessary methods
        if (req && typeof req.on === 'function') {
          const body = await new Promise<string>((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
              data += chunk;
            });
            req.on('end', () => {
              resolve(data);
            });
            req.on('error', reject);
          });

          // Ensure the body is parsed correctly into an object
          const parsedBody = JSON.parse(body);
          const noteData: Note = {
            ...parsedBody,
            user_id: user.id,
            contact_id: parsedBody.contact_id || null,
            task_id: parsedBody.task_id || null,
            project_id: parsedBody.project_id || null,
          };

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

          res.writeHead(201, { ...corsHeaders, 'Content-Type': 'application/json' })
          res.end(JSON.stringify(data))
        }
      }

      case 'PUT': {
        const noteId = url.searchParams.get('id')
        
        if (!noteId) {
          throw new Error('Note ID is required')
        }

        const body = await new Promise<string>((resolve, reject) => {
          let data = '';
          req.on('data', chunk => {
            data += chunk;
          });
          req.on('end', () => {
            resolve(data);
          });
          req.on('error', reject);
        });
        console.log('PUT body:', { id: noteId, ...JSON.parse(body) })

        // Clean up the data - convert empty strings to null for optional fields
        const cleanedBody = Object.entries(JSON.parse(body)).reduce((acc, [key, value]) => {
          // Convert empty strings to null
          if (value === '') {
            acc[key] = null;
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);

        console.log('Cleaned PUT body:', cleanedBody)

        const { data, error } = await supabaseClient
          .from('notes')
          .update(cleanedBody)
          .eq('id', noteId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify(data))
      }

      case 'DELETE': {
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

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      }

      default:
        throw new Error(`Method ${req.method} not allowed`)
    }
  } catch (error) {
    console.error('Error:', error)
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }))
  }
}).listen(8080) 