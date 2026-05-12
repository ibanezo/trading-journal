from __future__ import annotations
import pandas as pd
import numpy as np
import re
from parser import get_section


def _to_float(val) -> float:
    if val is None or val == '' or val == '-':
        return 0.0
    s = str(val).replace(',', '').strip()
    try:
        return float(s)
    except ValueError:
        return 0.0


def _clean_pnl_col(series: pd.Series) -> pd.Series:
    return series.apply(_to_float)


# ---------------------------------------------------------------------------
# Summary + trade analytics
# ---------------------------------------------------------------------------

def compute_summary(sections: dict) -> dict:
    perf = get_section(sections, 'Performance by Symbol')
    if perf is None:
        return {}

    perf = perf.copy()
    # Remove sector/instrument total rows
    perf = perf[~perf['Symbol'].str.strip().str.startswith('Total', na=False)]
    perf = perf[perf['Symbol'].str.strip() != '']

    perf['Realized_P&L'] = _clean_pnl_col(perf.get('Realized_P&L', pd.Series()))
    perf['Unrealized_P&L'] = _clean_pnl_col(perf.get('Unrealized_P&L', pd.Series()))
    perf['Return'] = _clean_pnl_col(perf.get('Return', pd.Series()))

    # Closed trades only
    closed = perf[perf['Open'].str.strip().str.lower() == 'no'].copy()
    open_pos = perf[perf['Open'].str.strip().str.lower() == 'yes'].copy()

    total = len(closed)
    wins   = closed[closed['Realized_P&L'] > 0]
    losses = closed[closed['Realized_P&L'] <= 0]
    breakevens = closed[closed['Realized_P&L'] == 0]

    gross_profit = float(wins['Realized_P&L'].sum())
    gross_loss   = float(abs(losses['Realized_P&L'].sum()))
    profit_factor = round(gross_profit / gross_loss, 4) if gross_loss > 0 else None

    win_rate = round(len(wins) / total * 100, 2) if total > 0 else 0.0
    avg_winner = round(float(wins['Realized_P&L'].mean()), 2) if len(wins) > 0 else 0.0
    avg_loser  = round(float(losses['Realized_P&L'].mean()), 2) if len(losses) > 0 else 0.0
    largest_win  = round(float(wins['Realized_P&L'].max()), 2) if len(wins) > 0 else 0.0
    largest_loss = round(float(losses['Realized_P&L'].min()), 2) if len(losses) > 0 else 0.0

    total_realized = round(float(closed['Realized_P&L'].sum()), 2)
    total_unrealized = round(float(open_pos['Unrealized_P&L'].sum()), 2)

    rr_ratio = round(abs(avg_winner / avg_loser), 4) if avg_loser != 0 else None

    # Key stats and account info from report
    key_stats = _parse_key_stats(sections)
    account_info = _parse_account_info(sections)

    return {
        'account_info': account_info,
        'total_trades': total,
        'winning_trades': len(wins),
        'losing_trades': len(losses),
        'breakeven_trades': len(breakevens),
        'win_rate': win_rate,
        'profit_factor': profit_factor,
        'risk_reward_ratio': rr_ratio,
        'avg_winner': avg_winner,
        'avg_loser': avg_loser,
        'largest_win': largest_win,
        'largest_loss': largest_loss,
        'gross_profit': round(gross_profit, 2),
        'gross_loss': round(gross_loss, 2),
        'total_realized_pnl': total_realized,
        'total_unrealized_pnl': total_unrealized,
        'open_positions': len(open_pos),
        'key_stats': key_stats,
    }


def _parse_account_info(sections: dict) -> dict:
    intro = get_section(sections, 'Introduction')
    meta  = get_section(sections, 'Key Statistics')
    result = {'name': 'Account', 'account_id': '', 'currency': 'EUR', 'period': ''}
    if intro is not None and len(intro) > 0:
        row = intro.iloc[0]
        cols = intro.columns.tolist()
        if len(cols) >= 1:
            result['name'] = str(row.iloc[0]).strip() or 'Account'
        if len(cols) >= 2:
            result['account_id'] = str(row.iloc[1]).strip()
        if len(cols) >= 3:
            result['currency'] = str(row.iloc[2]).strip() or 'EUR'
    # Period comes from the MetaInfo row — stored in the raw sections dict under
    # a sibling key; easiest to grab from the Key Statistics MetaInfo label.
    return result


def _parse_key_stats(sections: dict) -> dict:
    ks = get_section(sections, 'Key Statistics')
    if ks is None or len(ks) == 0:
        return {}
    row = ks.iloc[0]
    return {
        'ending_nav': _to_float(row.get('EndingNAV')),
        'cumulative_return': _to_float(row.get('CumulativeReturn')),
        'deposits': _to_float(row.get('Deposits & Withdrawals')),
        'fees_commissions': _to_float(row.get('Fees & Commissions')),
        'mtm': _to_float(row.get('MTM')),
        'best_return': _to_float(row.get('BestReturn')),
        'best_return_date': str(row.get('BestReturnDate', '')),
        'worst_return': _to_float(row.get('WorstReturn')),
        'worst_return_date': str(row.get('WorstReturnDate', '')),
        'one_month_return': _to_float(row.get('1MonthReturn')),
        'three_month_return': _to_float(row.get('3MonthReturn')),
    }


