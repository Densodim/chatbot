import 'server-only'

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
  try {
    const { extractText } = await import('unpdf')
    const buffer = new Uint8Array(await file.arrayBuffer())
    const { text } = await extractText(buffer, { mergePages: true })
    return normalizeExtractedText(text)
  } catch (error) {
    // Return empty string if extraction fails, don't throw
    return ''
  }
}

export async function extractAttachmentText(
  file: File,
): Promise<string | null> {
  try {
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      return normalizeExtractedText(await file.text())
    }

    if (file.type === 'application/pdf') {
      return await extractPdfText(file)
    }

    return null
  } catch (error) {
    // Don't fail the upload if text extraction fails
    return null
  }
}
