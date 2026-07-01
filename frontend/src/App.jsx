import { useState, useEffect, useRef } from 'react'
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

function Spinner({ label = 'Loading trading data…' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-950">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  )
}

function UploadIcon({ className = 'w-12 h-12' }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v-9m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
    </svg>
  )
}

function UploadScreen({ onUpload, uploading, error }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleFiles(files) {
    const file = files[0]
    if (file) onUpload(file)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Trading Journal</h1>
        <p className="text-gray-400 mt-2 text-sm">Upload your IBKR PortfolioAnalyst report to get started</p>
      </div>

      <div
        className={`relative w-full max-w-md rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors select-none
          ${dragging
            ? 'border-violet-500 bg-violet-900/10'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900/40'
          }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true) }}
        onDragLeave={e => { e.preventDefault(); setDragging(false) }}
        onDrop={e => { e.preventDefault(); setDragging(false); if (!uploading) handleFiles(e.dataTransfer.files) }}
      >
        {uploading ? (
          <>
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-violet-300 font-medium">Uploading and parsing…</p>
            <p className="text-gray-500 text-sm mt-1">This may take a moment</p>
          </>
        ) : (
          <>
            <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${dragging ? 'text-violet-400' : 'text-gray-500'}`} />
            <p className="text-gray-200 font-medium">Drop your CSV file here</p>
            <p className="text-gray-500 text-sm mt-1">or click to browse files</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { if (e.target.files[0]) handleFiles(e.target.files) }}
        />
      </div>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm max-w-md w-full">
          {error}
        </div>
      )}

      <p className="mt-6 text-gray-600 text-xs text-center max-w-sm">
        Export a PortfolioAnalyst report from IBKR as a CSV and upload it here.
        Your data never leaves your machine.
      </p>
    </div>
  )
}

export default function App() {
  const [phase, setPhase] = useState('checking')
  const [data, setData] = useState({})
  const [error, setError] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  useEffect(() => {
    api.status()
      .then(s => {
        if (s.data_loaded) {
          loadDashboard()
        } else {
          setPhase('no-data')
        }
      })
      .catch(err => { setError(err.message); setPhase('error') })
  }, [])

  function loadDashboard() {
    setPhase('loading')
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
        setPhase('ready')
      })
      .catch(err => { setError(err.message); setPhase('error') })
  }

  async function handleUpload(file) {
    setUploadError(null)
    setPhase('uploading')
    try {
      await api.uploadFile(file)
      loadDashboard()
    } catch (err) {
      setUploadError(err.message)
      setPhase('no-data')
    }
  }

  if (phase === 'checking' || phase === 'loading') return <Spinner />
  if (phase === 'uploading') return <UploadScreen onUpload={handleUpload} uploading={true} error={null} />
  if (phase === 'no-data') return <UploadScreen onUpload={handleUpload} uploading={false} error={uploadError} />

  if (phase === 'error') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-red-300 max-w-md">
        <p className="font-bold mb-1">Failed to connect to backend</p>
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
            <label className="cursor-pointer flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-full border border-gray-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v-9m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
              Upload New File
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { if (e.target.files[0]) handleUpload(e.target.files[0]) }}
              />
            </label>
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
