import { useState, useEffect } from 'react'
import { api } from './api'
import MetricCard from './components/MetricCard'
import EquityCurve from './components/EquityCurve'
import WinLossDonut from './components/WinLossDonut'
import TopTradesPanel from './components/TopTradesPanel'
import SectorBreakdown from './components/SectorBreakdown'
import MonthlyPerformance from './components/MonthlyPerformance'
import RiskPanel from './components/RiskPanel'
import TradeTable from './components/TradeTable'

function fmt(n, decimals = 2) {
  if (n == null) return '—'
  const s = Math.abs(n).toLocaleString('de-CH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return `${n < 0 ? '-' : ''}€${s}`
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Loading trading data…</p>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.summary(),
      api.equityCurve(),
      api.monthlyPerformance(),
      api.trades(),
      api.sectorBreakdown(),
      api.riskMetrics(),
      api.topTrades(),
    ])
      .then(([summary, equityCurve, monthly, trades, sectors, riskMetrics, topTrades]) => {
        setData({ summary, equityCurve, monthly, trades, sectors, riskMetrics, topTrades })
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return <Spinner />
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-red-300 max-w-md">
        <p className="font-bold mb-1">Failed to load data</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-red-400 mt-2">Make sure the backend is running: <code>uvicorn app:app --port 8000</code></p>
      </div>
    </div>
  )

  const { summary, equityCurve, monthly, trades, sectors, riskMetrics, topTrades } = data
  const ks = summary?.key_stats || {}

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Trading Journal
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {summary?.account_info?.name ?? 'Account'} · Base currency: {summary?.account_info?.currency ?? 'EUR'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-700">
              IBKR PortfolioAnalyst
            </span>
            <span className={`text-xs px-3 py-1 rounded-full border ${
              ks.cumulative_return >= 0
                ? 'bg-green-900/40 text-green-400 border-green-800'
                : 'bg-red-900/40 text-red-400 border-red-800'
            }`}>
              {ks.cumulative_return >= 0 ? '+' : ''}{ks.cumulative_return?.toFixed(2)}% inception
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* Row 1 — Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Total Realized P&L"
            value={fmt(summary?.total_realized_pnl)}
            color={summary?.total_realized_pnl >= 0 ? 'green' : 'red'}
            sub={`Gross loss: ${fmt(-(summary?.gross_loss))}`}
          />
          <MetricCard
            label="Win Rate"
            value={`${summary?.win_rate}%`}
            color={summary?.win_rate >= 50 ? 'green' : 'red'}
            sub={`${summary?.winning_trades}W / ${summary?.losing_trades}L`}
          />
          <MetricCard
            label="Profit Factor"
            value={summary?.profit_factor?.toFixed(4) ?? '—'}
            color={summary?.profit_factor >= 1 ? 'green' : 'red'}
            sub="Gross profit / Gross loss"
          />
          <MetricCard
            label="Risk / Reward"
            value={summary?.risk_reward_ratio?.toFixed(3) ?? '—'}
            color={summary?.risk_reward_ratio >= 1 ? 'green' : 'red'}
            sub="Avg winner / Avg loser"
          />
          <MetricCard
            label="Avg Winner"
            value={fmt(summary?.avg_winner)}
            color="green"
            sub={`Largest: ${fmt(summary?.largest_win)}`}
          />
          <MetricCard
            label="Avg Loser"
            value={fmt(summary?.avg_loser)}
            color="red"
            sub={`Largest: ${fmt(summary?.largest_loss)}`}
          />
        </div>

        {/* Row 2 — Account stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard label="Total Trades" value={summary?.total_trades} color="violet" small />
          <MetricCard label="Open Positions" value={summary?.open_positions} color="yellow" small />
          <MetricCard label="Total Deposits" value={fmt(ks.deposits)} color="neutral" small />
          <MetricCard label="Fees & Commissions" value={fmt(ks.fees_commissions)} color="red" small />
          <MetricCard label="Ending NAV" value={fmt(ks.ending_nav)} color="neutral" small />
        </div>

        {/* Row 3 — Equity curve */}
        <EquityCurve data={equityCurve} />

        {/* Row 4 — Win/Loss + top trades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <WinLossDonut summary={summary} />
          <div className="lg:col-span-2">
            <TopTradesPanel topTrades={topTrades} />
          </div>
        </div>

        {/* Row 5 — Sector + Monthly */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectorBreakdown data={sectors} />
          <MonthlyPerformance data={monthly} />
        </div>

        {/* Row 6 — Risk metrics */}
        <RiskPanel metrics={riskMetrics} keyStats={ks} />

        {/* Row 7 — Trade table */}
        <TradeTable trades={trades} />
      </main>

      <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-600">
        Data from Interactive Brokers PortfolioAnalyst · For informational purposes only
      </footer>
    </div>
  )
}
