import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

type RouteContext = { params: Promise<{ id: string }> }

const STORAGE_BUCKET = 'attachments'

/**
 * DELETE /api/attachments/:id
 * Verifies ownership via attachment → message → chat → user_id chain,
 * then removes the file from storage and deletes the DB record.
 */
export async function DELETE(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  const { data: attachment } = await supabaseAdmin
    .from('attachments')
    .select('id, storage_path, message_id')
    .eq('id', id)
    .single()

  if (!attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Resolve ownership: attachment → message → chat → user_id
  const { data: message } = await supabaseAdmin
    .from('messages')
    .select('chat_id')
    .eq('id', attachment.message_id)
    .single()

  if (!message) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('id', message.chat_id)
    .eq('user_id', userId)
    .single()

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Remove from storage first, then delete the DB record.
  await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([String(attachment.storage_path)])

  const { error } = await supabaseAdmin
    .from('attachments')
    .delete()
    .eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { id } })
}
