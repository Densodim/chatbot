import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { type LlmMessage, streamChatCompletion } from '@/lib/llm'
import { supabaseAdmin } from '@/lib/supabase'
import type { Message, MessageInsert } from '@/types/db'

type RouteContext = { params: Promise<{ id: string }> }

const SYSTEM_PROMPT = 'You are a helpful AI assistant.'

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Content-Type-Options': 'nosniff',
} as const

/** GET /api/chats/:id/messages — all messages in a chat, ordered by creation time */
export async function GET(
  request: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: chatId } = await ctx.params

  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single()

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

/**
 * POST /api/chats/:id/messages
 * Saves the user message, creates an assistant placeholder, then streams
 * the LLM response. The placeholder is updated with full content on stream end.
 * Returns a raw ReadableStream — use `new Response(stream)` not NextResponse.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: chatId } = await ctx.params

  const { data: chat } = await supabaseAdmin
    .from('chats')
    .select('id, model')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single()

  if (!chat) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await request.json()) as { content?: string }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }

  const content = body.content.trim()

  // Load prior history before inserting the new message.
  const { data: priorHistory } = await supabaseAdmin
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at')

  // Save user message.
  const userInsert: MessageInsert = { chat_id: chatId, role: 'user', content }
  await supabaseAdmin.from('messages').insert(userInsert)

  // Create empty assistant placeholder row.
  const assistantInsert: MessageInsert = {
    chat_id: chatId,
    role: 'assistant',
    content: '',
  }
  const { data: assistantMsg } = await supabaseAdmin
    .from('messages')
    .insert(assistantInsert)
    .select('id')
    .single()

  if (!assistantMsg) {
    return NextResponse.json(
      { error: 'Failed to prepare response' },
      { status: 500 },
    )
  }

  const assistantId = String(assistantMsg.id)
  const chatModel = String(chat.model)

  const historyRows = (priorHistory ?? []) as Pick<
    Message,
    'role' | 'content'
  >[]
  const llmMessages: LlmMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historyRows.map(m => ({
      role: m.role as LlmMessage['role'],
      content: m.content ?? '',
    })),
    { role: 'user', content },
  ]

  const stream = streamChatCompletion(
    llmMessages,
    chatModel,
    async fullContent => {
      await Promise.all([
        supabaseAdmin
          .from('messages')
          .update({ content: fullContent })
          .eq('id', assistantId),
        supabaseAdmin
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId),
      ])
    },
  )

  return new Response(stream, { headers: STREAM_HEADERS })
}
