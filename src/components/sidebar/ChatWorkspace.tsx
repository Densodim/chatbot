'use client'

import { type ReactNode, useState } from 'react'
import { MenuIcon } from '@/components/icons'
import { Sidebar } from '@/components/sidebar/Sidebar'

export function ChatWorkspace({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className='flex min-h-screen bg-[var(--bg-primary)]'>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className='relative flex min-h-screen flex-1 flex-col'>
        <div className='sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/90 px-4 py-3 backdrop-blur md:hidden'>
          <button
            type='button'
            onClick={() => setIsSidebarOpen(true)}
            className='inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)]'
            aria-label='Open sidebar'
          >
            <MenuIcon className='h-5 w-5' />
          </button>
        </div>

        <main className='flex min-h-0 flex-1'>{children}</main>
      </div>
    </div>
  )
}
