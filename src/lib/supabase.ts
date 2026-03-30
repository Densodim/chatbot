import 'server-only'
import { createClient } from '@supabase/supabase-js'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY',
    )
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

type AdminClient = ReturnType<typeof createAdminClient>

let _client: AdminClient | undefined

/**
 * Server-side Supabase admin client (lazy singleton).
 * Defers initialization to first use — Next.js production builds succeed
 * without runtime secrets present. Uses SERVICE_ROLE_KEY — never import
 * in Client Components.
 */
export const supabaseAdmin: AdminClient = new Proxy(
  {} as unknown as AdminClient,
  {
    get(_target, prop) {
      _client ??= createAdminClient()
      const value = Reflect.get(_client, prop)
      if (typeof value !== 'function') {
        return value
      }
      return (value as (...args: unknown[]) => unknown).bind(_client)
    },
  },
)
