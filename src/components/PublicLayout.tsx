import { Link } from '@tanstack/react-router'
import { Logo } from './Logo'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="topnav">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/avail" className="brand-mark">
            <Logo size={30} />
            Fleet <span className="brand-accent">[Merits]</span>
          </Link>
          <Link to="/login" className="nav-pill">
            Staff Login
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
