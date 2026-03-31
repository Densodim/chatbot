import 'server-only'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import type { AnonymousSession, AnonymousSessionInsert } from '@/types/db'

export const ANON_SESSION_COOKIE = 'anon_session_id'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const ANON_MESSAGE_LIMIT = 3

export async function getAnonymousFingerprintFromCookies(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(ANON_SESSION_COOKIE)?.value ?? null
}

export async function getAnonymousSessionByFingerprint(
  fingerprint: string,
): Promise<AnonymousSession | null> {
  const { data } = await supabaseAdmin
    .from('anonymous_sessions')
    .select('*')
    .eq('fingerprint', fingerprint)
    .single()

  return (data as AnonymousSession | null) ?? null
}

export async function getOrCreateAnonymousSession(): Promise<AnonymousSession> {
  const jar = await cookies()
  const existingFingerprint = jar.get(ANON_SESSION_COOKIE)?.value

  if (existingFingerprint) {
    const existing = await getAnonymousSessionByFingerprint(existingFingerprint)
    if (existing) {
      return existing
    }
  }

  const fingerprint = crypto.randomUUID()
  const insert: AnonymousSessionInsert = { fingerprint }

  const { data: created, error } = await supabaseAdmin
    .from('anonymous_sessions')
    .insert(insert)
    .select()
    .single()

  if (error || !created) {
    throw new Error(error?.message ?? 'Failed to create anonymous session')
  }

  jar.set(ANON_SESSION_COOKIE, fingerprint, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ANON_COOKIE_MAX_AGE,
  })

  return created as AnonymousSession
}

export function getRemainingAnonymousMessages(messageCount: number): number {
  return Math.max(0, ANON_MESSAGE_LIMIT - messageCount)
}
