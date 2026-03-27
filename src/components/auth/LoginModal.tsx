'use client'

import { type FormEvent, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  onClose: () => void
  onSwitchToSignup: () => void
}

export function LoginModal({ onClose, onSwitchToSignup }: Props) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      await login({ email, password })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='login-title'
    >
      <div className='w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 id='login-title' className='text-lg font-semibold'>
            Sign in
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
            {isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className='mt-4 text-center text-sm text-neutral-500'>
          {"Don't have an account? "}
          <button
            type='button'
            onClick={onSwitchToSignup}
            className='text-blue-600 hover:underline dark:text-blue-400'
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
