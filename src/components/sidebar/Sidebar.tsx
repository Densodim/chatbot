'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { UserMenu } from '@/components/auth/UserMenu'
import { SparklesIcon } from '@/components/icons'
import { ChatList } from '@/components/sidebar/ChatList'
import { NewChatButton } from '@/components/sidebar/NewChatButton'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  isOpen: boolean
  onClose: () => void
}

function SidebarPanel({ onClose }: { onClose: () => void }) {
  const { user, isLoading } = useAuth()
  let footerContent: ReactNode

  if (isLoading) {
    footerContent = (
      <div className='h-14 animate-pulse rounded-xl bg-[color:var(--color-panel)]' />
    )
  } else if (user) {
    footerContent = (
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <p className='truncate font-medium text-sm text-[color:var(--color-foreground)]'>
            {user.displayName ?? user.email ?? 'Signed in'}
          </p>
          <p className='truncate text-xs text-[color:var(--color-muted-foreground)]'>
            {user.email}
          </p>
        </div>
        <UserMenu />
      </div>
    )
  } else {
    footerContent = (
      <div className='space-y-3'>
        <p className='text-sm text-[color:var(--color-muted-foreground)]'>
          Sign in to save chats, attachments, and history.
        </p>
        <Link
          href='/'
          className='inline-flex rounded-xl border border-[color:var(--color-border)] px-3 py-2 text-sm font-medium text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-panel)]'
        >
          Open home
        </Link>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-sidebar)] px-4 py-4'>
      <div className='mb-4 flex items-center gap-3 px-2'>
        <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] shadow-sm'>
          <SparklesIcon className='h-5 w-5' />
        </div>
        <div>
          <p className='font-semibold text-[color:var(--color-foreground)]'>
            Chatbot
          </p>
          <p className='text-xs text-[color:var(--color-muted-foreground)]'>
            Structured AI workspace
          </p>
        </div>
      </div>

      <NewChatButton onCreated={onClose} />

      <div className='mt-5 min-h-0 flex-1 overflow-y-auto pr-1'>
        <ChatList />
      </div>

      <div className='mt-4 rounded-2xl border border-[color:var(--color-border)] bg-white/85 p-3 backdrop-blur'>
        {footerContent}
      </div>
    </div>
  )
}

export function Sidebar({ isOpen, onClose }: Props) {
  return (
    <>
      <aside className='hidden h-screen w-[260px] shrink-0 md:block'>
        <SidebarPanel onClose={onClose} />
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/45 transition md:hidden ${
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden='true'
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] transition duration-200 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarPanel onClose={onClose} />
      </aside>
    </>
  )
}
