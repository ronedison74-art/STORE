import { db } from '../../db/index.js'
import { accounts, prices, transactionCounter } from '../../db/schema.js'
import { hashPassword } from './auth.server.js'

export const DEV_OWNER_USERNAME = 'owner'
export const DEV_OWNER_PASSWORD = 'MeritStore#2026'

let seeded = false

/** Idempotently seeds default prices, counter, and the owner account. */
export async function ensureSeeded() {
  if (seeded) return
  const existingAccounts = await db.select().from(accounts).limit(1)
  if (existingAccounts.length === 0) {
    const { hash, salt } = hashPassword(DEV_OWNER_PASSWORD)
    await db.insert(accounts).values({
      name: 'Store Owner',
      username: DEV_OWNER_USERNAME,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'owner',
      status: 'active',
    })
  }

  const existingPrices = await db.select().from(prices).limit(1)
  if (existingPrices.length === 0) {
    await db.insert(prices).values({ id: 1 })
  }

  const existingCounter = await db.select().from(transactionCounter).limit(1)
  if (existingCounter.length === 0) {
    await db.insert(transactionCounter).values({ id: 1, value: 0 })
  }

  seeded = true
}
