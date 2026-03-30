'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LoginModal } from '@/components/auth/LoginModal'
import { SignupModal } from '@/components/auth/SignupModal'
import { SparklesIcon } from '@/components/icons'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const { user, isLoading } = useAuth()
  const [modal, setModal] = useState<'login' | 'signup' | null>(null)
  let sessionMessage =
    'Anonymous visitors can still see the remaining free-message banner once step 08 is added.'

  if (isLoading) {
    sessionMessage = 'Checking session...'
  } else if (user) {
    sessionMessage = 'Your account is ready. Open chats to continue.'
  }

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(27,94,127,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(243,161,77,0.18),_transparent_28%),var(--color-shell)] px-6 py-12'>
      <div className='absolute inset-0 bg-[linear-gradient(to_bottom,_transparent,_rgba(255,255,255,0.45))]' />

      <main className='relative w-full max-w-5xl rounded-[40px] border border-white/70 bg-white/80 p-8 shadow-2xl shadow-[rgba(15,23,42,0.08)] backdrop-blur md:p-12'>
        <div className='grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center'>
          <section>
            <div className='inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white px-4 py-2 text-sm text-[color:var(--color-muted-foreground)] shadow-sm'>
              <SparklesIcon className='h-4 w-4 text-[color:var(--color-accent)]' />
              Next.js 16 + TanStack Query + streaming chat
            </div>

            <h1 className='mt-6 max-w-2xl font-semibold text-5xl leading-[1.05] tracking-tight text-[color:var(--color-foreground)]'>
              A clean chat workspace for prompts, screenshots, and document
              context.
            </h1>

            <p className='mt-5 max-w-2xl text-lg leading-8 text-[color:var(--color-muted-foreground)]'>
              The interface mirrors a modern ChatGPT workflow: persistent
              sidebar, streaming assistant replies, file attachments, and a
              focused composer built around your REST API and custom hooks.
            </p>

            <div className='mt-8 flex flex-wrap gap-3'>
              {user ? (
                <Link
                  href='/chats'
                  className='rounded-2xl bg-[color:var(--color-accent)] px-5 py-3 font-medium text-[color:var(--color-accent-foreground)] shadow-sm transition hover:bg-[color:var(--color-accent-strong)]'
                >
                  Open chats
                </Link>
              ) : (
                <>
                  <button
                    type='button'
                    onClick={() => setModal('login')}
                    className='rounded-2xl bg-[color:var(--color-accent)] px-5 py-3 font-medium text-[color:var(--color-accent-foreground)] shadow-sm transition hover:bg-[color:var(--color-accent-strong)]'
                  >
                    Sign in
                  </button>
                  <button
                    type='button'
                    onClick={() => setModal('signup')}
                    className='rounded-2xl border border-[color:var(--color-border)] px-5 py-3 font-medium text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-panel)]'
                  >
                    Create account
                  </button>
                </>
              )}
            </div>

            <div className='mt-8 grid gap-4 sm:grid-cols-3'>
              {[
                'Sticky sidebar with saved conversations',
                'Markdown + code rendering for assistant replies',
                'Image and document attachments in one composer',
              ].map(item => (
                <div
                  key={item}
                  className='rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-5 text-sm text-[color:var(--color-foreground)]'
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className='rounded-[32px] border border-[color:var(--color-border)] bg-[color:var(--color-shell)] p-5 shadow-inner'>
            <div className='rounded-[28px] border border-[color:var(--color-border)] bg-white p-4 shadow-sm'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]'>
                  <SparklesIcon className='h-5 w-5' />
                </div>
                <div>
                  <p className='font-medium'>Ready for UI prompt 05</p>
                  <p className='text-sm text-[color:var(--color-muted-foreground)]'>
                    Sidebar, streaming chat and attachment flow are now wired
                    in.
                  </p>
                </div>
              </div>

              <div className='mt-4 space-y-4'>
                <div className='max-w-[85%] rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-4 py-3 text-sm text-[color:var(--color-foreground)]'>
                  Summarize the uploaded brief and suggest next steps.
                </div>
                <div className='ml-auto max-w-[85%] rounded-[24px] bg-[color:var(--color-accent)] px-4 py-3 text-sm text-[color:var(--color-accent-foreground)]'>
                  I can combine the PDF context with the screenshot and stream
                  the answer.
                </div>
                <div className='max-w-[70%] rounded-[24px] border border-[color:var(--color-border)] bg-white px-4 py-3 text-sm text-[color:var(--color-foreground)]'>
                  {sessionMessage}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {modal === 'login' ? (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitchToSignup={() => setModal('signup')}
        />
      ) : null}

      {modal === 'signup' ? (
        <SignupModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => setModal('login')}
        />
      ) : null}
    </div>
  )
}
