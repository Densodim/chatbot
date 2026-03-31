'use client'

import { MessageSquare, Shield, Sparkles, Zap } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { memo, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

// Dynamic imports for heavy modal components - bundle optimization
const LoginModal = dynamic(
  () =>
    import('@/components/auth/LoginModal').then(m => ({
      default: m.LoginModal,
    })),
  {
    ssr: false,
  },
)

const SignupModal = dynamic(
  () =>
    import('@/components/auth/SignupModal').then(m => ({
      default: m.SignupModal,
    })),
  {
    ssr: false,
  },
)

// Static feature data - hoisted to module level (server-hoist-static-io)
const FEATURES = [
  { icon: MessageSquare, text: 'Natural conversations' },
  { icon: Zap, text: 'Streaming responses' },
  { icon: Shield, text: 'Secure & private' },
] as const

// Memoized feature card component - prevents unnecessary re-renders
const FeatureCard = memo(function FeatureCard({
  icon: Icon,
  text,
}: {
  icon: typeof MessageSquare
  text: string
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-[color:var(--border-default)] bg-[color:var(--bg-card)] px-4 py-3 text-sm text-[color:var(--text-primary)]'>
      <Icon className='h-4 w-4 text-[color:var(--text-secondary)]' />
      {text}
    </div>
  )
})

export default function Home() {
  const { user, isLoading } = useAuth()
  const [modal, setModal] = useState<'login' | 'signup' | null>(null)

  // Derived state - computed during render, not in effect (rerender-derived-state-no-effect)
  const authButtons = useMemo(() => {
    if (user) {
      return (
        <Link href='/chats'>
          <Button size='lg'>Open chats</Button>
        </Link>
      )
    }
    return (
      <>
        <Link href='/chats'>
          <Button size='lg'>Try as guest</Button>
        </Link>
        <Button
          variant='secondary'
          size='lg'
          onClick={() => setModal('signup')}
        >
          Create account
        </Button>
      </>
    )
  }, [user])

  return (
    <div className='relative flex min-h-screen flex-col bg-[color:var(--bg-primary)]'>
      {/* Header */}
      <header className='border-b border-[color:var(--border-default)] bg-[color:var(--bg-secondary)] px-4 py-3'>
        <div className='mx-auto flex max-w-5xl items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--text-primary)] text-[color:var(--bg-primary)]'>
              <span className='text-sm font-bold'>A</span>
            </div>
            <span className='text-lg font-semibold text-[color:var(--text-primary)]'>
              Aura Chat
            </span>
          </div>

          <div className='flex items-center gap-2'>
            {isLoading ? (
              <div className='h-10 w-24 animate-pulse rounded-lg bg-[color:var(--bg-hover)]' />
            ) : user ? (
              <Link href='/chats'>
                <Button>Open chats</Button>
              </Link>
            ) : (
              <>
                <Button variant='ghost' onClick={() => setModal('login')}>
                  Sign in
                </Button>
                <Button onClick={() => setModal('signup')}>Get started</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className='flex-1 px-4 py-12'>
        <div className='mx-auto max-w-5xl'>
          <div className='grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center'>
            <section className='text-center lg:text-left'>
              <div className='inline-flex items-center gap-2 rounded-full border border-[color:var(--border-default)] bg-[color:var(--bg-card)] px-4 py-2 text-sm text-[color:var(--text-secondary)]'>
                <Sparkles className='h-4 w-4 text-[color:var(--text-primary)]' />
                AI-powered conversations
              </div>

              <h1 className='mt-6 text-4xl font-semibold leading-tight text-[color:var(--text-primary)] lg:text-5xl'>
                Chat smarter with <br />
                <span className='text-gradient'>Aura Chat</span>
              </h1>

              <p className='mt-4 max-w-xl text-lg text-[color:var(--text-secondary)]'>
                A clean, modern chat interface for your AI conversations.
                Support for images, documents, and streaming responses.
              </p>

              <div className='mt-8 flex flex-wrap justify-center gap-3 lg:justify-start'>
                {authButtons}
              </div>

              <div className='mt-8 grid gap-3 sm:grid-cols-3'>
                {FEATURES.map(({ icon, text }) => (
                  <FeatureCard key={text} icon={icon} text={text} />
                ))}
              </div>
            </section>

            {/* Preview Card - Static JSX hoisted mentally, rendered once */}
            <PreviewCard />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t border-[color:var(--border-default)] bg-[color:var(--bg-secondary)] px-4 py-6'>
        <div className='mx-auto max-w-5xl text-center text-sm text-[color:var(--text-tertiary)]'>
          Built with Next.js, Tailwind CSS, and AI
        </div>
      </footer>

      {modal === 'login' && (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitchToSignup={() => setModal('signup')}
        />
      )}

      {modal === 'signup' && (
        <SignupModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => setModal('login')}
        />
      )}
    </div>
  )
}

// Hoisted component - prevents re-creation on every render (rerender-no-inline-components)
const PreviewCard = memo(function PreviewCard() {
  return (
    <section className='hidden lg:block'>
      <div className='rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--bg-card)] p-4'>
        <div className='space-y-4'>
          <div className='flex items-start gap-3'>
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--bg-hover)] border border-[color:var(--border-default)]'>
              <span className='text-xs font-bold text-[color:var(--text-secondary)]'>
                A
              </span>
            </div>
            <div className='rounded-xl border border-[color:var(--border-default)] bg-[color:var(--bg-hover)] px-4 py-3 text-sm text-[color:var(--text-primary)]'>
              How can I help you today?
            </div>
          </div>

          <div className='flex items-start justify-end gap-3'>
            <div className='rounded-xl bg-[color:var(--text-primary)] px-4 py-3 text-sm text-[color:var(--bg-primary)]'>
              Help me write a React component
            </div>
          </div>

          <div className='flex items-start gap-3'>
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--bg-hover)] border border-[color:var(--border-default)]'>
              <span className='text-xs font-bold text-[color:var(--text-secondary)]'>
                A
              </span>
            </div>
            <div className='rounded-xl border border-[color:var(--border-default)] bg-[color:var(--bg-hover)] px-4 py-3 text-sm text-[color:var(--text-primary)]'>
              Here&apos;s a simple React component using hooks...
              <pre className='mt-2 rounded-lg bg-[color:var(--bg-card)] p-2 text-xs'>
                {`function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})
