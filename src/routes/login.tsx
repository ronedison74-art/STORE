import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Logo } from '../components/Logo'
import { getCurrentAccount, login } from '../server/auth.functions'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const account = await getCurrentAccount()
    if (account) throw redirect({ to: '/admin' })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await login({ data: { username, password } })
      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }
      await navigate({ to: '/admin' })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Logo size={40} />
          <h1 className="page-title mt-3">
            Fleet <span className="brand-accent">[Merits]</span>
          </h1>
          <p className="page-subtitle mt-1">Merit Store staff sign in</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="page-subtitle block mb-1.5">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="page-subtitle block mb-1.5">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-sm" style={{ color: 'var(--bad)' }}>
              {error}
            </p>
          )}
          <button className="btn btn-primary w-full mt-1" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
