import 'server-only'
import { PDFParse } from 'pdf-parse'

const IMAGE_MIME_PREFIX = 'image/'
const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'text/markdown',
  'text/plain',
])
const MAX_DOCUMENT_CONTEXT_TOKENS = 8000
const APPROX_CHARS_PER_TOKEN = 4

function normalizeExtractedText(text: string): string {
  return text.replaceAll('\r\n', '\n').trim()
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith(IMAGE_MIME_PREFIX)
}

export function isDocumentMimeType(mimeType: string): boolean {
  return DOCUMENT_MIME_TYPES.has(mimeType)
}

export function isSupportedAttachmentMimeType(mimeType: string): boolean {
  return isImageMimeType(mimeType) || isDocumentMimeType(mimeType)
}

export function truncateDocumentContext(
  text: string,
  maxTokens = MAX_DOCUMENT_CONTEXT_TOKENS,
): string {
  const normalized = normalizeExtractedText(text)
  const maxChars = maxTokens * APPROX_CHARS_PER_TOKEN
  if (normalized.length <= maxChars) {
    return normalized
  }

  return `${normalized.slice(0, maxChars).trimEnd()}\n\n[Document context truncated]`
}

async function extractPdfText(file: File): Promise<string> {
  const parser = new PDFParse({
    data: new Uint8Array(await file.arrayBuffer()),
  })

  try {
    const result = await parser.getText()
    return normalizeExtractedText(result.text)
  } finally {
    await parser.destroy()
  }
}

export async function extractAttachmentText(
  file: File,
): Promise<string | null> {
  if (file.type === 'text/plain' || file.type === 'text/markdown') {
    return normalizeExtractedText(await file.text())
  }

  if (file.type === 'application/pdf') {
    return extractPdfText(file)
  }

  return null
}
