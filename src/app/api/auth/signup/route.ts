import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { setSessionCookies } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { ProfileInsert } from '@/types/db'

type SignupBody = {
  email: string
  password: string
  displayName?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as SignupBody
  const { email, password, displayName } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password required' },
      { status: 400 },
    )
  }

  // Service role bypasses email confirmation.
  const { data: createData, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (createError || !createData.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create account' },
      { status: 400 },
    )
  }

  const profileInsert: ProfileInsert = {
    id: createData.user.id,
    display_name: displayName ?? null,
  }
  await supabaseAdmin.from('profiles').insert(profileInsert)

  // Sign in immediately so the user gets a session.
  const { data: signInData, error: signInError } =
    await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

  if (signInError || !signInData.session) {
    // Account created but auto-login failed — client should call /api/auth/login.
    return NextResponse.json(
      {
        user: {
          id: createData.user.id,
          email: createData.user.email ?? null,
          displayName: displayName ?? null,
        },
      },
      { status: 201 },
    )
  }

  await setSessionCookies(
    signInData.session.access_token,
    signInData.session.refresh_token,
    signInData.session.expires_in,
  )

  return NextResponse.json(
    {
      user: {
        id: createData.user.id,
        email: createData.user.email ?? null,
        displayName: displayName ?? null,
      },
    },
    { status: 201 },
  )
}
