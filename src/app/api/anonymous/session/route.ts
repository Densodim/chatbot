import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { AnonymousSessionInsert } from '@/types/db'

const ANON_SESSION_COOKIE = 'anon_session_id'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const ANON_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const ANON_MESSAGE_LIMIT = 3

/** GET /api/anonymous/session — remaining free messages for this session */
export async function GET(): Promise<NextResponse> {
  const jar = await cookies()
  const fingerprint = jar.get(ANON_SESSION_COOKIE)?.value

  if (!fingerprint) {
    return NextResponse.json({
      data: { remaining: ANON_MESSAGE_LIMIT, messageCount: 0 },
    })
  }

  const { data } = await supabaseAdmin
    .from('anonymous_sessions')
    .select('message_count')
    .eq('fingerprint', fingerprint)
    .single()

  const messageCount = Number(data?.message_count ?? 0)
  const remaining = Math.max(0, ANON_MESSAGE_LIMIT - messageCount)

  return NextResponse.json({ data: { remaining, messageCount } })
}

export async function POST(): Promise<NextResponse> {
  const jar = await cookies()
  const existingFingerprint = jar.get(ANON_SESSION_COOKIE)?.value

  if (existingFingerprint) {
    const { data: existing } = await supabaseAdmin
      .from('anonymous_sessions')
      .select('*')
      .eq('fingerprint', existingFingerprint)
      .single()

    if (existing) {
      return NextResponse.json({ session: existing })
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
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 },
    )
  }

  jar.set(ANON_SESSION_COOKIE, fingerprint, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: ANON_COOKIE_MAX_AGE,
  })

  return NextResponse.json({ session: created }, { status: 201 })
}
