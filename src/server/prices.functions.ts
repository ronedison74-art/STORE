import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { prices } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { getSessionAccount } from '../lib/auth.server.js'
import { ensureSeeded } from '../lib/seed.server.js'

export const getPrices = createServerFn({ method: 'GET' }).handler(async () => {
  await ensureSeeded()
  const rows = await db.select().from(prices).where(eq(prices.id, 1)).limit(1)
  return rows[0]
})

const PricesSchema = z.object({
  phonePrice: z.number().int().min(0),
  foodDeliveryPrice: z.number().int().min(0),
  groupFoodDeliveryPrice: z.number().int().min(0),
  libertyPrice: z.number().int().min(0),
  reduceEdMeritsPerEd: z.number().int().min(0),
  offsetDemeritsMeritsPerDemerit: z.number().int().min(0),
})

export const updatePrices = createServerFn({ method: 'POST' })
  .inputValidator(PricesSchema)
  .handler(async ({ data }) => {
    const account = await getSessionAccount()
    if (!account || (account.role !== 'owner' && account.role !== 'admin')) {
      throw new Error('Forbidden')
    }
    const [row] = await db
      .update(prices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(prices.id, 1))
      .returning()
    return row
  })
