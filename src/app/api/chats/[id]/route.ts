import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { removeAttachmentStorageObjects } from '@/lib/attachment-storage'
import { supabaseAdmin } from '@/lib/supabase'
import type { Chat, ChatUpdate } from '@/types/db'

type RouteContext = { params: Promise<{ id: string }> }

function canAccessChat(
  chat: Pick<Chat, 'user_id' | 'anonymous_session_fingerprint'>,
  userId: string | null,
  anonSessionId: string | null,
): boolean {
  if (userId) {
    return chat.user_id === userId
  }

  return (
    chat.user_id === null &&
    anonSessionId !== null &&
    chat.anonymous_session_fingerprint === anonSessionId
  )
}

/** Returns the chat only if it belongs to the current actor; null otherwise. */
async function getOwnedChat(
  chatId: string,
  userId: string | null,
  anonSessionId: string | null,
) {
  const { data } = await supabaseAdmin
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (!data || !canAccessChat(data as Chat, userId, anonSessionId)) {
    return null
  }

  return data
}

/** GET /api/chats/:id — fetch a single chat */
export async function GET(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const anonSessionId = request.headers.get('x-anon-session-id')
  if (!userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const chat = await getOwnedChat(id, userId, anonSessionId)

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
  const anonSessionId = request.headers.get('x-anon-session-id')
  if (!userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const chat = await getOwnedChat(id, userId, anonSessionId)

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
  const anonSessionId = request.headers.get('x-anon-session-id')
  if (!userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const chat = await getOwnedChat(id, userId, anonSessionId)

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: attachments, error: attachmentsError } = await supabaseAdmin
    .from('attachments')
    .select('storage_path')
    .eq('chat_id', id)

  if (attachmentsError) {
    return NextResponse.json(
      { error: attachmentsError.message },
      { status: 500 },
    )
  }

  const storageError = await removeAttachmentStorageObjects(
    (attachments ?? []).map(attachment => String(attachment.storage_path)),
  )

  if (storageError) {
    return NextResponse.json({ error: storageError }, { status: 500 })
  }

  const { error } = await supabaseAdmin.from('chats').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id } })
}
