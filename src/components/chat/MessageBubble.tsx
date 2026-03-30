'use client'

import type { ReactNode } from 'react'
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

function isImageAttachment(attachment: BubbleAttachment): boolean {
  return attachment.mimeType.startsWith('image/')
}

export function MessageBubble({
  messageRole,
  content,
  attachments = [],
  isStreaming = false,
}: Props) {
  const isUser = messageRole === 'user'
  let body: ReactNode = null

  if (content) {
    body = isUser ? (
      <p className='whitespace-pre-wrap text-[15px] leading-7'>{content}</p>
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
  } else if (isStreaming) {
    body = (
      <p className='text-[15px] leading-7'>
        <span className='inline-block h-5 w-0.5 animate-pulse rounded-full bg-current align-middle' />
      </p>
    )
  }

  return (
    <div
      className={`flex w-full gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {isUser ? null : (
        <div className='mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-panel-strong)] text-[color:var(--color-foreground)] shadow-sm'>
          <BotIcon className='h-5 w-5' />
        </div>
      )}

      <div
        className={`max-w-[min(100%,48rem)] rounded-[28px] px-5 py-4 shadow-sm ${
          isUser
            ? 'bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]'
            : 'border border-[color:var(--color-border)] bg-white text-[color:var(--color-foreground)]'
        }`}
      >
        {attachments.length > 0 ? (
          <div className='mb-4 grid gap-3 sm:grid-cols-2'>
            {attachments.map(attachment =>
              isImageAttachment(attachment) ? (
                <div
                  key={attachment.id}
                  className='overflow-hidden rounded-2xl border border-black/5 bg-black/5'
                >
                  {attachment.previewUrl ? (
                    <img
                      src={attachment.previewUrl}
                      alt={attachment.fileName}
                      className='h-44 w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-44 items-center justify-center text-[color:var(--color-muted-foreground)]'>
                      <ImageIcon className='h-8 w-8' />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  key={attachment.id}
                  className='flex items-center gap-3 rounded-2xl border border-black/5 bg-black/5 px-4 py-3'
                >
                  <FileIcon className='h-5 w-5 shrink-0' />
                  <div className='min-w-0'>
                    <p className='truncate font-medium text-sm'>
                      {attachment.fileName}
                    </p>
                    <p className='text-xs opacity-75'>{attachment.mimeType}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : null}

        {body}

        {isStreaming ? (
          <span className='ml-1 inline-block h-5 w-0.5 animate-pulse rounded-full bg-current align-middle' />
        ) : null}
      </div>
    </div>
  )
}
