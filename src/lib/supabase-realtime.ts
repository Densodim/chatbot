import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  )
}

/**
 * Supabase browser client for Realtime subscriptions.
 * Browser-only — call from Client Components.
 * Uses ANON/PUBLISHABLE key (safe to expose).
 */
export const createRealtimeClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey)