# ---------------------------------------------------------------------------
# Equity curve
# ---------------------------------------------------------------------------

def _account_col(df: pd.DataFrame) -> str:
    """Return the account return column name by excluding known benchmark columns."""
    known = {'Date', 'BM1', 'BM1Return', 'BM2', 'BM2Return', 'BM3', 'BM3Return'}
    for col in df.columns:
        if col not in known:
            return col
    return df.columns[-1]


def compute_equity_curve(sections: dict) -> list[dict]:
    cum = get_section(sections, 'Cumulative Benchmark Comparison')
    if cum is None:
        return []

    acct_col = _account_col(cum)

    results = []
    for _, row in cum.iterrows():
        date_raw = str(row.get('Date', '')).strip()
        if not date_raw or date_raw.lower() == 'nan':
            continue
        results.append({
            'date':    date_raw,
            'account': _to_float(row.get(acct_col, 0)),
            'spx':     _to_float(row.get('BM1Return', row.get('BM1', 0))),
            'efa':     _to_float(row.get('BM2Return', row.get('BM2', 0))),
            'vt':      _to_float(row.get('BM3Return', row.get('BM3', 0))),
        })
    return results


# ---------------------------------------------------------------------------
# Monthly performance (period, not cumulative)
# ---------------------------------------------------------------------------

def compute_monthly_performance(sections: dict) -> list[dict]:
    tp = get_section(sections, 'Time Period Benchmark Comparison')
    if tp is None:
        return []

    results = []
    for _, row in tp.iterrows():
        date_raw = str(row.get('Date', '')).strip()
        if not date_raw or date_raw.lower() == 'nan':
            continue

        # Find account return column — named after account ID
        acct_col = None
        for col in tp.columns:
            if 'Return' in col and col not in ('BM1Return', 'BM2Return', 'BM3Return'):
                acct_col = col
                break
        if acct_col is None:
            # fallback: last column
            acct_col = tp.columns[-1]

        results.append({
            'month': date_raw,
            'return_pct': _to_float(row.get(acct_col, 0)),
            'spx': _to_float(row.get('BM1Return', 0)),
        })
    return results


# ---------------------------------------------------------------------------
# Trades list
# ---------------------------------------------------------------------------

def compute_trades(sections: dict) -> list[dict]:
    perf = get_section(sections, 'Performance by Symbol')
    if perf is None:
        return []

    perf = perf.copy()
    # Remove sector/instrument total rows
    perf = perf[~perf['Symbol'].str.strip().str.startswith('Total', na=False)]
    perf = perf[perf['Symbol'].str.strip() != '']

    perf['Realized_P&L'] = _clean_pnl_col(perf.get('Realized_P&L', pd.Series()))
    perf['Unrealized_P&L'] = _clean_pnl_col(perf.get('Unrealized_P&L', pd.Series()))
    perf['Return'] = _clean_pnl_col(perf.get('Return', pd.Series()))
    perf['AvgWeight'] = _clean_pnl_col(perf.get('AvgWeight', pd.Series()))
    perf['Contribution'] = _clean_pnl_col(perf.get('Contribution', pd.Series()))

    records = []
    for _, row in perf.iterrows():
        pnl = float(row['Realized_P&L'])
        records.append({
            'symbol': str(row.get('Symbol', '')).strip(),
            'description': str(row.get('Description', '')).strip(),
            'sector': str(row.get('Sector', '')).strip(),
            'financial_instrument': str(row.get('FinancialInstrument', '')).strip(),
            'realized_pnl': round(pnl, 2),
            'unrealized_pnl': round(float(row['Unrealized_P&L']), 2),
            'return_pct': round(float(row['Return']), 4),
            'avg_weight': round(float(row['AvgWeight']), 4),
            'contribution': round(float(row['Contribution']), 4),
            'is_open': str(row.get('Open', 'No')).strip().lower() == 'yes',
            'result': 'win' if pnl > 0 else ('loss' if pnl < 0 else 'breakeven'),
        })
    return records


# ---------------------------------------------------------------------------
# Sector breakdown
# ---------------------------------------------------------------------------

