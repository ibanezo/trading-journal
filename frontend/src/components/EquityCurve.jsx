import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2 font-semibold">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {p.value >= 0 ? '+' : ''}{Number(p.value).toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EquityCurve({ data }) {
  if (!data?.length) return null
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4 font-semibold">
        Cumulative Return vs Benchmarks
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            tickFormatter={v => `${v.toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
            formatter={v => v.toUpperCase()}
          />
          <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="4 4" />
          <Line dataKey="account" name="Account" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
          <Line dataKey="spx"     name="SPX"     stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeOpacity={0.7} />
          <Line dataKey="efa"     name="EFA"     stroke="#f97316" strokeWidth={1.5} dot={false} strokeOpacity={0.7} />
          <Line dataKey="vt"      name="VT"      stroke="#6b7280" strokeWidth={1.5} dot={false} strokeOpacity={0.6} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
