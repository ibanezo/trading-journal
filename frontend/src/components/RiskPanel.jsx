function RiskCard({ label, value, color = 'neutral', note }) {
  const colorMap = {
    good:    'text-green-400',
    bad:     'text-red-400',
    neutral: 'text-gray-300',
    yellow:  'text-yellow-400',
  }
  return (
    <div className="bg-gray-800/60 rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-lg font-bold tabular-nums ${colorMap[color]}`}>{value}</span>
      {note && <span className="text-xs text-gray-600">{note}</span>}
    </div>
  )
}

function colorForSharpe(v) {
  if (v >= 1) return 'good'
  if (v >= 0) return 'yellow'
  return 'bad'
}

export default function RiskPanel({ metrics, keyStats }) {
  if (!metrics) return null

  const items = [
    {
      label: 'Sharpe Ratio',
      value: metrics.sharpe_ratio?.toFixed(3) ?? '—',
      color: colorForSharpe(metrics.sharpe_ratio),
      note: 'Risk-adjusted return (annualised)',
    },
    {
      label: 'Sortino Ratio',
      value: metrics.sortino_ratio?.toFixed(3) ?? '—',
      color: colorForSharpe(metrics.sortino_ratio),
      note: 'Downside-risk adjusted return',
    },
    {
      label: 'Max Drawdown',
      value: metrics.max_drawdown != null ? `-${metrics.max_drawdown.toFixed(2)}%` : '—',
      color: 'bad',
      note: metrics.peak_to_valley || '',
    },
    {
      label: 'Std Deviation',
      value: metrics.std_deviation != null ? `${metrics.std_deviation.toFixed(2)}%` : '—',
      color: 'neutral',
      note: 'Monthly volatility',
    },
    {
      label: 'Beta (vs SPX)',
      value: metrics.beta_spx?.toFixed(3) ?? '—',
      color: 'neutral',
      note: 'Sensitivity to S&P 500',
    },
    {
      label: 'Alpha (vs SPX)',
      value: metrics.alpha_spx != null ? `${metrics.alpha_spx.toFixed(3)}%` : '—',
      color: metrics.alpha_spx >= 0 ? 'good' : 'bad',
      note: 'Excess monthly return',
    },
    {
      label: 'Best Month',
      value: keyStats?.best_return != null ? `+${keyStats.best_return.toFixed(2)}%` : '—',
      color: 'good',
      note: keyStats?.best_return_date,
    },
    {
      label: 'Worst Month',
      value: keyStats?.worst_return != null ? `${keyStats.worst_return.toFixed(2)}%` : '—',
      color: 'bad',
      note: keyStats?.worst_return_date,
    },
    {
      label: 'Positive Months',
      value: metrics.positive_periods || '—',
      color: 'neutral',
    },
    {
      label: 'Negative Months',
      value: metrics.negative_periods || '—',
      color: 'neutral',
    },
    {
      label: 'Mean Monthly Return',
      value: metrics.mean_return != null ? `${metrics.mean_return.toFixed(2)}%` : '—',
      color: metrics.mean_return >= 0 ? 'good' : 'bad',
    },
    {
      label: 'Recovery',
      value: metrics.recovery || '—',
      color: metrics.recovery === 'Ongoing' ? 'bad' : 'good',
      note: 'Since max drawdown',
    },
  ]

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4 font-semibold">
        Risk Metrics
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map(item => (
          <RiskCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  )
}
