import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { accounts } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import {
  createSessionToken,
  clearSessionCookie,
  setSessionCookie,
  verifyPassword,
  getSessionAccount,
} from '../lib/auth.server.js'
import { ensureSeeded } from '../lib/seed.server.js'

export const getCurrentAccount = createServerFn({ method: 'GET' }).handler(
  async () => {
    await ensureSeeded()
    return getSessionAccount()
  },
)

export const login = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ username: z.string().min(1), password: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    await ensureSeeded()
    const rows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.username, data.username.trim().toLowerCase()))
      .limit(1)
    const account = rows[0]
    const generic = {
      success: false as const,
      error: 'Invalid credentials or account not active.',
    }
    if (!account) return generic
    if (account.status !== 'active') return generic
    const ok = verifyPassword(
      data.password,
      account.passwordHash,
      account.passwordSalt,
    )
    if (!ok) return generic
    setSessionCookie(createSessionToken(account.id))
    return { success: true as const }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  clearSessionCookie()
  return { success: true }
})
