'use client'

import { type FormEvent, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  onClose: () => void
  onSwitchToLogin: () => void
}

export function SignupModal({ onClose, onSwitchToLogin }: Props) {
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      await signup({ email, password, displayName: displayName || undefined })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='signup-title'
    >
      <div className='w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 id='signup-title' className='text-lg font-semibold'>
            Create account
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            aria-label='Close'
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
          <input
            type='text'
            placeholder='Display name (optional)'
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className='rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800'
          />
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className='rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800'
          />
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className='rounded-md border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800'
          />

          {error === null ? null : (
            <p className='text-sm text-red-500'>{error}</p>
          )}

          <button
            type='submit'
            disabled={isPending}
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
          >
            {isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className='mt-4 text-center text-sm text-neutral-500'>
          Already have an account?{' '}
          <button
            type='button'
            onClick={onSwitchToLogin}
            className='text-blue-600 hover:underline dark:text-blue-400'
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
