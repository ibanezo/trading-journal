import { useState, useMemo } from 'react'

const COLS = [
  { key: 'symbol',               label: 'Symbol',      align: 'left'  },
  { key: 'description',          label: 'Description', align: 'left'  },
  { key: 'sector',               label: 'Sector',      align: 'left'  },
  { key: 'financial_instrument', label: 'Type',        align: 'left'  },
  { key: 'realized_pnl',         label: 'Realized P&L',align: 'right' },
  { key: 'return_pct',           label: 'Return %',    align: 'right' },
  { key: 'result',               label: 'Result',      align: 'center'},
]

function fmt(n) { return (n >= 0 ? '+' : '') + n.toFixed(2) }
function fmtPct(n) { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%' }

export default function TradeTable({ trades }) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState('realized_pnl')
  const [sortDir, setSortDir] = useState(-1)   // -1 = desc
  const [showOpen, setShowOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!trades) return []
    let rows = showOpen ? trades : trades.filter(t => !t.is_open)
    if (query) {
      const q = query.toLowerCase()
      rows = rows.filter(
        t =>
          t.symbol.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.sector.toLowerCase().includes(q)
      )
    }
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'number') return (av - bv) * sortDir
      return String(av).localeCompare(String(bv)) * sortDir
    })
  }, [trades, query, sortKey, sortDir, showOpen])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm text-gray-400 uppercase tracking-widest font-semibold">
          All Trades ({filtered.length})
        </h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showOpen}
              onChange={e => setShowOpen(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-violet-500"
            />
            Show open positions
          </label>
          <input
            type="text"
            placeholder="Search symbol / sector…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200
                       placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 w-56"
          />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-950 z-10">
            <tr>
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-4 py-2 text-${col.align} text-gray-500 uppercase tracking-widest
                              cursor-pointer select-none hover:text-gray-300 whitespace-nowrap`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-violet-400">{sortDir > 0 ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const pnlColor = t.realized_pnl > 0 ? 'text-green-400' : t.realized_pnl < 0 ? 'text-red-400' : 'text-gray-400'
              return (
                <tr key={i} className="border-t border-gray-800/60 hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-2 font-mono text-white">{t.symbol.trim()}</td>
                  <td className="px-4 py-2 text-gray-300 max-w-[200px] truncate">{t.description}</td>
                  <td className="px-4 py-2 text-gray-400">{t.sector}</td>
                  <td className="px-4 py-2 text-gray-400">{t.financial_instrument}</td>
                  <td className={`px-4 py-2 text-right font-bold tabular-nums ${pnlColor}`}>
                    {fmt(t.realized_pnl)} €
                  </td>
                  <td className={`px-4 py-2 text-right tabular-nums ${pnlColor}`}>
                    {fmtPct(t.return_pct)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {t.is_open ? (
                      <span className="bg-violet-900/50 text-violet-300 rounded px-1.5 py-0.5">Open</span>
                    ) : t.result === 'win' ? (
                      <span className="bg-green-900/40 text-green-400 rounded px-1.5 py-0.5">Win</span>
                    ) : (
                      <span className="bg-red-900/40 text-red-400 rounded px-1.5 py-0.5">Loss</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-600">No trades match your search.</div>
        )}
      </div>
    </div>
  )
}
