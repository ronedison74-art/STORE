import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { listRecords } from '../server/transactions.functions'
import { PRIVILEGES, privilegeLabel, statusBadgeClass } from '../lib/privileges'

export const Route = createFileRoute('/admin/records')({
  loader: () => listRecords({ data: {} }),
  component: RecordsPage,
})

const STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Not Confirmed']

function RecordsPage() {
  const initial = Route.useLoaderData()
  const [rows, setRows] = useState(initial)
  const [filters, setFilters] = useState({
    cadetSearch: '',
    privilege: '',
    status: '',
    violation: '',
    dateFrom: '',
    dateTo: '',
  })
  const [loading, setLoading] = useState(false)

  async function applyFilters() {
    setLoading(true)
    try {
      const data: Record<string, string> = {}
      Object.entries(filters).forEach(([k, v]) => {
        if (v) data[k] = v
      })
      const result = await listRecords({ data })
      setRows(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Records</h1>
      <p className="page-subtitle mb-6">Complete transaction history — nothing is ever deleted</p>

      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
          <input
            className="input"
            placeholder="Search cadet…"
            value={filters.cadetSearch}
            onChange={(e) => setFilters((f) => ({ ...f, cadetSearch: e.target.value }))}
          />
          <select
            className="input"
            value={filters.privilege}
            onChange={(e) => setFilters((f) => ({ ...f, privilege: e.target.value }))}
          >
            <option value="">All Privileges</option>
            {PRIVILEGES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filters.violation}
            onChange={(e) => setFilters((f) => ({ ...f, violation: e.target.value }))}
          >
            <option value="">Violation: Any</option>
            <option value="yes">Violation: Yes</option>
            <option value="no">Violation: No</option>
          </select>
          <input
            type="date"
            className="input"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          />
          <button className="btn btn-primary" disabled={loading} onClick={applyFilters}>
            {loading ? 'Loading…' : 'Apply Filters'}
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Cadet</th>
              <th>Privilege</th>
              <th>Qty</th>
              <th>Merit Cost</th>
              <th>Availment Date</th>
              <th>Confirmation Date</th>
              <th>Status</th>
              <th>Merits Deducted</th>
              <th>Violation</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t: any) => (
              <tr key={t.id}>
                <td>{t.transactionCode}</td>
                <td>{t.cadetName}</td>
                <td>{privilegeLabel(t.privilege)}</td>
                <td>
                  {t.quantity != null ? `${t.quantity} ${t.quantityType} (${t.conversionRate}:1)` : '—'}
                </td>
                <td>{t.meritCost}</td>
                <td>{t.availmentDate}</td>
                <td>{t.confirmationDate ?? '—'}</td>
                <td>
                  <span className={statusBadgeClass(t.status)}>{t.status}</span>
                </td>
                <td>{t.meritsDeducted}</td>
                <td>
                  {t.violation ? (
                    <span className="badge badge-bad">Yes</span>
                  ) : (
                    <span className="badge badge-ok">No</span>
                  )}
                </td>
                <td>{t.remarks ?? '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="page-subtitle text-center py-6">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
