# [HELPER] Resolve merged-cell value safely (openpyxl utility)
def cell_val(ws, row, col) -> str:
    """Get string value from openpyxl cell, resolving merged cells."""
    cell = ws.cell(row, col)
    # If inside a merged range, read from the top-left master cell
    for merged in ws.merged_cells.ranges:
        if cell.coordinate in merged:
            cell = ws.cell(merged.min_row, merged.min_col)
            break
    v = cell.value
    return str(v).strip() if v is not None else ""