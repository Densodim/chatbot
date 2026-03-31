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
      className='fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--surface-overlay)] backdrop-blur-sm animate-fade-in'
      role='dialog'
      aria-modal='true'
      aria-labelledby='signup-title'
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
              className='h-8 w-8 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
          <CardTitle id='signup-title' className='pt-2 text-xl'>
            Create account
          </CardTitle>
          <CardDescription>Sign up to start chatting</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-[color:var(--text-secondary)]'>
                Display name (optional)
              </label>
              <Input
                type='text'
                placeholder='Your name'
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-[color:var(--text-secondary)]'>
                Email
              </label>
              <Input
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-[color:var(--text-secondary)]'>
                Password
              </label>
              <Input
                type='password'
                placeholder='Create a password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className='rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400'>
                {error}
              </div>
            )}

            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-[color:var(--text-secondary)]'>
              Already have an account?{' '}
              <button
                type='button'
                onClick={onSwitchToLogin}
                className='font-medium text-[color:var(--text-primary)] hover:underline'
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
