import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors'

interface Contact {
  id?: string
  first_name: string
  last_name: string
  nickname?: string
  email?: string
  phone?: string
  birthday?: string
  occupation?: string
  company?: string
  location?: string
  linkedin?: string
  twitter?: string
  instagram?: string
  relationship_status?: 'friend' | 'family' | 'colleague' | 'acquaintance' | 'other'
  met_at?: string
  met_through?: string
  bio?: string
  interests?: string[]
  tags?: string[]
  notes?: string
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
    console.log('Request method:', req.method)
    console.log('Request headers:', req.headers)
    
    const supabaseUrl = process.env.SUPABASE_URL || 'default_url'
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'default_key'
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

    // Get the authorization header
    const authHeader = req.headers['authorization'] || ''

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

    switch (req.method) {
      case 'GET': {
        // Parse query parameters
        if (!req.url) {
          throw new Error('URL is required');
        }
        const url = new URL(req.url);
        const search_term = url.searchParams.get('search_term') || undefined
        const tags = url.searchParams.get('tags')?.split(',') || undefined
        const sort_by = url.searchParams.get('sort_by') || 'created_at'
        const sort_order = url.searchParams.get('sort_order') || 'desc'
        const page = parseInt(url.searchParams.get('page') || '1')
        const per_page = parseInt(url.searchParams.get('per_page') || '10')

        console.log('GET params:', { search_term, tags, sort_by, sort_order, page, per_page })

        // Build the query
        let query = supabaseClient
          .from('contacts')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)

        if (search_term) {
          query = query.or(
            `first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%,email.ilike.%${search_term}%`
          )
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

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          data,
          total: count || 0,
          page,
          per_page,
        }))
        break
      }

      case 'POST': {
        const body = await new Promise<any>((resolve, reject) => {
          let data = ''
          req.on('data', chunk => {
            data += chunk
          })
          req.on('end', () => {
            resolve(JSON.parse(data))
          })
          req.on('error', reject)
        })
        
        console.log('POST body:', body)

        // Validate required fields
        if (!body.first_name || !body.last_name) {
          throw new Error('First name and last name are required')
        }

        // Clean up the data - convert empty strings to null for optional fields
        const cleanedBody = Object.entries(body).reduce((acc, [key, value]) => {
          // Convert empty strings to null
          if (value === '') {
            acc[key] = null;
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);

        const contactData: Contact = {
          first_name: body.first_name,
          last_name: body.last_name,
          ...cleanedBody,
          user_id: user.id,
        };

        console.log('Creating contact:', contactData)

        const { data, error } = await supabaseClient
          .from('contacts')
          .insert([contactData])
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        res.writeHead(201, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify(data))
        break
      }

      case 'PUT': {
        if (!req.url) {
          throw new Error('URL is required');
        }
        const url = new URL(req.url);
        const contactId = url.searchParams.get('id')
        
        if (!contactId) {
          throw new Error('Contact ID is required')
        }

        const body = await new Promise<any>((resolve, reject) => {
          let data = ''
          req.on('data', chunk => {
            data += chunk
          })
          req.on('end', () => {
            resolve(JSON.parse(data))
          })
          req.on('error', reject)
        })
        console.log('PUT body:', { id: contactId, ...body })

        const { data: updatedData, error } = await supabaseClient
          .from('contacts')
          .update(body)
          .eq('id', contactId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify(updatedData))
        break
      }

      case 'DELETE': {
        if (!req.url) {
          throw new Error('URL is required');
        }
        const url = new URL(req.url);
        const contactId = url.searchParams.get('id')
        
        if (!contactId) {
          throw new Error('Contact ID is required')
        }

        console.log('DELETE contact:', contactId)

        const { error } = await supabaseClient
          .from('contacts')
          .delete()
          .eq('id', contactId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Database error:', error)
          throw new Error(`Database error: ${error.message}`)
        }

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
        break
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