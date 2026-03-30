'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Dispatch, SetStateAction } from 'react'
import { startTransition, useCallback, useState } from 'react'
import { publishRealtimeEvent } from '@/lib/supabase-realtime'
import type { ChatMessage, SendMessageInput } from '@/types/chat'

type MessagesResponse = {
  data: ChatMessage[]
}

type ApiErrorResponse = {
  error?: string
}

async function fetchMessages(chatId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/chats/${chatId}/messages`)
  if (!res.ok) {
    throw new Error('Failed to fetch messages')
  }

  const json = (await res.json()) as MessagesResponse
  return json.data
}

async function getSendErrorMessage(response: Response): Promise<string> {
  const json = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | null
  return json?.error ?? 'Failed to send message'
}

function appendStreamingChunk(
  setStreamingMessage: Dispatch<SetStateAction<string>>,
  chunk: string,
): void {
  if (!chunk) {
    return
  }

  startTransition(() => {
    setStreamingMessage(previous => `${previous}${chunk}`)
  })
}

async function readStreamingResponse(
  response: Response,
  setStreamingMessage: Dispatch<SetStateAction<string>>,
): Promise<void> {
  if (!response.body) {
    throw new Error('Streaming response body is missing')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  async function readNextChunk(): Promise<void> {
    const { done, value } = await reader.read()
    if (done) {
      appendStreamingChunk(setStreamingMessage, decoder.decode())
      return
    }

    appendStreamingChunk(
      setStreamingMessage,
      decoder.decode(value, { stream: true }),
    )
    await readNextChunk()
  }

  await readNextChunk()
}

export function useChat(chatId: string | null, userId: string | null = null) {
  const queryClient = useQueryClient()
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const messagesQuery = useQuery({
    queryKey: ['chat', chatId, 'messages'],
    queryFn: () => fetchMessages(chatId as string),
    enabled: chatId !== null,
  })

  const sendMessage = useCallback(
    async ({ content, attachmentIds }: SendMessageInput): Promise<void> => {
      if (!chatId) {
        throw new Error('chatId is required')
      }

      setIsSending(true)
      setStreamingMessage('')

      try {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, attachmentIds }),
        })

        if (!response.ok) {
          throw new Error(await getSendErrorMessage(response))
        }

        await readStreamingResponse(response, setStreamingMessage)
      } finally {
        setIsSending(false)
        await queryClient.invalidateQueries({
          queryKey: ['chat', chatId, 'messages'],
        })
        await queryClient.invalidateQueries({
          queryKey: ['chats'],
        })
        if (userId) {
          publishRealtimeEvent({
            type: 'message-created',
            userId,
            chatId,
          })
        }
      }
    },
    [chatId, queryClient, userId],
  )

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    isFetching: messagesQuery.isFetching,
    isSending,
    streamingMessage,
    sendMessage,
    refetchMessages: messagesQuery.refetch,
  }
}
