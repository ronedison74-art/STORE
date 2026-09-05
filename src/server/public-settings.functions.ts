import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { publicSettings } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { getSessionAccount } from '../lib/auth.server.js'
import { ensureSeeded } from '../lib/seed.server.js'

export const getPublicSettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    await ensureSeeded()
    const rows = await db
      .select()
      .from(publicSettings)
      .where(eq(publicSettings.id, 1))
      .limit(1)
    return rows[0]
  },
)

const SettingsSchema = z.object({
  enabled: z.boolean(),
  sessionDate: z.string().nullable(),
  openTime: z.string().nullable(),
  closeTime: z.string().nullable(),
  allowedPrivileges: z.array(z.string()),
})

export const updatePublicSettings = createServerFn({ method: 'POST' })
  .inputValidator(SettingsSchema)
  .handler(async ({ data }) => {
    const account = await getSessionAccount()
    if (!account || account.role !== 'owner') throw new Error('Forbidden')
    const [row] = await db
      .update(publicSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(publicSettings.id, 1))
      .returning()
    return row
  })

/** Server-side gate check used by the public /avail route. */
export const getAvailabilityStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    await ensureSeeded()
    const rows = await db
      .select()
      .from(publicSettings)
      .where(eq(publicSettings.id, 1))
      .limit(1)
    const settings = rows[0]
    if (!settings || !settings.enabled || !settings.sessionDate) {
      return { open: false as const, settings }
    }
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    if (settings.sessionDate !== todayStr) {
      return { open: false as const, settings }
    }
    if (settings.openTime && settings.closeTime) {
      const nowTime = now.toTimeString().slice(0, 5)
      if (nowTime < settings.openTime || nowTime > settings.closeTime) {
        return { open: false as const, settings }
      }
    }
    return { open: true as const, settings }
  },
)
