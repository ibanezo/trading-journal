# Trading Journal

A local, privacy-first trading analytics dashboard — similar to TradeZella — built specifically for **Interactive Brokers PortfolioAnalyst** reports. Start the app, upload your IBKR CSV directly from the UI, and get an instant overview of your performance without sending data to any third-party service.

---

## What It Shows

| Section | Details |
|---|---|
| **Key Metrics** | Total Realized P&L, Win Rate, Profit Factor, Risk/Reward Ratio, Avg Winner, Avg Loser |
| **Account Stats** | Total trades, open positions, deposits, fees, ending NAV |
| **Equity Curve** | Cumulative return vs S&P 500, EAFE, and VT benchmarks |
| **Win / Loss Split** | Donut chart with trade counts and percentages |
| **Top Winners & Losers** | Your 5 best and 5 worst closed trades |
| **P&L by Sector** | Horizontal bar chart broken down by sector |
| **Monthly Return** | Green/red bar chart for each calendar month |
| **Risk Metrics** | Sharpe ratio, Sortino ratio, Max Drawdown, Beta, Alpha, Std Dev, and more |
| **Trade Table** | All trades — sortable by any column, searchable by symbol or sector |

---

## Prerequisites

Make sure the following are installed on your machine before you begin.

| Tool | Minimum Version | Check |
|---|---|---|
| Python | 3.9+ | `python3 --version` |
| pip (Python package manager) | any | `python3 -m pip --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

> **macOS users:** Python 3.9 ships with Xcode Command Line Tools. Node.js can be installed via [nodejs.org](https://nodejs.org) or `brew install node`.

---

## Project Structure

```
trading-journal/
├── backend/
│   ├── app.py            # FastAPI server — all API endpoints
│   ├── parser.py         # IBKR multi-section CSV parser
│   ├── analytics.py      # Trade metric calculations
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Main dashboard layout
│   │   ├── api.js                      # API client
│   │   └── components/
│   │       ├── MetricCard.jsx
│   │       ├── EquityCurve.jsx
│   │       ├── WinLossDonut.jsx
│   │       ├── TopTradesPanel.jsx
│   │       ├── SectorBreakdown.jsx
│   │       ├── MonthlyPerformance.jsx
│   │       ├── RiskPanel.jsx
│   │       └── TradeTable.jsx
│   ├── package.json
│   └── tailwind.config.js
├── start.sh              # One-command launcher
└── README.md
```

---

## Installation

### 1. Clone or copy the project

Place the `trading-journal/` folder wherever you like — no special directory structure required.

### 2. Install Python dependencies

```bash
cd trading-journal/backend
python3 -m pip install -r requirements.txt
```

This installs FastAPI, Uvicorn, Pandas, NumPy, and python-multipart into your user Python environment.

### 3. Install frontend dependencies

```bash
cd trading-journal/frontend
npm install
```

This downloads React, Vite, Tailwind CSS, and Recharts into `node_modules/`. It only needs to run once (or again after a `git pull` / dependency change).

---

## Starting the App

### Option A — One command (recommended)

From the `trading-journal/` root:

```bash
./start.sh
```

This kills any stale processes on ports 8000 and 5173, then starts both the backend and frontend. Press **Ctrl+C** to stop everything.

### Option B — Manually in two terminals

**Terminal 1 — Backend:**

```bash
cd trading-journal/backend
python3 -m uvicorn app:app --port 8000 --reload
```

**Terminal 2 — Frontend:**

```bash
cd trading-journal/frontend
npm run dev
```

### Verify it's running

| Service | URL | Expected response |
|---|---|---|
| Backend health | http://localhost:8000/health | `{"status":"ok",...}` |
| Dashboard | http://localhost:5173 | Trading Journal UI |

The app starts without any data loaded — open the dashboard in your browser and use the **Upload File** button to load your report.

---

## Loading Your Data

### In-app upload (recommended)

1. Export an **Inception** or custom date-range report from [PortfolioAnalyst](https://www.interactivebrokers.com/en/trading/portfolio-analyst.php) as a **CSV**.
2. Open the dashboard at http://localhost:5173.
3. On the upload screen, **drop your CSV file** onto the upload area or click it to browse for the file.
4. The dashboard loads automatically once the file is parsed.

To load a new report later, click **Upload New File** in the top-right corner of the header.

### Auto-detect on startup (alternative)

If you prefer not to upload manually each time, place your CSV file in the folder **one level above** `trading-journal/`:

```
Investing/
├── your_ibkr_report.csv   ← auto-detected on startup
└── trading-journal/
    ├── backend/
    └── frontend/
```

The backend detects any `.csv` file in that directory and loads it automatically. If you have multiple CSVs, point to the right one with an environment variable:

```bash
DATA_FILE=/path/to/your_report.csv ./start.sh
```

> The app reads the CSV once at startup — no database, no cloud sync, no data leaves your machine.

---

## API Reference

The backend exposes these REST endpoints, all at `http://localhost:8000`:

| Endpoint | Returns |
|---|---|
| `GET /api/status` | Whether data is loaded and the current filename |
| `POST /api/upload` | Upload a CSV file; parses it and loads it into memory |
| `GET /api/summary` | Win rate, profit factor, R/R ratio, avg winner/loser, gross P&L |
| `GET /api/equity-curve` | Monthly data points: account + 3 benchmark returns |
| `GET /api/trades` | All instrument-level trades with P&L, sector, type |
| `GET /api/risk-metrics` | Sharpe, Sortino, Max Drawdown, Beta, Alpha, Std Dev |
| `GET /api/sector-breakdown` | P&L aggregated by sector with win rates |
| `GET /api/monthly-performance` | Per-month return percentages |
| `GET /api/top-trades` | Top 5 winners and top 5 losers |
| `GET /health` | Server health check with data-loaded status |

---

## Data Source Limitations

This app reads an IBKR **PortfolioAnalyst** report, which is an _aggregated_ performance report — not a raw activity statement. As a result:

- **Individual trade timestamps are not available** — so P&L by hour/weekday cannot be computed.
- Each row represents one **option contract** (one symbol) opened and closed, not individual order fills.
- For timestamp-level granularity, export an **Activity Statement** (Flex Query) from IBKR instead, and a future parser version can ingest that format.

---

## Troubleshooting

**"Failed to connect to backend" in the browser**
→ The backend is not running. Start it first with `./start.sh` or the manual method above.

**Upload fails with "Failed to parse CSV"**
→ Make sure you exported an IBKR **PortfolioAnalyst** report (not an Activity Statement or other format). The file must be the multi-section CSV format that PortfolioAnalyst generates.

**`ModuleNotFoundError: No module named 'fastapi'`**
→ Run `python3 -m pip install -r requirements.txt` from the `backend/` folder.

**`address already in use` on port 8000 or 5173**
→ Something is using that port. Run `lsof -ti:8000 | xargs kill -9` (or 5173) to free it, then retry.

**Tailwind styles not loading (plain HTML look)**
→ Run `npm install` inside `frontend/` to restore `node_modules`, then restart the frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.9 · FastAPI · Pandas · NumPy · Uvicorn |
| Frontend | React 19 · Vite · Tailwind CSS 3 · Recharts |
| Data | IBKR PortfolioAnalyst CSV (multi-section format) |
| Charts | Recharts (LineChart, BarChart, PieChart) |
