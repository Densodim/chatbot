'use client'

import { startTransition, useCallback, useState } from 'react'
import type { BubbleAttachment } from '@/types/chat'

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

async function parseUploadError(response: Response): Promise<string> {
  const json = (await response.json().catch(() => null)) as {
    error?: string
  } | null

  return json?.error ?? 'Upload failed'
}

async function uploadSingleFile(
  file: File,
  chatId: string,
): Promise<BubbleAttachment> {
  const formData = new FormData()
  formData.set('file', file)
  formData.set('chatId', chatId)

  const response = await fetch('/api/attachments/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseUploadError(response))
  }

  const json = (await response.json()) as UploadResponse

  return {
    id: json.data.id,
    fileName: json.data.fileName ?? json.data.file_name ?? file.name,
    mimeType: json.data.mimeType ?? json.data.mime_type ?? file.type,
    previewUrl: json.data.previewUrl ?? json.data.preview_url ?? null,
  }
}

async function deleteSingleAttachment(id: string): Promise<void> {
  const response = await fetch(`/api/attachments/${id}`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error(await parseUploadError(response))
  }
}

export function useFileUpload(chatId: string | null) {
  const [attachments, setAttachments] = useState<BubbleAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const upload = useCallback(
    async (files: FileList | File[]): Promise<BubbleAttachment[]> => {
      if (!chatId) {
        throw new Error('Create a chat before attaching files.')
      }

      const nextFiles = Array.from(files)

      if (nextFiles.length === 0) {
        return []
      }

      setIsUploading(true)

      try {
        const uploaded = await Promise.all(
          nextFiles.map(file => uploadSingleFile(file, chatId)),
        )

        startTransition(() => {
          setAttachments(previous => [...previous, ...uploaded])
        })

        return uploaded
      } finally {
        setIsUploading(false)
      }
    },
    [chatId],
  )

  const removeAttachment = useCallback(async (attachmentId: string) => {
    let removed: BubbleAttachment | null = null

    startTransition(() => {
      setAttachments(previous => {
        removed =
          previous.find(attachment => attachment.id === attachmentId) ?? null
        return previous.filter(attachment => attachment.id !== attachmentId)
      })
    })

    if (!removed) {
      return
    }

    try {
      await deleteSingleAttachment(attachmentId)
    } catch (error) {
      startTransition(() => {
        setAttachments(previous =>
          removed ? [...previous, removed] : previous,
        )
      })
      throw error
    }
  }, [])

  const resetAttachments = useCallback(() => {
    setAttachments([])
  }, [])

  const restoreAttachments = useCallback(
    (nextAttachments: BubbleAttachment[]) => {
      setAttachments(nextAttachments)
    },
    [],
  )

  return {
    attachments,
    isUploading,
    upload,
    removeAttachment,
    resetAttachments,
    restoreAttachments,
  }
}
