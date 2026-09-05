import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { accounts } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { asc } from 'drizzle-orm'
import { getSessionAccount, hashPassword } from '../lib/auth.server.js'

async function requireOwner() {
  const account = await getSessionAccount()
  if (!account || account.role !== 'owner') throw new Error('Forbidden')
  return account
}

export const listAccounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireOwner()
    const rows = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        username: accounts.username,
        role: accounts.role,
        status: accounts.status,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .orderBy(asc(accounts.createdAt))
    return rows
  },
)

export const createAccount = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      username: z.string().min(3).max(50),
      password: z.string().min(6),
      role: z.enum(['admin', 'staff']),
    }),
  )
  .handler(async ({ data }) => {
    await requireOwner()
    const { hash, salt } = hashPassword(data.password)
    const [row] = await db
      .insert(accounts)
      .values({
        name: data.name.trim(),
        username: data.username.trim().toLowerCase(),
        passwordHash: hash,
        passwordSalt: salt,
        role: data.role,
        status: 'pending',
      })
      .returning()
    return row
  })

export const updateAccountStatus = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.number(),
      status: z.enum(['active', 'disabled', 'pending']),
    }),
  )
  .handler(async ({ data }) => {
    await requireOwner()
    const target = (await db.select().from(accounts).where(eq(accounts.id, data.id)).limit(1))[0]
    if (target?.role === 'owner') throw new Error('Cannot modify the owner account')
    const [row] = await db
      .update(accounts)
      .set({ status: data.status })
      .where(eq(accounts.id, data.id))
      .returning()
    return row
  })

export const updateAccountRole = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ id: z.number(), role: z.enum(['admin', 'staff']) }),
  )
  .handler(async ({ data }) => {
    await requireOwner()
    const target = (await db.select().from(accounts).where(eq(accounts.id, data.id)).limit(1))[0]
    if (target?.role === 'owner') throw new Error('Cannot demote the owner account')
    const [row] = await db
      .update(accounts)
      .set({ role: data.role })
      .where(eq(accounts.id, data.id))
      .returning()
    return row
  })
