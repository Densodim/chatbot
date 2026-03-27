// Database row types — mirrors public.* tables in Supabase.
// All timestamps are returned as ISO-8601 strings by the JS client.
// No RLS — all access goes through the service-role admin client (src/lib/supabase.ts).

// ------------------------------------------------------------------
// Shared primitives
// ------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system'

// ------------------------------------------------------------------
// Row types (what the DB returns on SELECT)
// ------------------------------------------------------------------

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export type AnonymousSession = {
  id: string
  fingerprint: string
  message_count: number
  created_at: string
}

export type Chat = {
  id: string
  user_id: string | null
  title: string
  model: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  chat_id: string
  role: MessageRole
  content: string
  created_at: string
}

export type Attachment = {
  id: string
  message_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  created_at: string
}

// ------------------------------------------------------------------
// Insert types (required fields for INSERT; auto-generated omitted)
// ------------------------------------------------------------------

export type ProfileInsert = {
  id: string // must match auth.users.id
  display_name?: string | null
  avatar_url?: string | null
}

export type AnonymousSessionInsert = {
  fingerprint: string
  message_count?: number
}

export type ChatInsert = {
  user_id?: string | null
  title?: string
  model?: string
}

export type MessageInsert = {
  chat_id: string
  role: MessageRole
  content?: string
}

export type AttachmentInsert = {
  message_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
}

// ------------------------------------------------------------------
// Update types (all fields optional except the key)
// ------------------------------------------------------------------

export type ChatUpdate = {
  title?: string
  model?: string
  updated_at?: string
}

export type MessageUpdate = {
  content?: string
}
