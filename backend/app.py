import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
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
# In-memory state — populated at startup (if CSV found) or via POST /api/upload
# ---------------------------------------------------------------------------
_state: dict = {"sections": {}, "filename": None}


def _try_autoload() -> None:
    report_dir = Path(__file__).parent.parent.parent
    if os.environ.get("DATA_FILE"):
        path = Path(os.environ["DATA_FILE"])
        _load_path(path, path.name)
    else:
        candidates = list(report_dir.glob("*.csv"))
        if candidates:
            if len(candidates) > 1:
                print(f"Warning: multiple CSVs found, using {candidates[0].name}")
            _load_path(candidates[0], candidates[0].name)
        else:
            print("No CSV found at startup — use the Upload button in the UI to load data.")


def _load_path(path: Path, display_name: str) -> None:
    print(f"Loading data from: {path}")
    sections = parse_ibkr_report(str(path))
    _state["sections"] = sections
    _state["filename"] = display_name
    print(f"Parsed {len(sections)} sections: {list(sections.keys())}")


_try_autoload()

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Trading Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _sections():
    if not _state["sections"]:
        raise HTTPException(status_code=503, detail="No data loaded — upload a CSV file first.")
    return _state["sections"]


@app.get("/api/status")
def status():
    return {"data_loaded": bool(_state["sections"]), "filename": _state["filename"]}


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    contents = await file.read()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        sections = parse_ibkr_report(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse CSV: {e}")
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    _state["sections"] = sections
    _state["filename"] = file.filename
    print(f"Data reloaded from upload: {file.filename} ({len(sections)} sections)")
    return {"status": "ok", "filename": file.filename, "sections": list(sections.keys())}


@app.get("/api/summary")
def summary():
    return compute_summary(_sections())


@app.get("/api/equity-curve")
def equity_curve():
    return compute_equity_curve(_sections())


@app.get("/api/monthly-performance")
def monthly_performance():
    return compute_monthly_performance(_sections())


@app.get("/api/trades")
def trades():
    return compute_trades(_sections())


@app.get("/api/sector-breakdown")
def sector_breakdown():
    return compute_sector_breakdown(_sections())


@app.get("/api/long-short")
def long_short():
    return compute_long_short(_sections())


@app.get("/api/risk-metrics")
def risk_metrics():
    return compute_risk_metrics(_sections())


@app.get("/api/top-trades")
def top_trades():
    return compute_top_trades(_sections())


@app.get("/health")
def health():
    return {
        "status": "ok",
        "data_loaded": bool(_state["sections"]),
        "filename": _state["filename"],
        "sections_loaded": list(_state["sections"].keys()),
    }
