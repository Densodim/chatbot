'use client'

import { memo, type ReactNode, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { BotIcon, FileIcon, ImageIcon } from '@/components/icons'
import type { BubbleAttachment } from '@/types/chat'

type Props = {
  messageRole: 'user' | 'assistant'
  content: string
  attachments?: BubbleAttachment[]
  isStreaming?: boolean
}

// Static check function - hoisted to module level
function isImageAttachment(attachment: BubbleAttachment): boolean {
  return attachment.mimeType.startsWith('image/')
}

// Memoized attachment component - prevents re-render of entire message
const AttachmentItem = memo(function AttachmentItem({
  attachment,
}: {
  attachment: BubbleAttachment
}) {
  if (isImageAttachment(attachment)) {
    return (
      <div className='overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-hover)]'>
        {attachment.previewUrl ? (
          <img
            src={attachment.previewUrl}
            alt={attachment.fileName}
            width={400}
            height={176}
            loading='lazy'
            className='h-44 w-full object-cover'
          />
        ) : (
          <div className='flex h-44 items-center justify-center text-[var(--text-secondary)]'>
            <ImageIcon className='h-8 w-8' />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-hover)] px-3 py-2'>
      <FileIcon className='h-5 w-5 shrink-0 text-[var(--text-secondary)]' />
      <div className='min-w-0'>
        <p className='truncate font-medium text-sm text-[var(--text-primary)]'>
          {attachment.fileName}
        </p>
        <p className='text-xs text-[var(--text-tertiary)]'>
          {attachment.mimeType}
        </p>
      </div>
    </div>
  )
})

// Memoized message body - computed during render (rerender-derived-state-no-effect)
const MessageBody = memo(function MessageBody({
  content,
  isUser,
  isStreaming,
}: {
  content: string
  isUser: boolean
  isStreaming: boolean
}) {
  // Derived state - computed during render, not in effect
  const body: ReactNode = useMemo(() => {
    if (content) {
      return isUser ? (
        <p className='whitespace-pre-wrap text-sm leading-6'>{content}</p>
      ) : (
        <div className='markdown-body'>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    }

    if (isStreaming) {
      return (
        <p className='text-sm leading-6'>
          <span className='inline-block h-4 w-0.5 animate-pulse rounded-full bg-current align-middle' />
        </p>
      )
    }

    return null
  }, [content, isUser, isStreaming])

  return (
    <>
      {body}
      {isStreaming && content ? (
        <span className='ml-1 inline-block h-4 w-0.5 animate-pulse rounded-full bg-current align-middle' />
      ) : null}
    </>
  )
})

export const MessageBubble = memo(function MessageBubble({
  messageRole,
  content,
  attachments = [],
  isStreaming = false,
}: Props) {
  const isUser = messageRole === 'user'

  // Pre-compute hasAttachments boolean - primitive for stable comparison
  const hasAttachments = attachments.length > 0

  return (
    <div
      className={`flex w-full gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {isUser ? null : (
        <div className='mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--text-secondary)]'>
          <BotIcon className='h-4 w-4' />
        </div>
      )}

      <div
        className={`max-w-[min(100%,48rem)] rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
            : 'border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)]'
        }`}
      >
        {hasAttachments ? (
          <div className='mb-3 grid gap-2 sm:grid-cols-2'>
            {attachments.map(attachment => (
              <AttachmentItem key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : null}

        <MessageBody
          content={content}
          isUser={isUser}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  )
})
