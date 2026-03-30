-- =============================================================
-- Migration: initial schema
-- Chatbot app — Postgres via Supabase (service role, no RLS)
-- =============================================================

-- ------------------------------------------------------------
-- 1. Profiles (extend auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. Anonymous sessions (3-free-messages tracking)
-- ------------------------------------------------------------
create table public.anonymous_sessions (
  id            uuid        primary key default gen_random_uuid(),
  fingerprint   text        not null unique, -- browser fingerprint / cookie value
  message_count int         not null default 0,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. Chats
-- ------------------------------------------------------------
create table public.chats (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users (id) on delete cascade, -- null = anonymous
  title      text        not null default 'New Chat',
  model      text        not null default 'gpt-4o-mini',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. Messages
-- ------------------------------------------------------------
create table public.messages (
  id         uuid        primary key default gen_random_uuid(),
  chat_id    uuid        not null references public.chats (id) on delete cascade,
  role       text        not null check (role in ('user', 'assistant', 'system')),
  content    text        not null default '',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. Attachments (images, documents)
-- ------------------------------------------------------------
create table public.attachments (
  id           uuid        primary key default gen_random_uuid(),
  chat_id      uuid        not null references public.chats (id) on delete cascade,
  message_id   uuid        references public.messages (id) on delete cascade,
  storage_path text        not null, -- Supabase Storage path
  file_name    text        not null,
  mime_type    text        not null,
  size_bytes   int         not null,
  extracted_text text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. Indexes for common queries
-- ------------------------------------------------------------

-- sidebar list: user's chats ordered by most-recently active
create index idx_chats_user_updated
  on public.chats (user_id, updated_at desc);

-- chat history: messages in chronological order
create index idx_messages_chat_created
  on public.messages (chat_id, created_at asc);

-- attachments by parent message
create index idx_attachments_message
  on public.attachments (message_id);

-- pending / chat-scoped attachments
create index idx_attachments_chat_created
  on public.attachments (chat_id, created_at asc);

-- ------------------------------------------------------------
-- 7. Trigger: bump chats.updated_at on every new message
-- ------------------------------------------------------------
create or replace function public.touch_chat_on_message()
  returns trigger
  language plpgsql
as $$
begin
  update public.chats
  set    updated_at = now()
  where  id = new.chat_id;
  return new;
end;
$$;

create trigger trg_touch_chat_on_message
  after insert on public.messages
  for each row
  execute function public.touch_chat_on_message();

-- ------------------------------------------------------------
-- 8. Storage bucket: attachments (private, service-role only)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;
