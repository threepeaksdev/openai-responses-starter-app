import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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

    switch (req.method) {
      case 'GET': {
        // Parse query parameters
        const url = new URL(req.url)
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

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })
      }

      case 'PUT': {
        const url = new URL(req.url)
        const contactId = url.searchParams.get('id')
        
        if (!contactId) {
          throw new Error('Contact ID is required')
        }

        const body = await req.json()
        console.log('PUT body:', { id: contactId, ...body })

        const { data, error } = await supabaseClient
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

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'DELETE': {
        const url = new URL(req.url)
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
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 