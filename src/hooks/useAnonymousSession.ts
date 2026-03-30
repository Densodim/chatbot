'use client'

import { useQuery } from '@tanstack/react-query'

type AnonymousSessionResponse = {
  data: {
    remaining: number
    messageCount: number
  }
}

async function fetchAnonymousSession(): Promise<{
  remaining: number
  messageCount: number
}> {
  const response = await fetch('/api/anonymous/session')

  if (!response.ok) {
    throw new Error('Failed to fetch anonymous session')
  }

  const json = (await response.json()) as AnonymousSessionResponse
  return json.data
}

export function useAnonymousSession(enabled = true) {
  const query = useQuery({
    queryKey: ['anonymous', 'session'],
    queryFn: fetchAnonymousSession,
    enabled,
  })

  return {
    remainingMessages: query.data?.remaining ?? 3,
    messageCount: query.data?.messageCount ?? 0,
    isLoading: query.isLoading,
  }
}
