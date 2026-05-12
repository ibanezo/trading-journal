function fmt(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2)
}

function TradeRow({ trade, rank }) {
  const isWin = trade.realized_pnl > 0
  return (
    <tr className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
      <td className="py-2 px-3 text-gray-500 text-xs">{rank}</td>
      <td className="py-2 px-3">
        <div className="text-xs text-white font-mono">{trade.symbol.trim()}</div>
        <div className="text-xs text-gray-500 truncate max-w-[140px]">{trade.description}</div>
      </td>
      <td className={`py-2 px-3 text-right text-xs font-bold tabular-nums ${isWin ? 'text-green-400' : 'text-red-400'}`}>
        {fmt(trade.realized_pnl)} €
      </td>
    </tr>
  )
}

export default function TopTradesPanel({ topTrades }) {
  if (!topTrades) return null
  const { top_winners = [], top_losers = [] } = topTrades

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Top Winners</h2>
        </div>
        <table className="w-full">
          <tbody>
            {top_winners.map((t, i) => <TradeRow key={t.symbol} trade={t} rank={i + 1} />)}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Top Losers</h2>
        </div>
        <table className="w-full">
          <tbody>
            {top_losers.map((t, i) => <TradeRow key={t.symbol} trade={t} rank={i + 1} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
