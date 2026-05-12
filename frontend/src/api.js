const BASE = 'http://localhost:8000'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  summary:            () => get('/api/summary'),
  equityCurve:        () => get('/api/equity-curve'),
  monthlyPerformance: () => get('/api/monthly-performance'),
  trades:             () => get('/api/trades'),
  sectorBreakdown:    () => get('/api/sector-breakdown'),
  longShort:          () => get('/api/long-short'),
  riskMetrics:        () => get('/api/risk-metrics'),
  topTrades:          () => get('/api/top-trades'),
}
