import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentAccount } from '../server/auth.functions'
import { AdminLayout } from '../components/AdminLayout'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    const account = await getCurrentAccount()
    if (!account) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { account }
  },
  component: AdminLayoutRoute,
})

function AdminLayoutRoute() {
  const { account } = Route.useRouteContext()
  const location = Route.useLocation()
  return (
    <AdminLayout account={account} currentPath={location.pathname}>
      <Outlet />
    </AdminLayout>
  )
}
