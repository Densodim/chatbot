import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  extractAttachmentText,
  isSupportedAttachmentMimeType,
} from '@/lib/attachments'
import { supabaseAdmin } from '@/lib/supabase'
import type { AttachmentInsert } from '@/types/db'

const STORAGE_BUCKET = 'attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const SIGNED_URL_TTL_SECONDS = 60 * 60

/**
 * POST /api/attachments/upload
 * Accepts multipart/form-data with `file` and `chatId`.
 * Uploads to Supabase Storage, extracts document text when relevant, and
 * creates a pending attachment record that will later be linked to a message.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const anonSessionId = request.headers.get('x-anon-session-id')
  if (!userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const chatId = formData.get('chatId')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 })
  }

  if (typeof chatId !== 'string' || !chatId.trim()) {
    return NextResponse.json(
      { error: 'chatId field required' },
      { status: 400 },
    )
  }

  if (!isSupportedAttachmentMimeType(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 400 },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)` },
      { status: 400 },
    )
  }

  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('id, user_id, anonymous_session_fingerprint')
    .eq('id', chatId)
    .single()

  const hasAccess =
    userId === null
      ? chat?.user_id === null &&
        chat?.anonymous_session_fingerprint === anonSessionId
      : chat?.user_id === userId

  if (!chat || !hasAccess) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const ownerKey = userId ?? anonSessionId
  const storagePath = `${ownerKey}/${chatId}/${crypto.randomUUID()}-${file.name}`
  const bufferPromise = file.arrayBuffer()
  const extractedTextPromise = extractAttachmentText(file)
  const buffer = await bufferPromise

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const extractedText = await extractedTextPromise

  const insert: AttachmentInsert = {
    chat_id: chat.id,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    extracted_text: extractedText || null,
  }

  const { data: attachment, error: insertError } = await supabaseAdmin
    .from('attachments')
    .insert(insert)
    .select('*')
    .single()

  if (insertError || !attachment) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([storagePath])
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create attachment record' },
      { status: 500 },
    )
  }

  const { data: signedUrlData, error: signedUrlError } =
    await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      data: {
        ...attachment,
        storagePath,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        previewUrl: signedUrlData.signedUrl,
      },
    },
    { status: 201 },
  )
}
