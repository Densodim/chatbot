'use client'

import Link from 'next/link'

type Props = {
  remainingMessages: number
  totalMessages: number
}

export function AnonymousBanner({ remainingMessages, totalMessages }: Props) {
  const hasReachedLimit = remainingMessages <= 0

  return (
    <div className='border-b border-[color:var(--color-border)] bg-white/90 px-4 py-3 backdrop-blur sm:px-6'>
      <div
        className={`mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-[28px] border px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
          hasReachedLimit
            ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/8'
            : 'border-[color:var(--color-border)] bg-[color:var(--color-panel)]'
        }`}
      >
        <div>
          <p className='font-medium text-[color:var(--color-foreground)]'>
            {hasReachedLimit
              ? 'Free limit reached'
              : `${remainingMessages} of ${totalMessages} free messages remaining`}
          </p>
          <p className='text-sm text-[color:var(--color-muted-foreground)]'>
            {hasReachedLimit
              ? 'Sign up to keep chatting, save your history, and continue this workspace.'
              : 'Anonymous chats stay on this browser only until you create an account.'}
          </p>
        </div>

        <div className='flex gap-3'>
          <Link
            href='/'
            className='inline-flex items-center justify-center rounded-2xl bg-[color:var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[color:var(--color-accent-foreground)] transition hover:bg-[color:var(--color-accent-strong)]'
          >
            {hasReachedLimit ? 'Create account' : 'Sign up'}
          </Link>
        </div>
      </div>
    </div>
  )
}
