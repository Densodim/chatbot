import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'

const STORAGE_BUCKET = 'attachments'

export async function removeAttachmentStorageObjects(
  storagePaths: string[],
): Promise<string | null> {
  const uniquePaths = [...new Set(storagePaths.filter(Boolean))]

  if (uniquePaths.length === 0) {
    return null
  }

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove(uniquePaths)

  return error?.message ?? null
}
