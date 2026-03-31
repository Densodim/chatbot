'use client'

import Link from 'next/link'

type Props = {
  remainingMessages: number
  totalMessages: number
}

export function AnonymousBanner({ remainingMessages, totalMessages }: Props) {
  const hasReachedLimit = remainingMessages <= 0

  return (
    <div className='border-b border-[color:var(--border-default)] bg-[color:var(--bg-secondary)] px-4 py-3 sm:px-6'>
      <div
        className={`mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
          hasReachedLimit
            ? 'border-red-500/30 bg-red-500/10'
            : 'border-[color:var(--border-default)] bg-[color:var(--bg-card)]'
        }`}
      >
        <div>
          <p className='font-medium text-[color:var(--text-primary)]'>
            {hasReachedLimit
              ? 'Free limit reached'
              : `${remainingMessages} of ${totalMessages} free messages remaining`}
          </p>
          <p className='text-sm text-[color:var(--text-secondary)]'>
            {hasReachedLimit
              ? 'Sign up to keep chatting, save your history, and continue this workspace.'
              : 'Anonymous chats stay on this browser only until you create an account.'}
          </p>
        </div>

        <div className='flex gap-3'>
          <Link
            href='/'
            className='inline-flex items-center justify-center rounded-lg bg-[color:var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[color:var(--bg-primary)] transition hover:bg-[color:var(--accent-hover)]'
          >
            {hasReachedLimit ? 'Create account' : 'Sign up'}
          </Link>
        </div>
      </div>
    </div>
  )
}
