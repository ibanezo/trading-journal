const BASE = 'http://localhost:8000'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  status:             () => get('/api/status'),
  summary:            () => get('/api/summary'),
  equityCurve:        () => get('/api/equity-curve'),
  monthlyPerformance: () => get('/api/monthly-performance'),
  trades:             () => get('/api/trades'),
  sectorBreakdown:    () => get('/api/sector-breakdown'),
  longShort:          () => get('/api/long-short'),
  riskMetrics:        () => get('/api/risk-metrics'),
  topTrades:          () => get('/api/top-trades'),

  uploadFile: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form })
    if (!res.ok) {
      let detail = `Upload failed (${res.status})`
      try { detail = (await res.json()).detail ?? detail } catch {}
      throw new Error(detail)
    }
    return res.json()
  },
}
