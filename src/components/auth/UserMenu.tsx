'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) {
    return null
  }

  const rawInitials = user.displayName ?? user.email ?? '?'
  const initials = rawInitials.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  const toggleOpen = () => {
    setIsOpen(prev => !prev)
  }

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={toggleOpen}
        className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white'
        aria-label={`User menu for ${user.email ?? 'user'}`}
        aria-expanded={isOpen}
        aria-haspopup='menu'
      >
        {initials}
      </button>

      {isOpen ? (
        <div
          role='menu'
          className='absolute right-0 top-10 w-48 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900'
        >
          <div className='border-b border-neutral-100 px-4 py-2 dark:border-neutral-800'>
            <p className='text-xs text-neutral-500'>Signed in as</p>
            <p className='truncate text-sm font-medium'>{user.email}</p>
          </div>
          <button
            type='button'
            role='menuitem'
            onClick={handleLogout}
            className='w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800'
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
