/** Serializable auth user DTO returned by GET /api/auth/me */
export type AuthUser = {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
}
