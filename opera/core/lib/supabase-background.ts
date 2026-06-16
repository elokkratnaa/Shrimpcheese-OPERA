import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for use in background service functions that run
 * outside the Next.js request lifecycle (fire-and-forget tasks, queued jobs).
 *
 * Accepts an optional userAccessToken. When provided, the client is authorized
 * as that user — RLS policies apply as if they made the request.
 * When omitted, falls back to the service-role key (bypasses RLS, server-only)
 * or the anon key as a last resort.
 *
 * @param userAccessToken - The authenticated user's JWT access token (from supabase.auth.getSession())
 * @returns Supabase client configured for background execution
 */
export function createBackgroundClient(userAccessToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }

  // Prefer service-role key for background tasks (bypasses RLS, safe server-only)
  const key = serviceRoleKey ?? anonKey
  if (!key) {
    throw new Error('No Supabase key available for background client')
  }

  const client = createSupabaseClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // If a user token is provided, set it as the active session so RLS sees it
  if (userAccessToken) {
    client.auth.setSession({ access_token: userAccessToken, refresh_token: '' })
  }

  return client
}
