'use client'

import { usePathname } from 'next/navigation'
import { ChatItem } from '@/components/sidebar/ChatItem'
import { useAuth } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'
import { useChatsRealtime } from '@/hooks/useChatsRealtime'

function SidebarSkeleton() {
  const skeletonIds = ['chat-a', 'chat-b', 'chat-c', 'chat-d']

  return (
    <div className='space-y-3'>
      {skeletonIds.map(id => (
        <div
          key={id}
          className='h-16 animate-pulse rounded-2xl bg-[color:var(--color-panel)]'
        />
      ))}
    </div>
  )
}

export function ChatList() {
  const pathname = usePathname()
  const { user, isLoading: isAuthLoading } = useAuth()
  useChatsRealtime(user?.id ?? null)
  const { chats, deleteChat, deletingChatId, isLoading } = useChats(
    !isAuthLoading,
  )

  if (isAuthLoading || isLoading) {
    return <SidebarSkeleton />
  }

  if (chats.length === 0) {
    return (
      <div className='rounded-2xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-5 text-sm text-[color:var(--color-muted-foreground)]'>
        {user
          ? 'No chats yet. Start a new conversation.'
          : 'No guest chats yet. Start a new conversation.'}
      </div>
    )
  }

  return (
    <ul className='space-y-3'>
      {chats.map(chat => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isActive={pathname === `/chats/${chat.id}`}
          isDeleting={deletingChatId === chat.id}
          onDelete={deleteChat}
        />
      ))}
    </ul>
  )
}
