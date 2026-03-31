'use client'

import { memo, useCallback } from 'react'
import { SparklesIcon } from '@/components/icons'

// Static suggestions - hoisted to module level (server-hoist-static-io)
const SUGGESTIONS = [
  'Summarize the attached PDF into a short action plan.',
  'Compare two implementation approaches and recommend one.',
  'Draft a release note from the latest feature changes.',
  'Review this screenshot and suggest UI improvements.',
] as const

type Props = {
  onSuggestion: (value: string) => void
  isDisabled: boolean
}

// Memoized suggestion button - prevents re-render when parent updates
const SuggestionButton = memo(function SuggestionButton({
  suggestion,
  onClick,
  isDisabled,
}: {
  suggestion: string
  onClick: () => void
  isDisabled: boolean
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={isDisabled}
      className='rounded-xl border border-[color:var(--border-default)] bg-[color:var(--bg-card)] px-5 py-4 text-sm text-[color:var(--text-primary)] transition hover:border-[color:var(--border-hover)] hover:bg-[color:var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-60 text-left'
    >
      {suggestion}
    </button>
  )
})

export const EmptyChatState = memo(function EmptyChatState({
  onSuggestion,
  isDisabled,
}: Props) {
  // Stable callback creator - prevents re-renders of child buttons
  const createHandleClick = useCallback(
    (suggestion: string) => () => {
      onSuggestion(suggestion)
    },
    [onSuggestion],
  )

  return (
    <div className='flex flex-1 items-center justify-center px-6 py-10'>
      <div className='w-full max-w-3xl text-center'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--bg-card)] border border-[color:var(--border-default)] text-[color:var(--text-primary)]'>
          <SparklesIcon className='h-7 w-7' />
        </div>
        <h2 className='mt-6 text-xl font-semibold text-[color:var(--text-primary)]'>
          How can I help you today?
        </h2>
        <p className='mx-auto mt-3 max-w-2xl text-[color:var(--text-secondary)]'>
          Start with a message, attach screenshots or docs, and the chat will
          keep the conversation context for you.
        </p>

        <div className='mt-8 grid gap-3 text-left md:grid-cols-2'>
          {SUGGESTIONS.map(suggestion => (
            <SuggestionButton
              key={suggestion}
              suggestion={suggestion}
              onClick={createHandleClick(suggestion)}
              isDisabled={isDisabled}
            />
          ))}
        </div>
      </div>
    </div>
  )
})
