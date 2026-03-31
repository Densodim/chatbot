import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  ANON_MESSAGE_LIMIT,
  getAnonymousSessionByFingerprint,
} from '@/lib/anonymous-session'
import { isImageMimeType, truncateDocumentContext } from '@/lib/attachments'
import {
  type LlmContentPart,
  type LlmMessage,
  streamChatCompletion,
} from '@/lib/llm'
import { supabaseAdmin } from '@/lib/supabase'
import type { ChatMessage } from '@/types/chat'
import type { Attachment, Chat, Message } from '@/types/db'

type RouteContext = { params: Promise<{ id: string }> }

type SendMessageBody = {
  content?: string
  attachmentIds?: string[]
}

type OwnedChat = {
  id: string
  model: string
  user_id: string | null
  anonymous_session_fingerprint: string | null
}

type MessageContextResult = {
  priorHistory: Pick<Message, 'role' | 'content'>[]
  pendingAttachments: Attachment[]
  error: string | null
}

type PreparedMessagesResult = {
  userMessageId: string | null
  assistantMessageId: string | null
  error: string | null
}

const SYSTEM_PROMPT = 'You are a helpful AI assistant.'
const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Content-Type-Options': 'nosniff',
} as const
const SIGNED_URL_TTL_SECONDS = 60 * 60
const SUPPORTED_MODELS = new Set([
  'gpt-4o',
  'gpt-3.5-turbo',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
])

function normalizeRequestedAttachmentIds(ids: string[] | undefined): string[] {
  if (!ids) {
    return []
  }

  return [...new Set(ids.filter(id => id.trim().length > 0))]
}

function resolveChatModel(model: string, hasImages: boolean): string {
  if (hasImages) {
    return 'gpt-4o'
  }

  // Map old decommissioned models to new equivalents
  if (model === 'llama-3.1-70b-versatile') {
    return 'llama-3.3-70b-versatile'
  }

  if (model === 'llama-3.1-8b-instant' || model === 'llama-3.3-70b-versatile') {
    return model
  }

  return SUPPORTED_MODELS.has(model) ? model : 'llama-3.1-8b-instant'
}

async function getOwnedChat(
  chatId: string,
  userId: string | null,
  anonSessionId: string | null,
): Promise<OwnedChat | null> {
  const { data } = await supabaseAdmin
    .from('chats')
    .select('id, model, user_id, anonymous_session_fingerprint')
    .eq('id', chatId)
    .single()

  if (!data) {
    return null
  }

  const chat = data as Chat
  const canAccess =
    userId === null
      ? chat.user_id === null &&
        anonSessionId !== null &&
        chat.anonymous_session_fingerprint === anonSessionId
      : chat.user_id === userId

  if (!canAccess) {
    return null
  }

  return data as OwnedChat
}

function buildSystemPrompt(attachments: Attachment[]): string {
  const documentContext = attachments
    .map(attachment => attachment.extracted_text?.trim() ?? '')
    .filter(text => text.length > 0)
    .map(
      (text, index) =>
        `Document ${index + 1} context:\n${truncateDocumentContext(text)}`,
    )
    .join('\n\n')

  if (!documentContext) {
    return SYSTEM_PROMPT
  }

  return `${SYSTEM_PROMPT}\n\nUse the following document as context:\n${documentContext}`
}

async function buildCurrentUserMessage(
  content: string,
  attachments: Attachment[],
): Promise<LlmMessage> {
  const imageAttachments = attachments.filter(attachment =>
    isImageMimeType(attachment.mime_type),
  )
  const imageParts = await Promise.all(
    imageAttachments.map(async attachment => {
      const { data, error } = await supabaseAdmin.storage
        .from('attachments')
        .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS)

      if (error) {
        throw new Error(error.message)
      }

      return {
        type: 'image_url',
        image_url: { url: data.signedUrl },
      } satisfies LlmContentPart
    }),
  )

  if (imageParts.length === 0) {
    return { role: 'user', content }
  }

  const contentParts: LlmContentPart[] = []
  if (content) {
    contentParts.push({ type: 'text', text: content })
  }

  return {
    role: 'user',
    content: [...contentParts, ...imageParts],
  }
}

