'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  createRealtimeClient,
  type RealtimeEvent,
} from '@/lib/supabase-realtime'

export function useMessagesRealtime(
  userId: string | null,
  chatId: string | null,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId || !chatId) {
      return
    }

    const channel = createRealtimeClient()

    if (!channel) {
      return
    }

    channel.onmessage = event => {
      const payload = event.data as RealtimeEvent

      if (
        payload.userId !== userId ||
        payload.chatId !== chatId ||
        payload.type !== 'message-created'
      ) {
        return
      }

      // Small delay to avoid race condition with local invalidateQueries
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ['chat', chatId, 'messages'],
        })
      }, 100)
    }

    return () => {
      channel.close()
    }
  }, [chatId, queryClient, userId])
}
