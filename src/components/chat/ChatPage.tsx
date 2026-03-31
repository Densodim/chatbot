'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { AnonymousBanner } from '@/components/chat/AnonymousBanner'
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

// Static dropzone config - hoisted to module level to prevent re-creation
const DROPZONE_ACCEPT = {
  'image/*': [],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
} as const

export const ChatPage = memo(function ChatPage({ chatId }: Props) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const {
    messages,
    isLoading: isMessagesLoading,
    isSending,
    streamingMessage,
    sendMessage,
  } = useChat(chatId, user?.id ?? null)
  const {
    remainingMessages,
    totalMessages,
    isLoading: isAnonymousLoading,
  } = useAnonymousSession(!isAuthLoading && user === null)
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

  // Derived state - computed during render (rerender-derived-state-no-effect)
  const remainingFreeMessages = user ? null : remainingMessages
  const hasReachedAnonymousLimit =
    !user && remainingFreeMessages !== null && remainingFreeMessages <= 0

  const isComposerDisabled = useMemo(
    () =>
      isAuthLoading ||
      chatId === null ||
      (!user && (isAnonymousLoading || hasReachedAnonymousLimit)),
    [chatId, hasReachedAnonymousLimit, isAnonymousLoading, isAuthLoading, user],
  )

  // Stable callbacks - useCallback to prevent child re-renders
  const handleSend = useCallback(
    async (input: SendMessageInput, attachments: BubbleAttachment[]) => {
      if (hasReachedAnonymousLimit) {
        toast.error('You have reached the free limit. Sign up to continue.')
        return
      }

      const content = input.content?.trim() ?? ''
      setOptimisticMessage({ content, attachments })

      try {
        await sendMessage(input)
      } finally {
        setOptimisticMessage(null)
      }
    },
    [hasReachedAnonymousLimit, sendMessage],
  )

  const handleSuggestion = useCallback(
    async (value: string) => {
      await handleSend({ content: value }, [])
    },
    [handleSend],
  )

  // Stable dropzone callbacks - prevent re-creation on every render
  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      void upload(acceptedFiles).catch(error => {
        toast.error(
          error instanceof Error ? error.message : 'Failed to upload file.',
        )
      })
    },
    [upload],
  )

  const onDropRejected = useCallback(() => {
    toast.error(
      'Only images, PDF, TXT, and Markdown files up to 10 MB are allowed.',
    )
  }, [])

  const dropzone = useDropzone({
    noClick: true,
    noKeyboard: true,
    disabled: chatId === null || isComposerDisabled,
    accept: DROPZONE_ACCEPT,
    onDropAccepted,
    onDropRejected,
  })

  // Pre-compute stable props for MessageList
  const messageListProps = useMemo(
    () => ({
      messages,
      optimisticMessage,
      isLoading:
        isAuthLoading || (!user && isAnonymousLoading) || isMessagesLoading,
      streamingMessage,
      onSuggestion: handleSuggestion,
      isDisabled: isComposerDisabled || isSending,
    }),
    [
      messages,
      optimisticMessage,
      isAuthLoading,
      user,
      isAnonymousLoading,
      isMessagesLoading,
      streamingMessage,
      handleSuggestion,
      isComposerDisabled,
      isSending,
    ],
  )

  // Pre-compute stable props for InputBar
  const inputBarProps = useMemo(
    () => ({
      chatId,
      attachments,
      isUploading,
      isSending,
      isDisabled: isComposerDisabled,
      remainingFreeMessages,
      isDragActive: dropzone.isDragActive,
      onUploadFiles: upload,
      onRemoveAttachment: removeAttachment,
      onResetAttachments: resetAttachments,
      onRestoreAttachments: restoreAttachments,
      onSend: handleSend,
    }),
    [
      chatId,
      attachments,
      isUploading,
      isSending,
      isComposerDisabled,
      remainingFreeMessages,
      dropzone.isDragActive,
      upload,
      removeAttachment,
      resetAttachments,
      restoreAttachments,
      handleSend,
    ],
  )

  return (
    <div
      {...dropzone.getRootProps({
        className: 'relative flex min-h-0 flex-1 flex-col',
      })}
    >
      <input {...dropzone.getInputProps()} />

      {dropzone.isDragActive ? (
        <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-none bg-[var(--text-primary)]/10 backdrop-blur-[1px]'>
          <div className='rounded-xl border border-[var(--text-primary)] bg-[var(--bg-card)] px-6 py-5 text-center shadow-xl'>
            <p className='font-medium text-[var(--text-primary)]'>
              Drop files to attach them to this chat
            </p>
            <p className='mt-1 text-sm text-[var(--text-secondary)]'>
              Supports images, PDF, TXT, and Markdown documents.
            </p>
          </div>
        </div>
      ) : null}

      {user ? null : (
        <AnonymousBanner
          remainingMessages={remainingMessages}
          totalMessages={totalMessages}
        />
      )}

      <MessageList {...messageListProps} />

      <InputBar {...inputBarProps} />
    </div>
  )
})
