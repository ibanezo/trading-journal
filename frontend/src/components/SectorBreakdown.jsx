import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className={d.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
        P&L: {d.pnl >= 0 ? '+' : ''}{d.pnl.toFixed(2)} €
      </p>
      <p className="text-gray-400">Trades: {d.trade_count}</p>
      <p className="text-gray-400">Win Rate: {d.win_rate}%</p>
    </div>
  )
}

export default function SectorBreakdown({ data }) {
  if (!data?.length) return null
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4 font-semibold">
        P&amp;L by Sector
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)}`}
          />
          <YAxis
            type="category"
            dataKey="sector"
            width={120}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
