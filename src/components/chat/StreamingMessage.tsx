'use client'

import { MessageBubble } from '@/components/chat/MessageBubble'

export function StreamingMessage({ content }: { content: string }) {
  return (
    <MessageBubble
      messageRole='assistant'
      content={content}
      isStreaming={true}
    />
  )
}
