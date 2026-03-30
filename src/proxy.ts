import { type NextRequest, NextResponse } from 'next/server'
import { ANON_MESSAGE_LIMIT } from '@/lib/anonymous-session'
import { supabaseAdmin } from '@/lib/supabase'

const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const ANON_SESSION_COOKIE = 'anon_session_id'
const CHAT_MESSAGES_PATH_RE = /^\/api\/chats\/[^/]+\/messages$/

// Hoisted RegExp literals (useTopLevelRegex)
const BASE64URL_PLUS_RE = /-/g
const BASE64URL_SLASH_RE = /_/g

type JwtPayload = {
  sub?: string
  exp?: number
}

/**
 * Decodes the payload of a base64url-encoded JWT without cryptographic
 * verification. Used only for routing decisions — API routes re-verify
 * with supabaseAdmin.auth.getUser().
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }
  try {
    const segment = parts[1]
    const b64 = segment
      .replace(BASE64URL_PLUS_RE, '+')
      .replace(BASE64URL_SLASH_RE, '/')
    const mod = b64.length % 4
    const padded = mod > 0 ? `${b64}${'='.repeat(4 - mod)}` : b64
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

function extractUserId(token: string): string | null {
  const payload = decodeJwtPayload(token)
  if (!payload?.sub || !payload.exp) {
    return null
  }
  // Reject tokens within 10 s of expiry to account for clock skew.
  if (Date.now() / 1000 > payload.exp - 10) {
    return null
  }
  return payload.sub
}

function isAnonymousMessagePost(
  request: NextRequest,
  userId: string | null,
  anonSessionId: string | null,
): boolean {
  return (
    request.method === 'POST' &&
    userId === null &&
    anonSessionId !== null &&
    CHAT_MESSAGES_PATH_RE.test(request.nextUrl.pathname)
  )
}

async function isAnonymousLimitReached(anonSessionId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('anonymous_sessions')
    .select('message_count')
    .eq('fingerprint', anonSessionId)
    .single()

  return Number(data?.message_count ?? 0) >= ANON_MESSAGE_LIMIT
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null
  const anonSessionId =
    request.cookies.get(ANON_SESSION_COOKIE)?.value ?? null
  const userId = accessToken ? extractUserId(accessToken) : null

  if (isAnonymousMessagePost(request, userId, anonSessionId)) {
    const hasReachedLimit = await isAnonymousLimitReached(
      anonSessionId as string,
    )

    if (hasReachedLimit) {
      return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
    }
  }

  // Forward verified identity to downstream API route handlers via headers.
  const forwardedHeaders = new Headers(request.headers)
  if (userId) {
    forwardedHeaders.set('x-user-id', userId)
  } else if (anonSessionId) {
    forwardedHeaders.set('x-anon-session-id', anonSessionId)
  }

  return NextResponse.next({ request: { headers: forwardedHeaders } })
}

export const config = {
  matcher: ['/api/chats/:path*', '/api/messages/:path*', '/api/attachments/:path*'],
}
