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
          bg-[color:var(--bg-input)] 
          border border-[color:var(--border-default)]
          px-4
          text-sm text-[color:var(--text-primary)]
          placeholder:text-[color:var(--text-tertiary)]
          transition-all duration-200
          hover:border-[color:var(--border-hover)]
          focus:border-[color:var(--border-focus)]
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
