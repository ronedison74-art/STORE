import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { listPending, confirmTransaction } from '../server/transactions.functions'
import { privilegeLabel } from '../lib/privileges'

export const Route = createFileRoute('/admin/confirmation')({
  loader: () => listPending(),
  component: ConfirmationPage,
})

function ConfirmationPage() {
  const router = useRouter()
  const pending = Route.useLoaderData()
  const [busyId, setBusyId] = useState<number | null>(null)

  async function resolve(id: number, confirmed: boolean) {
    setBusyId(id)
    try {
      await confirmTransaction({ data: { id, confirmed } })
      await router.invalidate()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="page-title">Confirmation</h1>
      <p className="page-subtitle mb-6">
        Confirm or decline pending privilege availments
      </p>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Cadet</th>
              <th>Privilege</th>
              <th>Merit Cost</th>
              <th>Availment Date</th>
              <th>Qty</th>
              <th className="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((t: any) => (
              <tr key={t.id}>
                <td>{t.transactionCode}</td>
                <td>{t.cadetName}</td>
                <td>{privilegeLabel(t.privilege)}</td>
                <td>{t.meritCost}</td>
                <td>{t.availmentDate}</td>
                <td>{t.quantity ?? '—'}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-success !py-1.5 !px-3 !text-xs"
                      disabled={busyId === t.id}
                      onClick={() => resolve(t.id, true)}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn btn-danger !py-1.5 !px-3 !text-xs"
                      disabled={busyId === t.id}
                      onClick={() => resolve(t.id, false)}
                    >
                      No Confirmation
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan={7} className="page-subtitle text-center py-6">
                  No pending transactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
