import { createFileRoute } from '@tanstack/react-router'
import { dashboardStats } from '../server/transactions.functions'
import { privilegeLabel, statusBadgeClass } from '../lib/privileges'

export const Route = createFileRoute('/admin/')({
  loader: () => dashboardStats(),
  component: DashboardPage,
})

function DashboardPage() {
  const stats = Route.useLoaderData()

  const cards = [
    { label: 'Total Availments', value: stats.totalAvailments },
    { label: 'Pending Confirmation', value: stats.pendingConfirmation },
    { label: 'Merits Deducted', value: stats.meritsDeducted },
    { label: 'Violations', value: stats.violations },
  ]

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle mt-1">Merit Store overview</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="page-subtitle">{c.label}</p>
            <p className="text-3xl font-bold mt-2" style={{ fontFamily: 'Syne' }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold mb-4">Recent Transactions</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Cadet</th>
              <th>Privilege</th>
              <th>Status</th>
              <th>Merits Deducted</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent.map((t: any) => (
              <tr key={t.id}>
                <td>{t.transactionCode}</td>
                <td>{t.cadetName}</td>
                <td>{privilegeLabel(t.privilege)}</td>
                <td>
                  <span className={statusBadgeClass(t.status)}>{t.status}</span>
                </td>
                <td>{t.meritsDeducted}</td>
              </tr>
            ))}
            {stats.recent.length === 0 && (
              <tr>
                <td colSpan={5} className="page-subtitle text-center py-6">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
