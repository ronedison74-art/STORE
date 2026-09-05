import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { listCadets } from '../server/cadets.functions'
import { getPrices } from '../server/prices.functions'
import { bulkEncode } from '../server/transactions.functions'
import { PRIVILEGES, privilegeInfo } from '../lib/privileges'

export const Route = createFileRoute('/admin/encode')({
  loader: async () => {
    const [cadets, prices] = await Promise.all([listCadets(), getPrices()])
    return { cadets, prices }
  },
  component: EncodePage,
})

function priceFor(privilege: string, prices: any): number {
  switch (privilege) {
    case 'phone':
      return prices.phonePrice
    case 'food_delivery':
      return prices.foodDeliveryPrice
    case 'group_food_delivery':
      return prices.groupFoodDeliveryPrice
    case 'liberty':
      return prices.libertyPrice
    default:
      return 0
  }
}

function rateFor(privilege: string, prices: any): number {
  return privilege === 'reduce_ed'
    ? prices.reduceEdMeritsPerEd
    : prices.offsetDemeritsMeritsPerDemerit
}

function EncodePage() {
  const { cadets, prices } = Route.useLoaderData()
  const [privilege, setPrivilege] = useState(PRIVILEGES[0].key)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [availmentDate, setAvailmentDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [remarks, setRemarks] = useState('')
  const [search, setSearch] = useState('')
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [result, setResult] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const info = privilegeInfo(privilege)!
  const filtered = cadets.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map((c: any) => c.id)))
  }
  function clearAll() {
    setSelected(new Set())
  }

  const entries = useMemo(() => {
    return Array.from(selected).map((id) => {
      const cadet = cadets.find((c: any) => c.id === id)
      const qty = quantities[id] ?? 0
      return { cadetId: id, cadetName: cadet?.name ?? '', quantity: qty }
    })
  }, [selected, quantities, cadets])

  const total = useMemo(() => {
    if (info.type === 'regular') {
      return selected.size * priceFor(privilege, prices)
    }
    const rate = rateFor(privilege, prices)
    return entries.reduce((sum, e) => sum + (e.quantity ?? 0) * rate, 0)
  }, [info, privilege, prices, selected, entries])

  async function handleSubmit() {
    setSubmitting(true)
    setResult(null)
    try {
      const payload =
        info.type === 'regular'
          ? entries.map((e) => ({ ...e, quantity: undefined }))
          : entries
      const created = await bulkEncode({
        data: {
          privilege,
          availmentDate,
          remarks,
          entries: payload,
        },
      })
      setResult(`Created ${created.length} transaction(s).`)
      setSelected(new Set())
      setQuantities({})
      setStep('form')
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Failed to encode.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">New Availment</h1>
      <p className="page-subtitle mt-1">Bulk-encode availments for one or more cadets</p>

      {result && (
        <div className="card mt-4" style={{ borderColor: 'var(--acc)' }}>
          {result}
        </div>
      )}

      {step === 'form' && (
        <div className="card mt-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="page-subtitle block mb-1.5">Privilege</label>
              <select
                className="input"
                value={privilege}
                onChange={(e) => {
                  setPrivilege(e.target.value as any)
                  setQuantities({})
                }}
              >
                {PRIVILEGES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="page-subtitle block mb-1.5">Availment Date</label>
              <input
                type="date"
                className="input"
                value={availmentDate}
                onChange={(e) => setAvailmentDate(e.target.value)}
              />
            </div>
          </div>

          {info.type === 'regular' && (
            <p className="page-subtitle">
              Price per cadet:{' '}
              <strong style={{ color: 'var(--tx)' }}>
                {priceFor(privilege, prices)} merits
              </strong>
            </p>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="page-subtitle">Cadets ({selected.size} selected)</label>
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={selectAll} type="button">
                  Select All
                </button>
                <button className="btn btn-ghost" onClick={clearAll} type="button">
                  Clear All
                </button>
              </div>
            </div>
            <input
              className="input mb-3"
              placeholder="Search cadets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div
              className="card"
              style={{ maxHeight: 320, overflowY: 'auto', padding: 8 }}
            >
              {info.type === 'accountability' ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Cadet</th>
                      <th>{info.quantityLabel}</th>
                      <th>Rate</th>
                      <th>Merits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: any) => (
                      <tr key={c.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected.has(c.id)}
                            onChange={() => toggle(c.id)}
                          />
                        </td>
                        <td>{c.name}</td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            className="input"
                            style={{ width: 90 }}
                            disabled={!selected.has(c.id)}
                            value={quantities[c.id] ?? 0}
                            onChange={(e) =>
                              setQuantities((q) => ({
                                ...q,
                                [c.id]: Number(e.target.value),
                              }))
                            }
                          />
                        </td>
                        <td>{rateFor(privilege, prices)}</td>
                        <td>{(quantities[c.id] ?? 0) * rateFor(privilege, prices)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col gap-1">
                  {filtered.map((c: any) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              )}
              {filtered.length === 0 && (
                <p className="page-subtitle text-center py-4">No active cadets found.</p>
              )}
            </div>
          </div>

          <div>
            <label className="page-subtitle block mb-1.5">Remarks (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--bor)' }}>
            <p>
              Total: <strong style={{ color: 'var(--acc)' }}>{total} merits</strong>
            </p>
            <button
              className="btn btn-primary"
              disabled={selected.size === 0}
              onClick={() => setStep('review')}
            >
              Review
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="card mt-6">
          <h2 className="font-semibold mb-4">Bulk Availment Summary</h2>
          <p className="page-subtitle mb-3">
            {info.label} &middot; {availmentDate} &middot; {entries.length} cadet(s)
          </p>
          <table className="data-table mb-4">
            <thead>
              <tr>
                <th>Cadet</th>
                {info.type === 'accountability' && <th>{info.quantityLabel}</th>}
                <th>Merits</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.cadetId}>
                  <td>{e.cadetName}</td>
                  {info.type === 'accountability' && <td>{e.quantity}</td>}
                  <td>
                    {info.type === 'regular'
                      ? priceFor(privilege, prices)
                      : (e.quantity ?? 0) * rateFor(privilege, prices)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mb-4">
            Total: <strong style={{ color: 'var(--acc)' }}>{total} merits</strong>
          </p>
          <div className="flex gap-3">
            <button className="btn btn-ghost" onClick={() => setStep('form')}>
              Back
            </button>
            <button className="btn btn-success" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Saving…' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
