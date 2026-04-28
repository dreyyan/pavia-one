# [IMPORT] Libraries
import csv
import sys

# [IMPORT] Utilities
from sf.sf1.mappers.sf1_student_mapper import build_student
from sf.utils.excel import cell_val

# [SETUP] CSV column positions (0-indexed); matches the SF1 template CSV export
CSV_COL = {
    "lrn":            0,
    "name":           2,
    "sex":            6,
    "birth":          7,
    "age":            9,
    "mother_tongue":  11,
    "ip":             13,
    "religion":       14,
    "barangay":       17,
    "municipality":   20,
    "province":       22,
    "father":         27,
    "mother":         31,
    "modality":       43,
    "remarks":        44,
}

CSV_START_ROW = 7             # first student row in the template (1-indexed)
CSV_SKIP_ROWS = {32, 59, 60}  # row numbers to skip (1-indexed)

# [SETUP] XLSX row/column positions (1-indexed)
XLSX_COL = {
    "lrn":            1,
    "name":           3,
    "sex":            7,
    "birth":          8,
    "age":            10,
    "mother_tongue":  12,
    "ip":             14,
    "religion":       15,
    "barangay":       18,
    "municipality":   21,
    "province":       23,
    "father":         28,
    "mother":         32,
    "modality":       44,
    "remarks":        45,
}

XLSX_START_ROW = 7
XLSX_SKIP_ROWS = {32, 59, 60}

def parse_csv(path: str) -> list:
    students = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = list(csv.reader(f))

    row_idx = CSV_START_ROW - 1  # 0-indexed

    while row_idx < len(reader):
        excel_row = row_idx + 1  # 1-indexed for skip check
        if excel_row in CSV_SKIP_ROWS:
            row_idx += 1
            continue

        data = reader[row_idx]

        print("\n[ROW DEBUG]", file=sys.stderr)
        print("LEN:", len(data), file=sys.stderr)
        print("ROW:", data, file=sys.stderr)
        print("LAST COL:", data[-1] if data else "EMPTY", file=sys.stderr)
        print("REMARKS INDEX 44:", data[44] if len(data) > 44 else "OUT OF RANGE", file=sys.stderr)
        print("[ROW REMARKS RAW]", data[CSV_COL["remarks"]] if len(data) > CSV_COL["remarks"] else "MISSING", file=sys.stderr)

        def g(col):
            return data[col].strip() if len(data) > col else ""

        lrn = g(CSV_COL["lrn"])
        if not lrn:
            break  # end of data

        student = build_student(
            lrn=lrn,
            name_combined=g(CSV_COL["name"]),
            sex_raw=g(CSV_COL["sex"]),
            birth_raw=g(CSV_COL["birth"]),
            age_raw=g(CSV_COL["age"]),
            mother_tongue=g(CSV_COL["mother_tongue"]),
            ip=g(CSV_COL["ip"]),
            religion=g(CSV_COL["religion"]),
            barangay=g(CSV_COL["barangay"]),
            municipality=g(CSV_COL["municipality"]),
            province=g(CSV_COL["province"]),
            father_raw=g(CSV_COL["father"]),
            mother_raw=g(CSV_COL["mother"]),
            modality_raw=g(CSV_COL["modality"]),
            remarks = g(CSV_COL["remarks"])
        )
        students.append(student)
        row_idx += 1

    return students


def parse_xlsx(path: str) -> list:
    try:
        from openpyxl import load_workbook # pyright: ignore[reportMissingModuleSource]
    except ImportError:
        print("[ERROR] openpyxl not installed. Run: pip install openpyxl", file=sys.stderr)
        sys.exit(1)

    wb = load_workbook(path, data_only=True)

    if not wb.sheetnames:
        raise ValueError("Excel file has no sheets")

    ws = wb.active

    if ws is None:
        raise ValueError("No active worksheet found in Excel file")
    
    students = []

    row = XLSX_START_ROW
    while row <= ws.max_row:
        if row in XLSX_SKIP_ROWS:
            row += 1
            continue

        lrn = cell_val(ws, row, XLSX_COL["lrn"])
        if not lrn:
            # Check next couple rows before bailing (blank rows can exist mid-list)
            if row < ws.max_row - 2:
                row += 1
                continue
            break

        student = build_student(
            lrn=lrn,
            name_combined=cell_val(ws, row, XLSX_COL["name"]),
            sex_raw=cell_val(ws, row, XLSX_COL["sex"]),
            birth_raw=cell_val(ws, row, XLSX_COL["birth"]),
            age_raw=cell_val(ws, row, XLSX_COL["age"]),
            mother_tongue=cell_val(ws, row, XLSX_COL["mother_tongue"]),
            ip=cell_val(ws, row, XLSX_COL["ip"]),
            religion=cell_val(ws, row, XLSX_COL["religion"]),
            barangay=cell_val(ws, row, XLSX_COL["barangay"]),
            municipality=cell_val(ws, row, XLSX_COL["municipality"]),
            province=cell_val(ws, row, XLSX_COL["province"]),
            father_raw=cell_val(ws, row, XLSX_COL["father"]),
            mother_raw=cell_val(ws, row, XLSX_COL["mother"]),
            modality_raw=cell_val(ws, row, XLSX_COL["modality"]),
            remarks=cell_val(ws, row, XLSX_COL["remarks"]),
        )
        students.append(student)
        row += 1

    return students