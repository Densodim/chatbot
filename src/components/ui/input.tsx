'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`
          h-12 w-full rounded-lg 
          bg-[var(--bg-input)] 
          border border-[var(--border-default)]
          px-4
          text-sm text-[var(--text-primary)]
          placeholder:text-[var(--text-tertiary)]
          transition-all duration-200
          hover:border-[var(--border-hover)]
          focus:border-[var(--border-focus)]
          focus-visible:outline-none
          disabled:opacity-50
          ${className || ''}
        `}
        ref={ref}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
