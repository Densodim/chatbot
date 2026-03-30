import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getOrCreateAnonymousSession } from '@/lib/anonymous-session'
import { supabaseAdmin } from '@/lib/supabase'
import type { ChatInsert } from '@/types/db'

/** GET /api/chats — list all chats for the authenticated user, newest first */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const anonSessionId = request.headers.get('x-anon-session-id')

  if (!userId && !anonSessionId) {
    return NextResponse.json({ data: [] })
  }

  const query = supabaseAdmin
    .from('chats')
    .select(
      'id, user_id, anonymous_session_fingerprint, title, model, created_at, updated_at',
    )
    .order('updated_at', { ascending: false })

  if (userId) {
    query.eq('user_id', userId)
  } else {
    query.is('user_id', null).eq('anonymous_session_fingerprint', anonSessionId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

/** POST /api/chats — create a new chat for the authenticated user   */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const body = (await request.json()) as { title?: string; model?: string }
  const anonymousSession = userId ? null : await getOrCreateAnonymousSession()

  const insert: ChatInsert = {
    user_id: userId,
    anonymous_session_fingerprint: anonymousSession?.fingerprint ?? null,
    title: body.title ?? 'New Chat',
    model: body.model ?? 'llama-3.1-8b-instant',
  }

  const { data, error } = await supabaseAdmin
    .from('chats')
    .insert(insert)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create chat' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data }, { status: 201 })
}
