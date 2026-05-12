import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs">
      <span style={{ color: payload[0].payload.fill }}>{payload[0].name}: </span>
      <span className="font-bold text-white">{payload[0].value}</span>
    </div>
  )
}

export default function WinLossDonut({ summary }) {
  if (!summary) return null

  const data = [
    { name: 'Wins',   value: summary.winning_trades, fill: '#22c55e' },
    { name: 'Losses', value: summary.losing_trades,  fill: '#ef4444' },
  ]

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex flex-col">
      <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-4 font-semibold">
        Win / Loss Split
      </h2>
      <div className="flex items-center gap-6 flex-1">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={72}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-gray-400">Wins</span>
            </div>
            <span className="text-2xl font-bold text-green-400">{summary.winning_trades}</span>
            <span className="text-sm text-gray-500 ml-2">{summary.win_rate}%</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="text-xs text-gray-400">Losses</span>
            </div>
            <span className="text-2xl font-bold text-red-400">{summary.losing_trades}</span>
            <span className="text-sm text-gray-500 ml-2">{(100 - summary.win_rate).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
