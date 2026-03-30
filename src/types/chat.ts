import type { Attachment, Message } from '@/types/db'

export type AttachmentWithPreview = Attachment & {
  preview_url: string | null
}

export type BubbleAttachment = {
  id: string
  fileName: string
  mimeType: string
  previewUrl: string | null
}

export type ChatMessage = Message & {
  attachments: AttachmentWithPreview[]
}

export type SendMessageInput = {
  content?: string
  attachmentIds?: string[]
}