async function getSignedPreviewUrls(
  attachments: Attachment[],
): Promise<Map<string, string | null>> {
  const imageAttachments = attachments.filter(
    attachment =>
      attachment.message_id !== null && isImageMimeType(attachment.mime_type),
  )

  const signedUrlPairs = await Promise.all(
    imageAttachments.map(async attachment => {
      const { data, error } = await supabaseAdmin.storage
        .from('attachments')
        .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS)

      return [attachment.id, error ? null : data.signedUrl] as const
    }),
  )

  return new Map(signedUrlPairs)
}

async function loadMessageContext(
  chatId: string,
  attachmentIds: string[],
): Promise<MessageContextResult> {
  const priorHistoryPromise = supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at')
  const attachmentsPromise =
    attachmentIds.length === 0
      ? Promise.resolve({ data: [] as Attachment[], error: null })
      : supabaseAdmin
          .from('attachments')
          .select('*')
          .in('id', attachmentIds)
          .eq('chat_id', chatId)
          .is('message_id', null)
          .order('created_at')

  const [
    { data: priorHistory, error: priorHistoryError },
    { data: pendingAttachments, error: pendingAttachmentsError },
  ] = await Promise.all([priorHistoryPromise, attachmentsPromise])

  return {
    priorHistory: (priorHistory ?? []) as Pick<Message, 'role' | 'content'>[],
    pendingAttachments: (pendingAttachments ?? []) as Attachment[],
    error:
      priorHistoryError?.message ?? pendingAttachmentsError?.message ?? null,
  }
}

async function createPreparedMessages(
  chatId: string,
  content: string,
): Promise<PreparedMessagesResult> {
  const userMessagePromise = supabaseAdmin
    .from('messages')
    .insert({ chat_id: chatId, role: 'user', content })
    .select('id')
    .single()
  const assistantMessagePromise = supabaseAdmin
    .from('messages')
    .insert({ chat_id: chatId, role: 'assistant', content: '' })
    .select('id')
    .single()

  const [
    { data: userMessage, error: userMessageError },
    { data: assistantMessage, error: assistantMessageError },
  ] = await Promise.all([userMessagePromise, assistantMessagePromise])

  return {
    userMessageId: userMessage?.id ?? null,
    assistantMessageId: assistantMessage?.id ?? null,
    error: userMessageError?.message ?? assistantMessageError?.message ?? null,
  }
}

async function linkAttachmentsToMessage(
  attachments: Attachment[],
  userMessageId: string,
): Promise<string | null> {
  if (attachments.length === 0) {
    return null
  }

  const { error } = await supabaseAdmin
    .from('attachments')
    .update({ message_id: userMessageId })
    .in(
      'id',
      attachments.map(attachment => attachment.id),
    )

  return error?.message ?? null
}

function buildLlmHistory(
  priorHistory: Pick<Message, 'role' | 'content'>[],
): LlmMessage[] {
  return priorHistory.map(message => ({
    role: message.role as LlmMessage['role'],
    content: message.content ?? '',
  }))
}

/** GET /api/chats/:id/messages — all messages in a chat, ordered by creation time */
export async function GET(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  const anonSessionId = request.headers.get('x-anon-session-id')

  if (!userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: chatId } = await ctx.params
  const chat = await getOwnedChat(chatId, userId, anonSessionId)

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const messagesPromise = supabaseAdmin
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at')
  const attachmentsPromise = supabaseAdmin
    .from('attachments')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at')

  const [
    { data: messages, error: messagesError },
    { data: attachments, error: attachmentsError },
  ] = await Promise.all([messagesPromise, attachmentsPromise])

  if (messagesError || attachmentsError) {
    return NextResponse.json(
      {
        error:
          messagesError?.message ??
          attachmentsError?.message ??
          'Failed to fetch messages',
      },
      { status: 500 },
    )
  }

  const typedMessages = (messages ?? []) as Message[]
  const typedAttachments = (attachments ?? []) as Attachment[]
  const previewUrls = await getSignedPreviewUrls(typedAttachments)
  const attachmentsByMessageId = new Map<string, ChatMessage['attachments']>()

  for (const attachment of typedAttachments) {
    if (!attachment.message_id) {
      continue
    }

    const current = attachmentsByMessageId.get(attachment.message_id) ?? []
    current.push({
      ...attachment,
      preview_url: previewUrls.get(attachment.id) ?? null,
    })
    attachmentsByMessageId.set(attachment.message_id, current)
  }

  return NextResponse.json({
    data: typedMessages.map(message => ({
      ...message,
      attachments: attachmentsByMessageId.get(message.id) ?? [],
    })),
  })
}

