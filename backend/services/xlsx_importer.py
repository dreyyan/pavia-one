"""
xlsx_importer.py — Parse an SF1 .xlsx or .csv file into student JSON for DB insertion.

Usage:
    python xlsx_importer.py <file_path>

Output (stdout): JSON array of student objects with normalized field names
matching the Prisma Student model.

Supports two input formats:
  1. .csv  — exported from the SF1 Excel template (column-position based)
  2. .xlsx — the actual SF1 template (openpyxl, cell-position based)
"""

import json
import sys
import os
import csv
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────
# CSV column positions (0-indexed) — matches the SF1 template CSV export
# ─────────────────────────────────────────────────────────────────────────────
CSV_COL = {
    "lrn":            0,
    "name":           2,   # "LAST NAME, FIRST NAME MIDDLE NAME" combined
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

CSV_START_ROW = 7      # 1-indexed (row 7 is the first student row in the template)
CSV_SKIP_ROWS = {32, 59, 60}  # 1-indexed row numbers to skip


# ─────────────────────────────────────────────────────────────────────────────
# XLSX row/column positions (1-indexed openpyxl)
# ─────────────────────────────────────────────────────────────────────────────
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


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def clean_token(s: str) -> str:
    """Strip surrounding whitespace and stray commas from a name token."""
    return s.strip().strip(",").strip()


def parse_name(combined: str):
    """
    Parse SF1 combined-name cell into (last, first, middle).

    The template writes names as:  LAST, FIRST MIDDLE
    e.g.  "ABANILLA, IVAN TOBONGBANUA"
          "DELA CRUZ, MARIA SANTOS"

    Returns title-cased (last, first, middle).  Middle may be "".
    """
    combined = combined.strip()
    if not combined:
        return "", "", ""

    if "," in combined:
        # Split only on the FIRST comma → last | "first [middle...]"
        last_raw, rest_raw = combined.split(",", 1)
        last  = clean_token(last_raw).title()
        parts = [clean_token(p) for p in rest_raw.split() if clean_token(p)]
        first  = parts[0].title() if parts else ""
        # Everything after the first word is the middle name
        middle = " ".join(p.title() for p in parts[1:]) if len(parts) > 1 else ""
    else:
        words = [clean_token(w) for w in combined.split() if clean_token(w)]
        if len(words) == 1:
            return words[0].title(), "", ""
        elif len(words) == 2:
            return words[-1].title(), words[0].title(), ""
        else:
            last   = words[-1].title()
            first  = words[0].title()
            middle = " ".join(w.title() for w in words[1:-1])

    return last, first, middle


def normalize_sex(raw: str) -> str:
    v = raw.strip().upper()
    if v in ("M", "MALE"):
        return "MALE"
    return "FEMALE"


def normalize_date(raw) -> str:
    """Return ISO date string YYYY-MM-DD or empty string."""
    if not raw:
        return ""
    s = str(raw).strip().split("T")[0]
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s  # return as-is if unparseable


def normalize_modality(raw: str) -> str:
    """Map human-readable modality to Prisma LearningModality enum."""
    mapping = {
        "face to face":      "FACE_TO_FACE",
        "f2f":               "FACE_TO_FACE",
        "face-to-face":      "FACE_TO_FACE",
        "distance":          "DISTANCE_LEARNING",
        "modular":           "DISTANCE_LEARNING",
        "distance learning": "DISTANCE_LEARNING",
        "blended":           "BLENDED",
        "online":            "ONLINE",
        "homeschool":        "HOMESCHOOL",
        "homeschooling":     "HOMESCHOOL",
    }
    return mapping.get(raw.strip().lower(), "FACE_TO_FACE")


def normalize_lrn(raw: str) -> str:
    """
    Normalize LRN to a plain integer string.
    openpyxl reads numeric cells as floats → "115521180060.0" → "115521180060"
    """
    s = raw.strip()
    try:
        return str(int(float(s)))
    except (ValueError, OverflowError):
        return s  # already a non-numeric string; return as-is


def parse_guardian_name(full: str):
    """
    Parse a guardian full name into (first, middle, last).
    Handles both "LAST, FIRST MIDDLE" and "FIRST MIDDLE LAST" formats.
    Returns all tokens stripped of stray commas.
    """
    if not full or not full.strip():
        return "", "", ""

    tokens = [clean_token(t) for t in full.replace(",", " , ").split() if clean_token(t)]
    # Remove any empty tokens that resulted from lone commas
    tokens = [t for t in tokens if t]

    # Detect "LAST, FIRST [MIDDLE...]" pattern — comma immediately after first token
    if len(tokens) >= 2 and full.strip().index(",") < len(full.strip().split()[0]) + 2:
        # First word before comma is the last name
        raw_last = clean_token(full.split(",", 1)[0]).title()
        rest     = [clean_token(t).title() for t in full.split(",", 1)[1].split() if clean_token(t)]
        first    = rest[0] if rest else ""
        middle   = " ".join(rest[1:]) if len(rest) > 1 else ""
        return first, middle, raw_last

    # Fallback: "FIRST [MIDDLE...] LAST"
    if len(tokens) == 1:
        return tokens[0].title(), "", ""
    if len(tokens) == 2:
        return tokens[0].title(), "", tokens[1].title()
    first  = tokens[0].title()
    last   = tokens[-1].title()
    middle = " ".join(t.title() for t in tokens[1:-1])
    return first, middle, last


def build_student(
    lrn, name_combined, sex_raw, birth_raw, age_raw,
    mother_tongue, ip, religion,
    barangay, municipality, province,
    father_raw, mother_raw,
    modality_raw, remarks
) -> dict:
    last, first, middle = parse_name(name_combined)

    # Build guardian sub-objects with correctly split name fields
    f_first, f_middle, f_last = parse_guardian_name(father_raw)
    m_first, m_middle, m_last = parse_guardian_name(mother_raw)

    return {
        "lrn":              normalize_lrn(lrn),
        "firstName":        first,
        "middleName":       middle or None,
        "lastName":         last,
        "sex":              normalize_sex(sex_raw),
        "birthDate":        normalize_date(birth_raw),
        "motherTongue":     mother_tongue.strip() or None,
        "ethnicGroup":      ip.strip() or None,
        "religion":         religion.strip() or None,
        # Address
        "barangay":         barangay.strip() or None,
        "municipality":     municipality.strip() or None,
        "province":         province.strip() or None,
        # Guardian — pre-split into individual name fields
        "fatherFirstName":        f_first  or None,
        "fatherMiddleName":       f_middle or None,
        "fatherLastName":         f_last   or None,
        "motherMaidenFirstName":  m_first  or None,
        "motherMaidenMiddleName": m_middle or None,
        "motherMaidenLastName":   m_last   or None,
        # Enrollment
        "learningModality": normalize_modality(modality_raw),
        "remarks":          remarks.strip() or None,
    }


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


# ─────────────────────────────────────────────────────────────────────────────
# Parsers
# ─────────────────────────────────────────────────────────────────────────────

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
            remarks=g(CSV_COL["remarks"]),
        )
        students.append(student)
        row_idx += 1

    return students


def parse_xlsx(path: str) -> list:
    try:
        from openpyxl import load_workbook
    except ImportError:
        print("[ERROR] openpyxl not installed. Run: pip install openpyxl", file=sys.stderr)
        sys.exit(1)

    wb = load_workbook(path, data_only=True)
    ws = wb.active
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


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("[ERROR] Usage: xlsx_importer.py <file_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    if not os.path.exists(input_path):
        print(f"[ERROR] File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    ext = os.path.splitext(input_path)[1].lower()

    try:
        if ext == ".csv":
            students = parse_csv(input_path)
        elif ext in (".xlsx", ".xlsm"):
            students = parse_xlsx(input_path)
        else:
            print(f"[ERROR] Unsupported file type: {ext}", file=sys.stderr)
            sys.exit(1)

        print(json.dumps(students, ensure_ascii=False, indent=2))

    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)