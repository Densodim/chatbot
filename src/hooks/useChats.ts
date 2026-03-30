'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { Chat } from '@/types/db'

type ChatsResponse = {
  data: Chat[]
}

type ApiErrorResponse = {
  error?: string
}

export type ChatSummary = Pick<
  Chat,
  'id' | 'title' | 'model' | 'created_at' | 'updated_at'
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

  const createChat = useCallback(async (): Promise<ChatSummary> => {
    setIsCreating(true)

    try {
      const chat = await createChatRequest()
      await queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY })
      return chat
    } finally {
      setIsCreating(false)
    }
  }, [queryClient])

  const deleteChat = useCallback(
    async (chatId: string): Promise<void> => {
      setDeletingChatId(chatId)

      try {
        await deleteChatRequest(chatId)
        await queryClient.invalidateQueries({ queryKey: CHATS_QUERY_KEY })
      } finally {
        setDeletingChatId(null)
      }
    },
    [queryClient],
  )

  return {
    chats: chatsQuery.data ?? [],
    isLoading: chatsQuery.isLoading,
    isFetching: chatsQuery.isFetching,
    isCreating,
    deletingChatId,
    createChat,
    deleteChat,
    refetchChats: chatsQuery.refetch,
  }
}
