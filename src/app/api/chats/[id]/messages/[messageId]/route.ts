import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { removeAttachmentStorageObjects } from '@/lib/attachment-storage'
import { supabaseAdmin } from '@/lib/supabase'
import type { Chat } from '@/types/db'

type RouteContext = {
  params: Promise<{ id: string; messageId: string }>
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const anonSessionId = request.headers.get('x-anon-session-id')

  if (!userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: chatId, messageId } = await ctx.params

  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('id, user_id, anonymous_session_fingerprint')
    .eq('id', chatId)
    .single()

  const typedChat = chat as Chat | null
  const canAccess =
    typedChat &&
    (userId
      ? typedChat.user_id === userId
      : typedChat.user_id === null &&
        anonSessionId !== null &&
        typedChat.anonymous_session_fingerprint === anonSessionId)

  if (!canAccess) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: message } = await supabaseAdmin
    .from('messages')
    .select('id')
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .single()

  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: attachments, error: attachmentsError } = await supabaseAdmin
    .from('attachments')
    .select('storage_path')
    .eq('message_id', messageId)

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

  const { error } = await supabaseAdmin
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('chat_id', chatId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id: messageId } })
}
