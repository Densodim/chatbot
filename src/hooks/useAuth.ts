'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { AuthUser } from '@/types/auth'

type LoginParams = {
  email: string
  password: string
}

type SignupParams = {
  email: string
  password: string
  displayName?: string
}

// Stable query key — defined at module level to avoid recreation.
const AUTH_QUERY_KEY = ['auth', 'me'] as const

// Hoisted fetch function (server-parallel pattern: no per-render allocation).
async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me')
  if (res.status === 401) {
    return null
  }
  if (!res.ok) {
    throw new Error('Failed to fetch current user')
  }
  const json = (await res.json()) as { user: AuthUser }
  return json.user
}

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: user = null, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const login = useCallback(
    async ({ email, password }: LoginParams): Promise<void> => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        throw new Error(json.error ?? 'Login failed')
      }
      await queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const signup = useCallback(
    async ({ email, password, displayName }: SignupParams): Promise<void> => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
      if (!res.ok) {
        const json = (await res.json()) as { error?: string }
        throw new Error(json.error ?? 'Signup failed')
      }
      await queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const logout = useCallback(async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' })
    await queryClient.invalidateQueries()
    router.push('/')
  }, [queryClient, router])

  return { user, isLoading, login, signup, logout }
}
