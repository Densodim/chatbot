'use client'

export type RealtimeEvent =
  | {
      type: 'chat-created' | 'chat-deleted'
      userId: string
      chatId: string
    }
  | {
      type: 'message-created'
      userId: string
      chatId: string
    }

const CHANNEL_NAME = 'chatbot:cross-tab'

export function supportsCrossTabRealtime(): boolean {
  return typeof window !== 'undefined' && 'BroadcastChannel' in window
}

export function createRealtimeClient(): BroadcastChannel | null {
  if (!supportsCrossTabRealtime()) {
    return null
  }

  return new BroadcastChannel(CHANNEL_NAME)
}

export function publishRealtimeEvent(event: RealtimeEvent): void {
  const channel = createRealtimeClient()

  if (!channel) {
    return
  }

  channel.postMessage(event)
  channel.close()
}
