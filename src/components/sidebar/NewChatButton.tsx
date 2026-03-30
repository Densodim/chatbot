'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PlusIcon } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'

type Props = {
  onCreated?: () => void
}

export function NewChatButton({ onCreated }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { createChat, isCreating } = useChats(user !== null)

  const handleCreateChat = async () => {
    if (!user) {
      toast.error('Sign in to create a chat.')
      router.push('/')
      return
    }

    try {
      const chat = await createChat()
      router.push(`/chats/${chat.id}`)
      onCreated?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create chat.',
      )
    }
  }

  return (
    <button
      type='button'
      onClick={handleCreateChat}
      disabled={isCreating}
      className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--color-accent)] px-4 py-3 font-medium text-[color:var(--color-accent-foreground)] shadow-sm transition hover:bg-[color:var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60'
    >
      <PlusIcon className='h-4 w-4' />
      {isCreating ? 'Creating...' : 'New Chat'}
    </button>
  )
}
