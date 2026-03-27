import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { setSessionCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

type LoginBody = {
  email: string
  password: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as LoginBody
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password required' },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? 'Invalid credentials' },
      { status: 401 },
    )
  }

  await setSessionCookies(
    data.session.access_token,
    data.session.refresh_token,
    data.session.expires_in,
  )

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    },
  })
}
