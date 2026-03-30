'use client'

import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { InputBar } from '@/components/chat/InputBar'
import { MessageList } from '@/components/chat/MessageList'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useMessagesRealtime } from '@/hooks/useMessagesRealtime'
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
  } = useChat(user ? chatId : null, user?.id ?? null)
  const { remainingMessages } = useAnonymousSession(user === null)
  useMessagesRealtime(user?.id ?? null, chatId)
  const {
    attachments,
    isUploading,
    upload,
    removeAttachment,
    resetAttachments,
    restoreAttachments,
  } = useFileUpload(chatId)
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

  const dropzone = useDropzone({
    noClick: true,
    noKeyboard: true,
    disabled: chatId === null || isComposerDisabled,
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    onDropAccepted: acceptedFiles => {
      void upload(acceptedFiles).catch(error => {
        toast.error(
          error instanceof Error ? error.message : 'Failed to upload file.',
        )
      })
    },
    onDropRejected: () => {
      toast.error(
        'Only images, PDF, TXT, and Markdown files up to 10 MB are allowed.',
      )
    },
  })

  return (
    <div
      {...dropzone.getRootProps({
        className: 'relative flex min-h-0 flex-1 flex-col',
      })}
    >
      <input {...dropzone.getInputProps()} />

      {dropzone.isDragActive ? (
        <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-none bg-[color:var(--color-accent)]/10 backdrop-blur-[1px]'>
          <div className='rounded-[32px] border border-[color:var(--color-accent)] bg-white px-6 py-5 text-center shadow-xl'>
            <p className='font-medium text-[color:var(--color-foreground)]'>
              Drop files to attach them to this chat
            </p>
            <p className='mt-1 text-sm text-[color:var(--color-muted-foreground)]'>
              Supports images, PDF, TXT, and Markdown documents.
            </p>
          </div>
        </div>
      ) : null}

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
        attachments={attachments}
        isUploading={isUploading}
        isSending={isSending}
        isDisabled={isComposerDisabled}
        remainingFreeMessages={remainingFreeMessages}
        isDragActive={dropzone.isDragActive}
        onUploadFiles={upload}
        onRemoveAttachment={removeAttachment}
        onResetAttachments={resetAttachments}
        onRestoreAttachments={restoreAttachments}
        onSend={handleSend}
      />
    </div>
  )
}
