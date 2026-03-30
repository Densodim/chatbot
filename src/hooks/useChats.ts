'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { publishRealtimeEvent } from '@/lib/supabase-realtime'
import type { Chat } from '@/types/db'

type ChatsResponse = {
  data: Chat[]
}

type ApiErrorResponse = {
  error?: string
}

export type ChatSummary = Pick<
  Chat,
  'id' | 'user_id' | 'title' | 'model' | 'created_at' | 'updated_at'
>

const CHATS_QUERY_KEY = ['chats'] as const

async function parseApiError(response: Response): Promise<string> {
  const json = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | null

  return json?.error ?? 'Request failed'
}

async function fetchChats(): Promise<ChatSummary[]> {
  const response = await fetch('/api/chats')

  if (response.status === 401) {
    return []
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  const json = (await response.json()) as ChatsResponse
  return json.data
}

async function createChatRequest(): Promise<ChatSummary> {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New Chat' }),
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  const json = (await response.json()) as { data: ChatSummary }
  return json.data
}

async function deleteChatRequest(chatId: string): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }
}

export function useChats(enabled = true) {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)

  const chatsQuery = useQuery({
    queryKey: CHATS_QUERY_KEY,
    queryFn: fetchChats,
    enabled,
  })
  const chats = chatsQuery.data ?? []

  const createChat = useCallback(async (): Promise<ChatSummary> => {
    setIsCreating(true)

    try {
      const chat = await createChatRequest()
      await queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY })
      if (chat.user_id) {
        publishRealtimeEvent({
          type: 'chat-created',
          userId: chat.user_id,
          chatId: chat.id,
        })
      }
      return chat
    } finally {
      setIsCreating(false)
    }
  }, [queryClient])

  const deleteChat = useCallback(
    async (chatId: string): Promise<void> => {
      const targetChat = chats.find(chat => chat.id === chatId)
      setDeletingChatId(chatId)

      try {
        await deleteChatRequest(chatId)
        await queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY })
        if (targetChat?.user_id) {
          publishRealtimeEvent({
            type: 'chat-deleted',
            userId: targetChat.user_id,
            chatId,
          })
        }
      } finally {
        setDeletingChatId(null)
      }
    },
    [chats, queryClient],
  )

  return {
    chats,
    isLoading: chatsQuery.isLoading,
    isFetching: chatsQuery.isFetching,
    isCreating,
    deletingChatId,
    createChat,
    deleteChat,
    refetchChats: chatsQuery.refetch,
  }
}
