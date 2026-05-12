from __future__ import annotations
import pandas as pd
import numpy as np
import io
import re


def _clean_numeric(series: pd.Series) -> pd.Series:
    """Strip thousands-separator commas from quoted numbers, then coerce to float."""
    return (
        series.astype(str)
        .str.replace(r'[,\s]', '', regex=True)
        .replace({'': np.nan, 'nan': np.nan, '-': np.nan, 'None': np.nan})
        .astype(float, errors='ignore')
    )


def parse_ibkr_report(filepath: str) -> dict[str, pd.DataFrame]:
    """
    Parse an IBKR PortfolioAnalyst multi-section CSV report.

    Each line has the form:
        SectionName, RowType (MetaInfo/Header/Data), col1, col2, ...

    Returns a dict mapping section name -> DataFrame (one per first Header block).
    For sections with multiple Header/Data blocks (e.g. Risk Measures), only the
    first block is used; sub-blocks are stored with a suffix like 'Section Name__2'.
    """
    import csv as _csv

    rows = []
    with open(filepath, 'r', encoding='utf-8-sig') as fh:
        for row in _csv.reader(fh):
            rows.append(row)

    # Pad all rows to the same length so we can build a DataFrame
    max_cols = max(len(r) for r in rows)
    padded = [r + [''] * (max_cols - len(r)) for r in rows]
    df_raw = pd.DataFrame(padded, dtype=str)

    sections: dict[str, pd.DataFrame] = {}

    for section_name, grp in df_raw.groupby(0, sort=False):
        header_idx = grp.index[grp[1] == 'Header'].tolist()
        data_idx   = grp.index[grp[1] == 'Data'].tolist()

        if not header_idx or not data_idx:
            continue

        # Handle multiple header blocks within the same section
        # Split data rows among header blocks by position
        blocks = []
        for i, h_i in enumerate(header_idx):
            next_h = header_idx[i + 1] if i + 1 < len(header_idx) else None
            block_data = [
                di for di in data_idx
                if di > h_i and (next_h is None or di < next_h)
            ]
            blocks.append((h_i, block_data))

        for block_num, (h_i, d_indices) in enumerate(blocks):
            if not d_indices:
                continue

            header_row = df_raw.loc[h_i]
            # Columns start at position 2 (skip section name and row type)
            cols = header_row.iloc[2:].dropna().tolist()
            cols = [c.strip() for c in cols if c.strip()]

            data_rows = df_raw.loc[d_indices].iloc[:, 2:2 + len(cols)]
            data_rows.columns = cols
            data_rows = data_rows.reset_index(drop=True)

            key = section_name if block_num == 0 else f"{section_name}__{block_num + 1}"
            sections[key] = data_rows

    return sections


def get_section(sections: dict, name: str) -> pd.DataFrame | None:
    return sections.get(name)
