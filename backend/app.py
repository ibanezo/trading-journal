import os
import glob
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from parser import parse_ibkr_report
from analytics import (
    compute_summary,
    compute_equity_curve,
    compute_monthly_performance,
    compute_trades,
    compute_sector_breakdown,
    compute_long_short,
    compute_risk_metrics,
    compute_top_trades,
)

# ---------------------------------------------------------------------------
# Data file — auto-detect the CSV in the parent directory, or set DATA_FILE
# env var to an explicit path.
# ---------------------------------------------------------------------------
_report_dir = Path(__file__).parent.parent.parent

if os.environ.get("DATA_FILE"):
    DATA_FILE = Path(os.environ["DATA_FILE"])
else:
    candidates = list(_report_dir.glob("*.csv"))
    if not candidates:
        raise RuntimeError(
            f"No CSV file found in {_report_dir}. "
            "Place your IBKR PortfolioAnalyst CSV there, or set the DATA_FILE env var."
        )
    DATA_FILE = candidates[0]
    if len(candidates) > 1:
        print(f"Warning: multiple CSVs found, using {DATA_FILE.name}")

print(f"Loading data from: {DATA_FILE}")
SECTIONS = parse_ibkr_report(str(DATA_FILE))
print(f"Parsed {len(SECTIONS)} sections: {list(SECTIONS.keys())}")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Trading Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/summary")
def summary():
    return compute_summary(SECTIONS)


@app.get("/api/equity-curve")
def equity_curve():
    return compute_equity_curve(SECTIONS)


@app.get("/api/monthly-performance")
def monthly_performance():
    return compute_monthly_performance(SECTIONS)


@app.get("/api/trades")
def trades():
    return compute_trades(SECTIONS)


@app.get("/api/sector-breakdown")
def sector_breakdown():
    return compute_sector_breakdown(SECTIONS)


@app.get("/api/long-short")
def long_short():
    return compute_long_short(SECTIONS)


@app.get("/api/risk-metrics")
def risk_metrics():
    return compute_risk_metrics(SECTIONS)


@app.get("/api/top-trades")
def top_trades():
    return compute_top_trades(SECTIONS)


@app.get("/health")
def health():
    return {"status": "ok", "sections_loaded": list(SECTIONS.keys())}
