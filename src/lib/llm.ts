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
 * Groq API requires string content, not array format.
 * Convert content parts to simple string for Groq compatibility.
 */
function normalizeForGroq(messages: LlmMessage[]): Array<{
  role: 'user' | 'assistant' | 'system'
  content: string
}> {
  return messages.map(msg => ({
    role: msg.role,
    content:
      typeof msg.content === 'string'
        ? msg.content
        : msg.content
            .map(part => (part.type === 'text' ? part.text : '[image]'))
            .join('\n'),
  }))
}

/**
 * Creates a ReadableStream that streams LLM completion tokens to the client.
 * Uses OpenAI GPT-4 Vision for images/documents, falls back to Groq for text-only.
 */
export function streamChatCompletion(
  messages: LlmMessage[],
  model: string,
  callbacks: StreamCallbacks = {},
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // Check if any message contains images
      const hasImages = messages.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(part => part.type === 'image_url')
      )

      let fullContent = ''

      try {
        if (hasImages && process.env.OPENAI_API_KEY) {
          // Use OpenAI GPT-4 Vision for images
          const openai = getOpenAIClient()
          const openaiModel = model.includes('gpt-4') ? 'gpt-4o' : 'gpt-4o-mini'
          
          const completion = await openai.chat.completions.create({
            model: openaiModel,
            messages: messages as any, // OpenAI supports array format
            stream: true,
            max_tokens: 4000,
          })

          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullContent += text
              callbacks.onChunk?.(text)
              controller.enqueue(TEXT_ENCODER.encode(text))
            }
          }
        } else {
          // Use Groq for text-only or fallback
          const groq = getGroqClient()
          const groqModel = model.includes('gpt-4')
            ? 'llama-3.3-70b-versatile'
            : 'llama-3.1-8b-instant'

          const completion = await groq.chat.completions.create({
            model: groqModel,
            messages: normalizeForGroq(messages),
            stream: true,
          })

          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullContent += text
              callbacks.onChunk?.(text)
              controller.enqueue(TEXT_ENCODER.encode(text))
            }
          }
        }
      } catch (error) {
        // Fallback to Groq if OpenAI fails
        try {
          const groq = getGroqClient()
          const groqModel = 'llama-3.1-8b-instant'

          const completion = await groq.chat.completions.create({
            model: groqModel,
            messages: normalizeForGroq(messages),
            stream: true,
          })

          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) {
              fullContent += text
              callbacks.onChunk?.(text)
              controller.enqueue(TEXT_ENCODER.encode(text))
            }
          }
        } catch (fallbackError) {
          controller.error(fallbackError)
          return
        }
      }

      controller.close()
      await callbacks.onComplete?.(fullContent)
    },
  })
}
