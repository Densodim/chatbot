import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { ChatUpdate } from '@/types/db'

type RouteContext = { params: Promise<{ id: string }> }

/** Returns the chat only if it belongs to the given user; null otherwise. */
async function getOwnedChat(chatId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single()
  return data
}

/** GET /api/chats/:id — fetch a single chat */
export async function GET(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const chat = await getOwnedChat(id, userId)

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ data: chat })
}

/** PATCH /api/chats/:id — update chat title and/or model */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const chat = await getOwnedChat(id, userId)

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await request.json()) as { title?: string; model?: string }
  if (!body.title && !body.model) {
    return NextResponse.json(
      { error: 'title or model required' },
      { status: 400 },
    )
  }

  const chatUpdate: ChatUpdate = {}
  if (body.title) {
    chatUpdate.title = body.title
  }
  if (body.model) {
    chatUpdate.model = body.model
  }

  const { data, error } = await supabaseAdmin
    .from('chats')
    .update(chatUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update chat' },
      { status: 500 },
    )
  }

  return NextResponse.json({ data })
}

/** DELETE /api/chats/:id — delete chat and all its messages (cascade in DB) */
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const chat = await getOwnedChat(id, userId)

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin.from('chats').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id } })
}
