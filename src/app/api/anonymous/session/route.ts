import { NextResponse } from 'next/server'
import {
  ANON_MESSAGE_LIMIT,
  getAnonymousFingerprintFromCookies,
  getAnonymousSessionByFingerprint,
  getOrCreateAnonymousSession,
  getRemainingAnonymousMessages,
} from '@/lib/anonymous-session'

/** GET /api/anonymous/session — remaining free messages for this session */
export async function GET(): Promise<NextResponse> {
  const fingerprint = await getAnonymousFingerprintFromCookies()

  if (!fingerprint) {
    return NextResponse.json({
      data: { remaining: ANON_MESSAGE_LIMIT, messageCount: 0, total: 3 },
    })
  }

  const session = await getAnonymousSessionByFingerprint(fingerprint)
  const messageCount = Number(session?.message_count ?? 0)
  const remaining = getRemainingAnonymousMessages(messageCount)

  return NextResponse.json({ data: { remaining, messageCount, total: 3 } })
}

export async function POST(): Promise<NextResponse> {
  const existingFingerprint = await getAnonymousFingerprintFromCookies()
  const existing = existingFingerprint
    ? await getAnonymousSessionByFingerprint(existingFingerprint)
    : null

  if (existing) {
    return NextResponse.json({ session: existing })
  }

  try {
    const session = await getOrCreateAnonymousSession()
    return NextResponse.json({ session }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 },
    )
  }
}
