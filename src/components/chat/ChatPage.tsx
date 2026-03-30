'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { InputBar } from '@/components/chat/InputBar'
import { MessageList } from '@/components/chat/MessageList'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import type { BubbleAttachment, SendMessageInput } from '@/types/chat'

type Props = {
  chatId: string | null
}

export function ChatPage({ chatId }: Props) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    streamingMessage,
    sendMessage,
  } = useChat(user ? chatId : null)
  const { remainingMessages } = useAnonymousSession(user === null)
  const [optimisticMessage, setOptimisticMessage] = useState<{
    content: string
    attachments: BubbleAttachment[]
  } | null>(null)

  const remainingFreeMessages = user ? null : remainingMessages

  const isComposerDisabled = useMemo(
    () => isAuthLoading || !user || chatId === null,
    [chatId, isAuthLoading, user],
  )

  const handleSend = async (
    input: SendMessageInput,
    attachments: BubbleAttachment[],
  ) => {
    if (!user) {
      toast.error('Sign in to start a saved chat.')
      return
    }

    const content = input.content?.trim() ?? ''
    setOptimisticMessage({ content, attachments })

    try {
      await sendMessage(input)
    } finally {
      setOptimisticMessage(null)
    }
  }

  const handleSuggestion = async (value: string) => {
    await handleSend({ content: value }, [])
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <MessageList
        messages={messages}
        optimisticMessage={optimisticMessage}
        isLoading={isAuthLoading || isMessagesLoading}
        streamingMessage={streamingMessage}
        onSuggestion={value => {
          void handleSuggestion(value)
        }}
        isDisabled={isComposerDisabled || isSending}
      />

      <InputBar
        chatId={chatId}
        isSending={isSending}
        isDisabled={isComposerDisabled}
        remainingFreeMessages={remainingFreeMessages}
        onSend={handleSend}
      />
    </div>
  )
}