/**
 * POST /api/chats/:id/messages
 * Saves the user message, links any pending attachments, creates an assistant
 * placeholder, then streams the LLM response.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const userId = request.headers.get('x-user-id')
  const anonSessionId = request.headers.get('x-anon-session-id')

  if (!userId && !anonSessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: chatId } = await ctx.params
  const chat = await getOwnedChat(chatId, userId, anonSessionId)

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const anonymousSession =
    userId || !anonSessionId
      ? null
      : await getAnonymousSessionByFingerprint(anonSessionId)

  if (anonSessionId && !anonymousSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (
    anonymousSession &&
    Number(anonymousSession.message_count) >= ANON_MESSAGE_LIMIT
  ) {
    return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
  }

  const body = (await request.json()) as SendMessageBody
  const content = body.content?.trim() ?? ''
  const attachmentIds = normalizeRequestedAttachmentIds(body.attachmentIds)

  if (!content && attachmentIds.length === 0) {
    return NextResponse.json(
      { error: 'content or attachmentIds required' },
      { status: 400 },
    )
  }

  const {
    priorHistory,
    pendingAttachments,
    error: contextError,
  } = await loadMessageContext(chatId, attachmentIds)

  if (contextError) {
    return NextResponse.json({ error: contextError }, { status: 500 })
  }

  if (pendingAttachments.length !== attachmentIds.length) {
    const foundIds = pendingAttachments.map(a => a.id)
    const missingIds = attachmentIds.filter(id => !foundIds.includes(id))
    return NextResponse.json(
      { 
        error: 'Some attachments are missing or already linked',
        debug: {
          requestedCount: attachmentIds.length,
          foundCount: pendingAttachments.length,
          requestedIds: attachmentIds,
          foundIds,
          missingIds,
        }
      },
      { status: 400 },
    )
  }

  const [
    { userMessageId, assistantMessageId, error: preparationError },
    currentUserMessage,
  ] = await Promise.all([
    createPreparedMessages(chatId, content),
    buildCurrentUserMessage(content, pendingAttachments),
  ])

  if (preparationError || !userMessageId || !assistantMessageId) {
    return NextResponse.json(
      { error: preparationError ?? 'Failed to prepare response' },
      { status: 500 },
    )
  }

  const attachmentLinkError = await linkAttachmentsToMessage(
    pendingAttachments,
    userMessageId,
  )

  if (attachmentLinkError) {
    return NextResponse.json({ error: attachmentLinkError }, { status: 500 })
  }

  const hasImages = pendingAttachments.some(attachment =>
    isImageMimeType(attachment.mime_type),
  )
  const llmMessages: LlmMessage[] = [
    { role: 'system', content: buildSystemPrompt(pendingAttachments) },
    ...buildLlmHistory(priorHistory),
    currentUserMessage,
  ]

  const stream = streamChatCompletion(
    llmMessages,
    resolveChatModel(chat.model, hasImages),
    {
      onComplete: async fullContent => {
        const updates = [
          supabaseAdmin
            .from('messages')
            .update({ content: fullContent })
            .eq('id', assistantMessageId),
          supabaseAdmin
            .from('chats')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', chatId),
        ]

        if (anonymousSession) {
          updates.push(
            supabaseAdmin
              .from('anonymous_sessions')
              .update({
                message_count: Math.min(
                  ANON_MESSAGE_LIMIT,
                  Number(anonymousSession.message_count) + 1,
                ),
              })
              .eq('fingerprint', anonymousSession.fingerprint),
          )
        }

        await Promise.all(updates)
      },
    },
  )

  return new Response(stream, { headers: STREAM_HEADERS })
}
