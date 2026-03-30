import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { removeAttachmentStorageObjects } from '@/lib/attachment-storage'
import { supabaseAdmin } from '@/lib/supabase'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * DELETE /api/attachments/:id
 * Verifies ownership via attachment.chat_id → chat.user_id,
 * then removes the file from storage and deletes the DB record.
 */
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

  const { data: attachment } = await supabaseAdmin
    .from('attachments')
    .select('id, storage_path, chat_id')
    .eq('id', id)
    .single()

  if (!attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('id, user_id, anonymous_session_fingerprint')
    .eq('id', attachment.chat_id)
    .single()

  const hasAccess =
    userId !== null
      ? chat?.user_id === userId
      : chat?.user_id === null &&
        chat?.anonymous_session_fingerprint === anonSessionId

  if (!chat || !hasAccess) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const storageError = await removeAttachmentStorageObjects([
    String(attachment.storage_path),
  ])

  if (storageError) {
    return NextResponse.json({ error: storageError }, { status: 500 })
  }

  const { error } = await supabaseAdmin
    .from('attachments')
    .delete()
    .eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id } })
}
