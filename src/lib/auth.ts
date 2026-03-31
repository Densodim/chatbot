import 'server-only'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'

export const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token'

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

/**
 * Writes session tokens into httpOnly cookies.
 * Call from route handlers after signInWithPassword / createUser.
 */
export async function setSessionCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
): Promise<void> {
  const jar = await cookies()
  jar.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  })
  jar.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  })
}

/** Clears both session cookies (logout). */
export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies()
  jar.delete(ACCESS_TOKEN_COOKIE)
  jar.delete(REFRESH_TOKEN_COOKIE)
}

/**
 * Returns the authenticated Supabase user from the current request cookies.
 * Silently attempts token refresh if the access token is expired.
 * Returns null for unauthenticated requests.
 */
export async function getCurrentUser() {
  const jar = await cookies()
  const accessToken = jar.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value

  if (!accessToken && !refreshToken) {
    return null
  }

  if (accessToken) {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
    if (!error && data.user) {
      return data.user
    }
  }

  if (!refreshToken) {
    return null
  }

  // Access token absent or expired — try refresh.
  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error || !data.session || !data.user) {
    return null
  }

  await setSessionCookies(
    data.session.access_token,
    data.session.refresh_token,
    data.session.expires_in,
  )

  return data.user
}
