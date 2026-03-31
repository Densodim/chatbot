'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { TrashIcon } from '@/components/icons'
import type { ChatSummary } from '@/hooks/useChats'

type Props = {
  chat: ChatSummary
  isActive: boolean
  isDeleting: boolean
  onDelete: (chatId: string) => Promise<void>
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ChatItem({ chat, isActive, isDeleting, onDelete }: Props) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState(false)

  const handleDelete = () => {
    setIsRemoving(true)

    window.setTimeout(async () => {
      try {
        await onDelete(chat.id)
        if (isActive) {
          router.push('/chats')
        }
      } catch (error) {
        setIsRemoving(false)
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete chat.',
        )
      }
    }, 160)
  }

  return (
    <li
      className={`group transition duration-200 ${
        isRemoving
          ? 'pointer-events-none translate-x-3 opacity-0'
          : 'opacity-100'
      }`}
    >
      <div
        className={`relative rounded-xl border p-3 transition ${
          isActive
            ? 'border-white/10 bg-[#1f1f24]'
            : 'border-transparent bg-[#151518] hover:border-white/10 hover:bg-[#1f1f24]'
        }`}
      >
        <Link href={`/chats/${chat.id}`} className='block pr-10'>
          <p className='truncate font-medium text-sm text-[#f2f2f7]'>
            {chat.title}
          </p>
          <p className='mt-1 text-xs text-[#71717a]'>
            {formatUpdatedAt(chat.updated_at)}
          </p>
        </Link>

        <button
          type='button'
          onClick={() => {
            void handleDelete()
          }}
          disabled={isDeleting}
          className='absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] opacity-0 transition hover:bg-[#25252a] hover:text-[#f2f2f7] group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40'
          aria-label={`Delete ${chat.title}`}
        >
          <TrashIcon className='h-4 w-4' />
        </button>
      </div>
    </li>
  )
}
