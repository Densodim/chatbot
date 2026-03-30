'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  createRealtimeClient,
  type RealtimeEvent,
} from '@/lib/supabase-realtime'

export function useChatsRealtime(userId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) {
      return
    }

    const channel = createRealtimeClient()

    if (!channel) {
      return
    }

    channel.onmessage = event => {
      const payload = event.data as RealtimeEvent

      if (payload.userId !== userId) {
        return
      }

      if (payload.type === 'chat-created' || payload.type === 'chat-deleted') {
        void queryClient.invalidateQueries({ queryKey: ['chats'] })
        return
      }

      void queryClient.invalidateQueries({ queryKey: ['chats'] })
    }

    return () => {
      channel.close()
    }
  }, [queryClient, userId])
}