def compute_sector_breakdown(sections: dict) -> list[dict]:
    perf = get_section(sections, 'Performance by Symbol')
    if perf is None:
        return []

    perf = perf.copy()
    # Remove sector/instrument total rows
    perf = perf[~perf['Symbol'].str.strip().str.startswith('Total', na=False)]
    perf = perf[perf['Symbol'].str.strip() != '']
    perf['Realized_P&L'] = _clean_pnl_col(perf.get('Realized_P&L', pd.Series()))
    closed = perf[perf['Open'].str.strip().str.lower() == 'no']

    results = []
    for sector, grp in closed.groupby('Sector'):
        wins = grp[grp['Realized_P&L'] > 0]
        losses = grp[grp['Realized_P&L'] <= 0]
        results.append({
            'sector': str(sector),
            'pnl': round(float(grp['Realized_P&L'].sum()), 2),
            'trade_count': len(grp),
            'win_count': len(wins),
            'loss_count': len(losses),
            'win_rate': round(len(wins) / len(grp) * 100, 1) if len(grp) > 0 else 0,
        })
    results.sort(key=lambda x: x['pnl'], reverse=True)
    return results


# ---------------------------------------------------------------------------
# Long/Short breakdown
# ---------------------------------------------------------------------------

def compute_long_short(sections: dict) -> dict:
    ls = get_section(sections, 'Performance by Long Short')
    if ls is None:
        return {}

    ls = ls.copy()
    ls['Realized_P&L'] = _clean_pnl_col(ls.get('Realized_P&L', pd.Series()))

    # Drop totals/summary rows
    ls = ls[ls['Long/Short'].isin(['Long', 'Short'])]
    ls = ls[~ls['Symbol'].str.strip().str.startswith('Total', na=False)]
    ls = ls[ls['Symbol'].str.strip() != '']
    ls = ls[ls['Open'].str.strip().str.lower() == 'no']

    result = {}
    for side in ['Long', 'Short']:
        grp = ls[ls['Long/Short'].str.strip() == side]
        if len(grp) == 0:
            continue
        wins = grp[grp['Realized_P&L'] > 0]
        losses = grp[grp['Realized_P&L'] <= 0]
        result[side.lower()] = {
            'total_trades': len(grp),
            'winning_trades': len(wins),
            'losing_trades': len(losses),
            'win_rate': round(len(wins) / len(grp) * 100, 2) if len(grp) > 0 else 0,
            'total_pnl': round(float(grp['Realized_P&L'].sum()), 2),
            'avg_pnl': round(float(grp['Realized_P&L'].mean()), 2),
            'gross_profit': round(float(wins['Realized_P&L'].sum()), 2),
            'gross_loss': round(float(abs(losses['Realized_P&L'].sum())), 2),
        }
    return result


# ---------------------------------------------------------------------------
# Risk metrics
# ---------------------------------------------------------------------------

def compute_risk_metrics(sections: dict) -> dict:
    rm = get_section(sections, 'Risk Measures Benchmark Comparison')
    if rm is None:
        return {}

    result = {}
    col_map = {
        'Ending VAMI:': 'ending_vami',
        'Max Drawdown:': 'max_drawdown',
        'Peak-To-Valley:': 'peak_to_valley',
        'Recovery:': 'recovery',
        'Sharpe Ratio:': 'sharpe_ratio',
        'Sortino Ratio:': 'sortino_ratio',
        'Standard Deviation:': 'std_deviation',
        'Downside Deviation:': 'downside_deviation',
        'Turnover:': 'turnover',
        'Mean Return:': 'mean_return',
        'Positive Periods:': 'positive_periods',
        'Negative Periods:': 'negative_periods',
    }

    acct_col = 'Account Value'
    for _, row in rm.iterrows():
        measure = str(row.get('Risk Measure', '')).strip()
        key = col_map.get(measure)
        if key and acct_col in rm.columns:
            raw_val = str(row.get(acct_col, '')).strip()
            # Some values are strings like "2 Months" or "Ongoing"
            try:
                result[key] = float(raw_val.replace(',', ''))
            except ValueError:
                result[key] = raw_val

    # Relative metrics (second block)
    rm2 = get_section(sections, 'Risk Measures Benchmark Comparison__2')
    if rm2 is not None:
        rel_map = {
            'Correlation:': 'correlation_spx',
            'Beta:': 'beta_spx',
            'Alpha:': 'alpha_spx',
            'Tracking Error:': 'tracking_error_spx',
            'Information Ratio:': 'information_ratio_spx',
        }
        bm1_col = 'BM1 Value'
        for _, row in rm2.iterrows():
            measure = str(row.get('Risk Measure Relative to Benchmark', '')).strip()
            key = rel_map.get(measure)
            if key and bm1_col in rm2.columns:
                raw_val = str(row.get(bm1_col, '')).strip()
                try:
                    result[key] = round(float(raw_val.replace(',', '')), 4)
                except ValueError:
                    result[key] = raw_val

    return result


# ---------------------------------------------------------------------------
# Top / bottom trades
# ---------------------------------------------------------------------------

def compute_top_trades(sections: dict, n: int = 5) -> dict:
    trades = compute_trades(sections)
    closed = [t for t in trades if not t['is_open']]
    closed.sort(key=lambda x: x['realized_pnl'], reverse=True)
    return {
        'top_winners': closed[:n],
        'top_losers': closed[-n:][::-1],
    }
