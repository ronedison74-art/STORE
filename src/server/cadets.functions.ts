import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { cadets } from '../../db/schema.js'
import { asc, eq } from 'drizzle-orm'
import { getSessionAccount } from '../lib/auth.server.js'

async function requireStaff() {
  const account = await getSessionAccount()
  if (!account) throw new Error('Unauthorized')
  return account
}

export const listCadets = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ includeInactive: z.boolean().optional() }).optional())
  .handler(async ({ data }) => {
    await requireStaff()
    const rows = await db.select().from(cadets).orderBy(asc(cadets.name))
    if (data?.includeInactive) return rows
    return rows.filter((c) => c.active)
  })

export const createCadet = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ name: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const account = await requireStaff()
    if (account.role === 'staff') throw new Error('Forbidden')
    const [row] = await db.insert(cadets).values({ name: data.name.trim() }).returning()
    return row
  })

export const updateCadet = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.number(),
      name: z.string().min(1).max(200).optional(),
      active: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const account = await requireStaff()
    if (account.role === 'staff') throw new Error('Forbidden')
    const { id, ...rest } = data
    const [row] = await db
      .update(cadets)
      .set(rest)
      .where(eq(cadets.id, id))
      .returning()
    return row
  })
