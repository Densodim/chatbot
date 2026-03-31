'use client'

import { useEffect, useRef } from 'react'
import { EmptyChatState } from '@/components/chat/EmptyChatState'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { StreamingMessage } from '@/components/chat/StreamingMessage'
import type { BubbleAttachment, ChatMessage } from '@/types/chat'

type OptimisticMessage = {
  content: string
  attachments: BubbleAttachment[]
}

type Props = {
  messages: ChatMessage[]
  optimisticMessage: OptimisticMessage | null
  isLoading: boolean
  streamingMessage: string
  onSuggestion: (value: string) => void
  isDisabled: boolean
}

function normalizeAttachments(message: ChatMessage): BubbleAttachment[] {
  return message.attachments.map(attachment => ({
    id: attachment.id,
    fileName: attachment.file_name,
    mimeType: attachment.mime_type,
    previewUrl: attachment.preview_url,
  }))
}

function LoadingSkeleton() {
  const skeletonIds = [
    'message-a',
    'message-b',
    'message-c',
    'message-d',
    'message-e',
  ]

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6'>
      {skeletonIds.map((id, index) => (
        <div
          key={id}
          className={`h-24 animate-pulse rounded-[28px] ${
            index % 2 === 0
              ? 'mr-10 bg-white'
              : 'ml-auto w-[70%] bg-[var(--bg-tertiary)]'
          }`}
        />
      ))}
    </div>
  )
}

export function MessageList({
  messages,
  optimisticMessage,
  isLoading,
  streamingMessage,
  onSuggestion,
  isDisabled,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const scrollVersion =
    messages.length + (optimisticMessage ? 1 : 0) + (streamingMessage ? 1 : 0)

  useEffect(() => {
    if (scrollVersion < 0) {
      return
    }

    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [scrollVersion])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (messages.length === 0 && !optimisticMessage && !streamingMessage) {
    return (
      <EmptyChatState onSuggestion={onSuggestion} isDisabled={isDisabled} />
    )
  }

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6'>
      {messages.map(message => (
        <MessageBubble
          key={message.id}
          messageRole={message.role === 'assistant' ? 'assistant' : 'user'}
          content={message.content}
          attachments={normalizeAttachments(message)}
        />
      ))}

      {optimisticMessage ? (
        <MessageBubble
          messageRole='user'
          content={optimisticMessage.content}
          attachments={optimisticMessage.attachments}
        />
      ) : null}

      {streamingMessage ? (
        <StreamingMessage content={streamingMessage} />
      ) : null}

      <div ref={bottomRef} />
    </div>
  )
}
