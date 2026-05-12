export default function MetricCard({ label, value, sub, color = 'neutral', small = false }) {
  const colorMap = {
    green:   'text-green-400',
    red:     'text-red-400',
    violet:  'text-violet-400',
    yellow:  'text-yellow-400',
    neutral: 'text-white',
  }
  const textColor = colorMap[color] || 'text-white'

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">{label}</span>
      <span className={`${small ? 'text-xl' : 'text-2xl'} font-bold ${textColor} tabular-nums`}>
        {value}
      </span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}
