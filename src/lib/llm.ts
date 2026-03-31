import 'server-only'
import Groq from 'groq-sdk'
import OpenAI from 'openai'

let openai: OpenAI | undefined
let groq: Groq | undefined

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing required environment variable: OPENAI_API_KEY')
  }

  openai ??= new OpenAI({ apiKey })
  return openai
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('Missing required environment variable: GROQ_API_KEY')
  }

  groq ??= new Groq({ apiKey })
  return groq
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
      try {
        // Try Groq first (free and fast)
        const groq = getGroqClient()
        const groqModel = model.includes('gpt-4')
          ? 'llama-3.1-70b-versatile'
          : 'llama-3.1-8b-instant'

        const completion = await groq.chat.completions.create({
          model: groqModel,
          messages: messages as any,
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
      } catch (groqError) {
        console.warn('Groq API failed, trying OpenAI:', groqError)
        // Fallback to OpenAI
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
      }
    },
  })
}
