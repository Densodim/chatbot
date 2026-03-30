'use client'

import { startTransition, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  FileIcon,
  ImageIcon,
  PaperclipIcon,
  SendIcon,
} from '@/components/icons'
import type { BubbleAttachment, SendMessageInput } from '@/types/chat'

type UploadedAttachment = BubbleAttachment & {
  isUploading: boolean
}

type UploadResponse = {
  data: {
    id: string
    file_name?: string
    mime_type?: string
    preview_url?: string | null
    fileName?: string
    mimeType?: string
    previewUrl?: string | null
  }
}

type Props = {
  chatId: string | null
  isSending: boolean
  isDisabled: boolean
  remainingFreeMessages: number | null
  onSend: (
    input: SendMessageInput,
    attachments: BubbleAttachment[],
  ) => Promise<void>
}

function isImageAttachment(attachment: UploadedAttachment): boolean {
  return attachment.mimeType.startsWith('image/')
}

async function uploadAttachment(
  file: File,
  chatId: string,
): Promise<UploadedAttachment> {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('chatId', chatId)

  const response = await fetch('/api/attachments/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(json?.error ?? 'Failed to upload attachment')
  }

  const json = (await response.json()) as UploadResponse

  return {
    id: json.data.id,
    fileName: json.data.fileName ?? json.data.file_name ?? file.name,
    mimeType: json.data.mimeType ?? json.data.mime_type ?? file.type,
    previewUrl: json.data.previewUrl ?? json.data.preview_url ?? null,
    isUploading: false,
  }
}

async function removeAttachment(id: string): Promise<void> {
  const response = await fetch(`/api/attachments/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(json?.error ?? 'Failed to remove attachment')
  }
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
  isSending,
  isDisabled,
  remainingFreeMessages,
  onSend,
}: Props) {
  const fileInputId = useId()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (value.length < 0) {
      return
    }

    resizeTextarea(textareaRef.current)
  }, [value])

  const handleFiles = async (fileList: FileList | File[]) => {
    if (!chatId) {
      toast.error('Create a chat before attaching files.')
      return
    }

    const files = Array.from(fileList)
    if (files.length === 0) {
      return
    }

    setIsUploading(true)

    try {
      const uploaded = await Promise.all(
        files.map(file => uploadAttachment(file, chatId)),
      )

      startTransition(() => {
        setAttachments(previous => [...previous, ...uploaded])
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload file.',
      )
    } finally {
      setIsUploading(false)
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
    const existing = attachments.find(
      attachment => attachment.id === attachmentId,
    )

    startTransition(() => {
      setAttachments(previous =>
        previous.filter(attachment => attachment.id !== attachmentId),
      )
    })

    if (!existing || existing.isUploading) {
      return
    }

    try {
      await removeAttachment(attachmentId)
    } catch (error) {
      startTransition(() => {
        setAttachments(previous =>
          existing ? [...previous, existing] : previous,
        )
      })
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove attachment.',
      )
    }
  }

  const handleSubmit = async () => {
    const content = value.trim()
    const readyAttachments = attachments.filter(
      attachment => !attachment.isUploading,
    )

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
    setAttachments([])

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
      setAttachments(previousAttachments)
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
          <div className='mb-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-3 text-sm text-[color:var(--color-muted-foreground)]'>
            {remainingFreeMessages} free messages remaining
          </div>
        )}

        {attachments.length > 0 ? (
          <div className='mb-3 flex flex-wrap gap-2'>
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className='inline-flex max-w-full items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm shadow-sm'
              >
                {isImageAttachment(attachment) ? (
                  <ImageIcon className='h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]' />
                ) : (
                  <FileIcon className='h-4 w-4 shrink-0 text-[color:var(--color-muted-foreground)]' />
                )}
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

        <div className='rounded-[28px] border border-[color:var(--color-border)] bg-white p-3 shadow-lg shadow-black/5'>
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
