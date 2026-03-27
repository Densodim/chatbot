import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  )
}

/**
 * Browser Supabase client — for Realtime subscriptions only.
 * Auth is handled server-side via API routes, NOT this client.
 */
export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey)
