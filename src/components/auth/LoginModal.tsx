'use client'

import { X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
      className='fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--surface-overlay)] backdrop-blur-sm animate-fade-in'
      role='dialog'
      aria-modal='true'
      aria-labelledby='login-title'
    >
      <Card className='w-full max-w-[400px] border-[color:var(--border-default)] shadow-xl'>
        <CardHeader className='space-y-1'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--text-primary)] text-[color:var(--bg-primary)]'>
                <span className='text-sm font-bold'>A</span>
              </div>
              <span className='text-lg font-semibold text-[color:var(--text-primary)]'>
                Aura Chat
              </span>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              aria-label='Close login modal'
              className='h-8 w-8 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
            >
              <X className='h-4 w-4' aria-hidden='true' />
            </Button>
          </div>
          <CardTitle id='login-title' className='pt-2 text-xl'>
            Welcome back
          </CardTitle>
          <CardDescription>Sign in to continue chatting</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label
                htmlFor='login-email'
                className='text-sm font-medium text-[color:var(--text-secondary)]'
              >
                Email
              </label>
              <Input
                id='login-email'
                type='email'
                name='email'
                autoComplete='email'
                spellCheck={false}
                placeholder='Enter your email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <label
                htmlFor='login-password'
                className='text-sm font-medium text-[color:var(--text-secondary)]'
              >
                Password
              </label>
              <Input
                id='login-password'
                type='password'
                name='password'
                autoComplete='current-password'
                spellCheck={false}
                placeholder='Enter your password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className='rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400'>
                {error}
              </div>
            )}

            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-[color:var(--text-secondary)]'>
              Don&apos;t have an account?{' '}
              <button
                type='button'
                onClick={onSwitchToSignup}
                className='font-medium text-[color:var(--text-primary)] hover:underline'
              >
                Create one
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
