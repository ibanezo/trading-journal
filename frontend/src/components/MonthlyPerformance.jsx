import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className={v >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
        {v >= 0 ? '+' : ''}{v.toFixed(2)}%
      </p>
    </div>
  )
}

export default function MonthlyPerformance({ data }) {
  if (!data?.length) return null
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4 font-semibold">
        Monthly Return
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            interval={0}
            angle={-35}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            tickFormatter={v => `${v.toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#4b5563" />
          <Bar dataKey="return_pct" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.return_pct >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
