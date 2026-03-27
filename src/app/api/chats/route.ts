import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { ChatInsert } from '@/types/db'

/** GET /api/chats — list all chats for the authenticated user, newest first */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('chats')
    .select('id, title, model, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

/** POST /api/chats — create a new chat for the authenticated user */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { title?: string; model?: string }

  const insert: ChatInsert = {
    user_id: userId,
    title: body.title ?? 'New Chat',
    model: body.model ?? 'gpt-4o-mini',
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
