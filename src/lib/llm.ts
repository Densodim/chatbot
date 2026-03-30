import 'server-only'
import OpenAI from 'openai'

let openai: OpenAI | undefined

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY')
  }

  openai ??= new OpenAI({ apiKey })
  return openai
}

// Cached at module level — TextEncoder is reused across calls.
const TEXT_ENCODER = new TextEncoder()

export type LlmContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export type LlmMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string | LlmContentPart[]
}

type StreamCallbacks = {
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => Promise<void> | void
}

/**
 * Creates a ReadableStream that streams OpenAI completion tokens to the client.
 * `onComplete` is called with the full accumulated text after the stream closes —
 * use it to persist the assistant message content to the database.
 */
export function streamChatCompletion(
  messages: LlmMessage[],
  model: string,
  callbacks: StreamCallbacks = {},
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const openai = getOpenAIClient()
      const completion = await openai.chat.completions.create({
        model,
        messages:
          messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        stream: true,
      })
      let fullContent = ''
      for await (const chunk of completion) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          fullContent += text
          callbacks.onChunk?.(text)
          controller.enqueue(TEXT_ENCODER.encode(text))
        }
      }
      controller.close()
      await callbacks.onComplete?.(fullContent)
    },
  })
}
