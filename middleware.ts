import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name, 
            value: '',
            ...options,
          })
        },
      },
    }
  )
  
  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()
  
  return res
}

// Ensure the middleware is run for auth routes
export const config = {
  matcher: [
    // Apply this middleware to all API routes and protected pages
    '/api/:path*',
    '/dashboard/:path*',
    '/tasks/:path*',
    '/projects/:path*',
    '/notes/:path*',
  ],
} 