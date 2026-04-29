# [IMPORT] Libraries
import os
import io
import sys
import json
from datetime import datetime
from openpyxl import load_workbook  # pyright: ignore[reportMissingModuleSource]
from openpyxl.cell.cell import MergedCell  # pyright: ignore[reportMissingModuleSource]
from openpyxl.cell.cell import Cell  # pyright: ignore[reportMissingModuleSource]

from sf.utils.normalization import safe

sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")

GRADE_YEAR_MAP = {
    "7": "Year I",
    "8": "Year II",
    "9": "Year III",
    "10": "Year IV",
}

try:
    payload = json.loads(sys.stdin.read())

    students_list = payload.get("students", [])
    adviser = payload.get("adviser", {})
    section = payload.get("section", {})
    school = payload.get("school", {})
    paths = payload.get("paths", {})

    TEMPLATE_PATH = paths.get("templatePath")
    OUTPUT_PATH = paths.get("outputPath")

    if not TEMPLATE_PATH or not OUTPUT_PATH:
        raise ValueError("Missing templatePath or outputPath")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    wb = load_workbook(TEMPLATE_PATH)
    ws = wb.active

    # =========================
    # SAFE WRITER
    # =========================
    def get_safe_cell(ws, row, col) -> Cell | None:
        cell = ws.cell(row=row, column=col)

        if isinstance(cell, MergedCell):
            for merged in ws.merged_cells.ranges:
                if cell.coordinate in merged:
                    return ws.cell(row=merged.min_row, column=merged.min_col)
            return None

        return cell

    def write_cell(row, col, value):
        if value is None or value == "":
            return
        cell = get_safe_cell(ws, row, col)
        if cell:
            cell.value = value

    # =========================
    # HEADER FIXES
    # =========================
    today = datetime.today()
    school_year = f"{today.year} - {today.year + 1}"
    report_month = today.strftime("%B")

    raw_grade = str(section.get("gradeLevel", "")).replace("Grade", "").strip()
    year_label = GRADE_YEAR_MAP.get(raw_grade, "")

    grade_level = f"Grade {raw_grade} ({year_label})" if year_label else f"Grade {raw_grade}"
    section_name = safe(section.get("name", "")).upper()

    write_cell(3, 6, school.get("School ID", ""))
    write_cell(3, 13, school_year)
    write_cell(3, 27, report_month)

    write_cell(4, 6, school.get("School Name", ""))
    write_cell(4, 27, grade_level)
    write_cell(4, 39, section_name)

    # =========================
    # CONFIG
    # =========================
    START_ROW = 8

    COL_NO = 1      # A-B
    COL_NAME = 5    # E-G

    # =========================
    # FIXED NAME FORMAT
    # =========================
    def full_name(s):
        last = safe(s.get("Last Name")).upper()
        first = safe(s.get("First Name")).upper()
        middle = safe(s.get("Middle Name")).upper()

        # FIXED: proper comma formatting
        if middle:
            return f"{last}, {first}, {middle}"
        return f"{last}, {first}"

    def write_student(row, index, s):
        write_cell(row, COL_NO, f"{index}.")
        write_cell(row, COL_NAME, full_name(s))

    # =========================
    # STRONG FILTERING (FIX FOR MISSING FEMALES)
    # =========================
    def is_male(s):
        return safe(s.get("Sex")).upper() == "MALE"

    def is_female(s):
        return safe(s.get("Sex")).upper() == "FEMALE"

    males = [s for s in students_list if is_male(s)]
    females = [s for s in students_list if is_female(s)]

    # DEBUG SAFETY CHECK (IMPORTANT)
    if len(males) + len(females) != len(students_list):
        print("[WARNING] Some students missing sex classification")

    row = START_ROW

    # =========================
    # MALES
    # =========================
    for i, s in enumerate(males, 1):
        write_student(row, i, s)
        row += 1

    write_cell(row, COL_NAME, "<=== MALE | TOTAL Per Day ===>")
    write_cell(row, COL_NAME + 1, len(males))
    row += 1

    # =========================
    # FEMALES (FIXED GAP ISSUE HERE)
    # =========================
    for i, s in enumerate(females, 1):
        write_student(row, i, s)
        row += 1

    write_cell(row, COL_NAME, "<=== FEMALE | TOTAL Per Day ===>")
    write_cell(row, COL_NAME + 1, len(females))
    row += 1

    # =========================
    # TOTAL
    # =========================
    total = len(males) + len(females)

    write_cell(row, COL_NAME, "<=== TOTAL COMBINED ===>")
    write_cell(row, COL_NAME + 1, total)

    # =========================
    # FOOTER TOTALS (ROW 72–73)
    # =========================

    # Total Male → Col AR
    write_cell(72, 44, len(males))
    write_cell(73, 44, len(males))

    # Total Female → Col AS
    write_cell(72, 45, len(females))
    write_cell(73, 45, len(females))

    # Total Combined → Col AT-AU
    write_cell(72, 46, total)
    write_cell(72, 47, total)

    write_cell(73, 46, total)
    write_cell(73, 47, total)

    # =========================
    # ADVISER NAME (ROW 95–96, COL AN–AU)
    # FORMAT: FIRST MIDDLE LAST
    # =========================

    first = safe(adviser.get("firstName", adviser.get("First Name", ""))).upper()
    middle = safe(adviser.get("middleName", adviser.get("Middle Name", ""))).upper()
    last = safe(adviser.get("lastName", adviser.get("Last Name", ""))).upper()

    adviser_name = " ".join([p for p in [first, middle, last] if p]).strip()

    # AN–AU spans columns 40–47
    for col in range(40, 48):
        write_cell(95, col, adviser_name)
        write_cell(96, col, adviser_name)

    # =========================
    # SCHOOL HEAD (ROW 101, COL AN–AT)
    # =========================

    school_head = safe(school.get("School Head", "")).upper()

    for col in range(40, 47):  # AN–AT
        write_cell(101, col, school_head)

    wb.save(OUTPUT_PATH)

    print(f"[SUCCESS] SF2 saved to {OUTPUT_PATH}")

except Exception as e:
    print(f"[ERROR] {e}", file=sys.stderr)
    sys.exit(1)