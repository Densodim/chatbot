'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  FileIcon,
  ImageIcon,
  PaperclipIcon,
  SendIcon,
} from '@/components/icons'
import type { BubbleAttachment, SendMessageInput } from '@/types/chat'

type Props = {
  chatId: string | null
  attachments: BubbleAttachment[]
  isUploading: boolean
  isSending: boolean
  isDisabled: boolean
  remainingFreeMessages: number | null
  isDragActive?: boolean
  onUploadFiles: (files: FileList | File[]) => Promise<unknown>
  onRemoveAttachment: (attachmentId: string) => Promise<void>
  onResetAttachments: () => void
  onRestoreAttachments: (attachments: BubbleAttachment[]) => void
  onSend: (
    input: SendMessageInput,
    attachments: BubbleAttachment[],
  ) => Promise<void>
}

function isImageAttachment(attachment: BubbleAttachment): boolean {
  return attachment.mimeType.startsWith('image/')
}

function renderAttachmentLead(attachment: BubbleAttachment) {
  if (!isImageAttachment(attachment)) {
    return (
      <FileIcon className='h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]' />
    )
  }

  if (attachment.previewUrl) {
    return (
      <img
        src={attachment.previewUrl}
        alt={attachment.fileName}
        className='h-10 w-10 shrink-0 rounded-xl object-cover'
      />
    )
  }

  return (
    <ImageIcon className='h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]' />
  )
}

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return
  }

  textarea.style.height = '0px'
  const nextHeight = Math.min(textarea.scrollHeight, 160)
  textarea.style.height = `${nextHeight}px`
}

export function InputBar({
  chatId,
  attachments,
  isUploading,
  isSending,
  isDisabled,
  remainingFreeMessages,
  isDragActive = false,
  onUploadFiles,
  onRemoveAttachment,
  onResetAttachments,
  onRestoreAttachments,
  onSend,
}: Props) {
  const fileInputId = useId()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (value.length < 0) {
      return
    }

    resizeTextarea(textareaRef.current)
  }, [value])

  const handleFiles = async (fileList: FileList | File[]) => {
    try {
      await onUploadFiles(fileList)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload file.',
      )
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePaste = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    const imageFiles = Array.from(event.clipboardData.items)
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null)

    if (imageFiles.length === 0) {
      return
    }

    event.preventDefault()
    await handleFiles(imageFiles)
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await onRemoveAttachment(attachmentId)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove attachment.',
      )
    }
  }

  const handleSubmit = async () => {
    const content = value.trim()
    const readyAttachments = attachments

    if (
      (!content && readyAttachments.length === 0) ||
      isSending ||
      isDisabled
    ) {
      return
    }

    const previousValue = value
    const previousAttachments = attachments

    setValue('')
    onResetAttachments()

    try {
      await onSend(
        {
          content,
          attachmentIds: readyAttachments.map(attachment => attachment.id),
        },
        readyAttachments,
      )
    } catch (error) {
      setValue(previousValue)
      onRestoreAttachments(previousAttachments)
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message.',
      )
    }
  }

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()
    await handleSubmit()
  }

  return (
    <div className='sticky bottom-0 border-t border-[color:var(--color-border)] bg-[color:var(--color-shell)]/96 px-4 pb-4 pt-3 backdrop-blur sm:px-6'>
      <div className='mx-auto w-full max-w-4xl'>
        {remainingFreeMessages === null ? null : (
          <p className='mb-3 px-1 text-xs text-[color:var(--color-muted-foreground)]'>
            {remainingFreeMessages > 0
              ? `${remainingFreeMessages} free message${remainingFreeMessages === 1 ? '' : 's'} remaining`
              : "You've reached the free limit. Sign up to continue."}
          </p>
        )}

        {attachments.length > 0 ? (
          <div className='mb-3 flex flex-wrap gap-2'>
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className='inline-flex max-w-full items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-white px-2.5 py-2 text-sm shadow-sm'
              >
                {renderAttachmentLead(attachment)}
                <span className='truncate'>{attachment.fileName}</span>
                <button
                  type='button'
                  onClick={() => {
                    void handleRemoveAttachment(attachment.id)
                  }}
                  className='text-[color:var(--color-muted-foreground)] transition hover:text-[color:var(--color-foreground)]'
                  aria-label={`Remove ${attachment.fileName}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={`rounded-[28px] border bg-white p-3 shadow-lg shadow-black/5 transition ${
            isDragActive
              ? 'border-[color:var(--color-accent)] ring-4 ring-[color:var(--color-accent)]/15'
              : 'border-[color:var(--color-border)]'
          }`}
        >
          <div className='flex items-end gap-3'>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type='file'
              multiple
              accept='image/*,.pdf,.txt,.md,text/plain,text/markdown,application/pdf'
              onChange={event => {
                void handleFiles(event.target.files ?? [])
              }}
              className='sr-only'
            />

            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled || isUploading || isSending}
              className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Attach files'
            >
              <PaperclipIcon className='h-5 w-5' />
            </button>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={event => setValue(event.target.value)}
              onKeyDown={event => {
                void handleKeyDown(event)
              }}
              onPaste={event => {
                void handlePaste(event)
              }}
              rows={1}
              disabled={isDisabled || isSending}
              placeholder={
                chatId
                  ? 'Ask anything, paste an image, or attach a document...'
                  : 'Create a chat from the sidebar to start messaging...'
              }
              className='max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] text-[color:var(--color-foreground)] outline-none placeholder:text-[color:var(--color-muted-foreground)]'
            />

            <button
              type='button'
              onClick={() => {
                void handleSubmit()
              }}
              disabled={
                isDisabled ||
                isSending ||
                isUploading ||
                (!value.trim() && attachments.length === 0)
              }
              className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] shadow-sm transition hover:bg-[color:var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50'
              aria-label='Send message'
            >
              <SendIcon className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
