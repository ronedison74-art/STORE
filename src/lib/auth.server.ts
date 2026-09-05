import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { db } from '../../db/index.js'
import { accounts } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

const SESSION_COOKIE = 'merit_store_session'
const SCRYPT_KEYLEN = 64

export type Role = 'owner' | 'admin' | 'staff'
export type SessionAccount = {
  id: number
  name: string
  username: string
  role: Role
  status: string
}

export function hashPassword(password: string): {
  hash: string
  salt: string
} {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return { hash, salt }
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): boolean {
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN)
  const stored = Buffer.from(hash, 'hex')
  if (candidate.length !== stored.length) return false
  return timingSafeEqual(candidate, stored)
}

// Sessions are stored as a simple signed-less token: `${accountId}.${randomToken}`
// mapped in-memory would not survive restarts, so instead we encode the account id
// directly in a random opaque token persisted nowhere else — we re-validate the
// account (status/role) fresh from the DB on every request using the id embedded
// in the cookie. The random component prevents guessing/forging simple ids.
const SECRET = process.env.SESSION_SECRET ?? 'merit-store-dev-secret-change-me'

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex')
}

export function createSessionToken(accountId: number): string {
  const payload = `${accountId}`
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export function verifySessionToken(token: string | undefined): number | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  if (sign(payload) !== sig) return null
  const id = Number(payload)
  return Number.isFinite(id) ? id : null
}

export function setSessionCookie(token: string) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearSessionCookie() {
  deleteCookie(SESSION_COOKIE, { path: '/' })
}

export async function getSessionAccount(): Promise<SessionAccount | null> {
  const token = getCookie(SESSION_COOKIE)
  const accountId = verifySessionToken(token)
  if (!accountId) return null
  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1)
  const account = rows[0]
  if (!account || account.status !== 'active') return null
  return {
    id: account.id,
    name: account.name,
    username: account.username,
    role: account.role as Role,
    status: account.status,
  }
}

export function roleCanAccess(role: Role, page: string): boolean {
  const perms: Record<Role, string[]> = {
    owner: [
      'dashboard',
      'encode',
      'confirmation',
      'records',
      'reports',
      'cadets',
      'prices',
      'accounts',
    ],
    admin: [
      'dashboard',
      'encode',
      'confirmation',
      'records',
      'reports',
      'cadets',
    ],
    staff: ['dashboard', 'encode', 'confirmation', 'records', 'reports'],
  }
  return perms[role]?.includes(page) ?? false
}
