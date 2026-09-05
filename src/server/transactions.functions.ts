import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { transactions, transactionCounter, prices as pricesTable } from '../../db/schema.js'
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { getSessionAccount } from '../lib/auth.server.js'
import { ensureSeeded } from '../lib/seed.server.js'
import { privilegeInfo } from '../lib/privileges.js'

async function requireStaff() {
  const account = await getSessionAccount()
  if (!account) throw new Error('Unauthorized')
  return account
}

async function nextTransactionCode() {
  const [row] = await db
    .update(transactionCounter)
    .set({ value: sql`${transactionCounter.value} + 1` })
    .where(eq(transactionCounter.id, 1))
    .returning()
  return `MS-${String(row.value).padStart(6, '0')}`
}

async function loadCurrentPrices() {
  const rows = await db.select().from(pricesTable).where(eq(pricesTable.id, 1)).limit(1)
  return rows[0]
}

/** Computes the merit cost for a privilege using live prices; used at encode time only. */
async function computeCost(
  privilege: string,
  quantity: number | undefined,
) {
  const info = privilegeInfo(privilege)
  if (!info) throw new Error('Unknown privilege')
  const p = await loadCurrentPrices()
  if (!p) throw new Error('Prices not configured')

  if (info.type === 'regular') {
    const map: Record<string, number> = {
      phone: p.phonePrice,
      food_delivery: p.foodDeliveryPrice,
      group_food_delivery: p.groupFoodDeliveryPrice,
      liberty: p.libertyPrice,
    }
    return { meritCost: map[privilege], conversionRate: null as number | null, quantityType: null as string | null }
  }

  const rate =
    privilege === 'reduce_ed' ? p.reduceEdMeritsPerEd : p.offsetDemeritsMeritsPerDemerit
  const qty = quantity ?? 0
  return {
    meritCost: qty * rate,
    conversionRate: rate,
    quantityType: info.quantityType ?? null,
  }
}

const BulkEncodeSchema = z.object({
  privilege: z.enum(['phone', 'food_delivery', 'group_food_delivery', 'liberty', 'reduce_ed', 'offset_demerits']),
  availmentDate: z.string(),
  remarks: z.string().optional(),
  entries: z.array(
    z.object({
      cadetId: z.number(),
      cadetName: z.string(),
      quantity: z.number().optional(),
    }),
  ).min(1),
})

export const bulkEncode = createServerFn({ method: 'POST' })
  .inputValidator(BulkEncodeSchema)
  .handler(async ({ data }) => {
    const account = await requireStaff()
    const info = privilegeInfo(data.privilege)
    if (!info) throw new Error('Unknown privilege')

    const created = []
    for (const entry of data.entries) {
      const { meritCost, conversionRate, quantityType } = await computeCost(
        data.privilege,
        entry.quantity,
      )
      const code = await nextTransactionCode()
      const [row] = await db
        .insert(transactions)
        .values({
          transactionCode: code,
          cadetId: entry.cadetId,
          cadetName: entry.cadetName,
          privilege: data.privilege,
          privilegeType: info.type,
          quantity: entry.quantity ?? null,
          quantityType,
          conversionRate,
          meritCost,
          availmentDate: data.availmentDate,
          status: 'Pending',
          meritsDeducted: 0,
          violation: false,
         remarks: data.remarks || null,
         createdByAccountId: account.id,
         source: account.role,
        })
        .returning()
      created.push(row)
    }
    return created
  })

export const listPending = createServerFn({ method: 'GET' }).handler(async () => {
  await requireStaff()
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.status, 'Pending'))
    .orderBy(desc(transactions.createdAt))
})

export const confirmTransaction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.number(), confirmed: z.boolean() }))
  .handler(async ({ data }) => {
    await requireStaff()
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, data.id)).limit(1)
    if (!tx) throw new Error('Transaction not found')
    if (tx.status !== 'Pending') throw new Error('Transaction already resolved')

    const today = new Date().toISOString().slice(0, 10)
    let update: Partial<typeof transactions.$inferInsert>

    if (tx.privilegeType === 'regular') {
      update = data.confirmed
        ? { status: 'Confirmed', meritsDeducted: tx.meritCost, violation: false }
        : { status: 'Cancelled', meritsDeducted: 0, violation: false }
    } else {
      update = data.confirmed
        ? { status: 'Confirmed', meritsDeducted: tx.meritCost, violation: false }
        : { status: 'Not Confirmed', meritsDeducted: tx.meritCost, violation: true }
    }
    update.confirmationDate = today

    const [row] = await db
      .update(transactions)
      .set(update)
      .where(eq(transactions.id, data.id))
      .returning()
    return row
  })

const RecordsFilterSchema = z.object({
  cadetSearch: z.string().optional(),
  privilege: z.string().optional(),
  status: z.string().optional(),
  violation: z.string().optional(),
  source: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export const listRecords = createServerFn({ method: 'GET' })
  .inputValidator(RecordsFilterSchema.optional())
  .handler(async ({ data }) => {
    await requireStaff()
    const conditions = []
    if (data?.privilege) conditions.push(eq(transactions.privilege, data.privilege))
    if (data?.status) conditions.push(eq(transactions.status, data.status))
    if (data?.violation === 'yes') conditions.push(eq(transactions.violation, true))
    if (data?.violation === 'no') conditions.push(eq(transactions.violation, false))
    if (data?.source) conditions.push(eq(transactions.source, data.source))
    if (data?.dateFrom) conditions.push(gte(transactions.availmentDate, data.dateFrom))
    if (data?.dateTo) conditions.push(lte(transactions.availmentDate, data.dateTo))

    const rows = await db
      .select()
      .from(transactions)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(transactions.createdAt))

    if (data?.cadetSearch) {
      const q = data.cadetSearch.toLowerCase()
      return rows.filter((r) => r.cadetName.toLowerCase().includes(q))
    }
    return rows
  })

export const dashboardStats = createServerFn({ method: 'GET' }).handler(async () => {
  await requireStaff()
  const all = await db.select().from(transactions)
  return {
    totalAvailments: all.length,
    pendingConfirmation: all.filter((t) => t.status === 'Pending').length,
    meritsDeducted: all.reduce((sum, t) => sum + t.meritsDeducted, 0),
    violations: all.filter((t) => t.violation).length,
    recent: all
      .sort((a, b) => (b.createdAt! > a.createdAt! ? 1 : -1))
      .slice(0, 10),
  }
})
