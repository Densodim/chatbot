import { type NextRequest, NextResponse } from 'next/server'

const ACCESS_TOKEN_COOKIE = 'sb-access-token'
const ANON_SESSION_COOKIE = 'anon_session_id'

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

export function proxy(request: NextRequest): NextResponse {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const anonSessionId = request.cookies.get(ANON_SESSION_COOKIE)?.value
  const userId = accessToken ? extractUserId(accessToken) : null
  const { pathname } = request.nextUrl

  // Forward verified identity to downstream API route handlers via headers.
  const forwardedHeaders = new Headers(request.headers)
  if (userId) {
    forwardedHeaders.set('x-user-id', userId)
  } else if (anonSessionId) {
    forwardedHeaders.set('x-anon-session-id', anonSessionId)
  }

  // /api/chats/* — authenticated users only.
  if (pathname.startsWith('/api/chats/') && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // /api/messages/* — authenticated OR anonymous session required.
  // Actual message-count limit is enforced in the route handler.
  if (pathname.startsWith('/api/messages/') && !userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next({ request: { headers: forwardedHeaders } })
}

export const config = {
  matcher: ['/api/chats/:path*', '/api/messages/:path*'],
}
