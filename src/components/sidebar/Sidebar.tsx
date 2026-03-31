'use client'

import Link from 'next/link'
import { memo, type ReactNode, useMemo } from 'react'
import { UserMenu } from '@/components/auth/UserMenu'
import { ChatList } from '@/components/sidebar/ChatList'
import { NewChatButton } from '@/components/sidebar/NewChatButton'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  isOpen: boolean
  onClose: () => void
}

// Memoized footer content component - prevents re-render when parent changes
const SidebarFooter = memo(function SidebarFooter({
  user,
  isLoading,
}: {
  user: { displayName?: string | null; email?: string | null } | null
  isLoading: boolean
}) {
  // Derived state - computed during render (rerender-derived-state-no-effect)
  const footerContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className='h-14 animate-pulse rounded-xl bg-[#1f1f24]' />
      )
    }

    if (user) {
      return (
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <p className='truncate font-medium text-sm text-[#f2f2f7]'>
              {user.displayName ?? user.email ?? 'Signed in'}
            </p>
            <p className='truncate text-xs text-[#a1a1aa]'>
              {user.email}
            </p>
          </div>
          <UserMenu />
        </div>
      )
    }

    return (
      <div className='space-y-3'>
        <p className='text-sm text-[#a1a1aa]'>
          Sign in to save chats, attachments, and history.
        </p>
        <Link
          href='/'
          className='inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-[#f2f2f7] transition hover:bg-[#1f1f24]'
        >
          Open home
        </Link>
      </div>
    )
  }, [isLoading, user])

  return (
    <div className='mt-4 rounded-xl border border-white/10 bg-[#1a1a1e] p-3'>
      {footerContent}
    </div>
  )
})

// Memoized panel component - prevents unnecessary re-renders
const SidebarPanel = memo(function SidebarPanel({
  onClose,
}: {
  onClose: () => void
}) {
  const { user, isLoading } = useAuth()

  return (
    <div className='flex h-full flex-col border-r border-white/10 bg-[#0d0d0d] px-4 py-4'>
      <div className='mb-4 flex items-center gap-3 px-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2f2f7] text-[#0d0d0f]'>
          <span className='text-sm font-bold'>A</span>
        </div>
        <div>
          <p className='font-semibold text-[#f2f2f7]'>
            Aura Chat
          </p>
        </div>
      </div>

      <NewChatButton onCreated={onClose} />

      <div className='mt-5 min-h-0 flex-1 overflow-y-auto pr-1'>
        <ChatList />
      </div>

      <SidebarFooter user={user} isLoading={isLoading} />
    </div>
  )
})

// Overlay component - extracted to prevent inline function re-creation
const Overlay = memo(function Overlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <div
      className={`fixed inset-0 z-40 bg-black/60 transition md:hidden ${
        isOpen
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
      onClick={onClose}
      aria-hidden='true'
    />
  )
})

export const Sidebar = memo(function Sidebar({ isOpen, onClose }: Props) {
  return (
    <>
      <aside className='hidden h-screen w-[260px] shrink-0 md:block'>
        <SidebarPanel onClose={onClose} />
      </aside>

      <Overlay isOpen={isOpen} onClose={onClose} />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] overflow-y-auto overscroll-contain transition duration-200 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarPanel onClose={onClose} />
      </aside>
    </>
  )
})
