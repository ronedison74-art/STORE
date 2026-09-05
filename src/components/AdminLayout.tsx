import { Link, useRouter } from '@tanstack/react-router'
import { Logo } from './Logo'
import { ROLE_NAV } from '../lib/privileges'
import { logout } from '../server/auth.functions'
import type { SessionAccount } from '../lib/auth.server'

export function AdminLayout({
  account,
  currentPath,
  children,
}: {
  account: SessionAccount
  currentPath: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const nav = ROLE_NAV[account.role] ?? []

  async function handleLogout() {
    await logout()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen">
      <header className="topnav">
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="brand-mark">
            <Logo size={30} />
            Fleet <span className="brand-accent">[Merits]</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="page-subtitle">
              {account.name} &middot; <span className="capitalize">{account.role}</span>
            </span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="sidebar">
          <nav>
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${currentPath === item.to ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
