'use client'

import { SparklesIcon } from '@/components/icons'

const SUGGESTIONS = [
  'Summarize the attached PDF into a short action plan.',
  'Compare two implementation approaches and recommend one.',
  'Draft a release note from the latest feature changes.',
  'Review this screenshot and suggest UI improvements.',
]

type Props = {
  onSuggestion: (value: string) => void
  isDisabled: boolean
}

export function EmptyChatState({ onSuggestion, isDisabled }: Props) {
  return (
    <div className='flex flex-1 items-center justify-center px-6 py-10'>
      <div className='w-full max-w-3xl text-center'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] shadow-sm'>
          <SparklesIcon className='h-7 w-7' />
        </div>
        <h2 className='mt-6 font-semibold text-3xl text-[color:var(--color-foreground)]'>
          What should we build, review, or summarize next?
        </h2>
        <p className='mx-auto mt-3 max-w-2xl text-[color:var(--color-muted-foreground)]'>
          Start with a message, attach screenshots or docs, and the chat will
          keep the conversation context for you.
        </p>

        <div className='mt-8 grid gap-3 text-left md:grid-cols-2'>
          {SUGGESTIONS.map(suggestion => (
            <button
              key={suggestion}
              type='button'
              onClick={() => onSuggestion(suggestion)}
              disabled={isDisabled}
              className='rounded-3xl border border-[color:var(--color-border)] bg-white px-5 py-4 text-sm text-[color:var(--color-foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60'
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
