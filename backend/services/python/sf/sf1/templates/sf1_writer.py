# [IMPORT] Libraries
import os
import io
import sys
import json
import pandas as pd
from datetime import datetime
from openpyxl import load_workbook  # pyright: ignore[reportMissingModuleSource]
from openpyxl.cell.cell import MergedCell  # pyright: ignore[reportMissingModuleSource]
from openpyxl.cell.cell import Cell  # pyright: ignore[reportMissingModuleSource]

# [IMPORT] Utilities
from sf.utils.normalization import safe, is_male, is_female, format_birthdate
from sf.utils.name_parser import adviser_full_name

sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

try:
    # =========================
    # [LOAD PAYLOAD]
    # =========================
    payload = json.loads(sys.stdin.read())

    students_list = payload.get("students", [])
    adviser = payload.get("adviser", {})
    section = payload.get("section", {})
    paths = payload.get("paths", {})

    TEMPLATE_PATH = paths.get("templatePath")
    OUTPUT_PATH = paths.get("outputPath")

    if not TEMPLATE_PATH or not OUTPUT_PATH:
        raise ValueError("Missing templatePath or outputPath")

    OUTPUT_DIR = os.path.dirname(OUTPUT_PATH)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # =========================
    # DEFAULT VALUES
    # =========================
    defaults = {
        "Age": "",
        "Mother Tongue": "",
        "Religion": "",
        "Grade Level": section.get("gradeLevel", "Grade 10"),
        "Section": section.get("name", "A"),
        "IP Ethnic Group": "",
        "Learning Modality": "",
        "Remarks": "",
        "Father Name": "",
        "Mother Maiden Name": "",
        "Barangay": "",
        "Municipality": "",
        "Province": ""
    }

    for s in students_list:
        for k, v in defaults.items():
            s.setdefault(k, v)

    data = pd.DataFrame(students_list).fillna("")

    # =========================
    # LOAD TEMPLATE
    # =========================
    wb = load_workbook(TEMPLATE_PATH)
    ws = wb.active

    # =========================
    # SAFE CELL WRITER
    # =========================
    def get_safe_cell(ws, row, col) -> Cell | None:
        cell = ws.cell(row=row, column=col)

        if isinstance(cell, MergedCell):
            for merged in ws.merged_cells.ranges:
                if cell.coordinate in merged:
                    return ws.cell(row=merged.min_row, column=merged.min_col)
            return None

        return cell

    def write_cell(row, col, value, as_text=False):
        if value in ("", None):
            return

        cell = get_safe_cell(ws, row, col)
        if cell is None:
            return

        cell.value = str(value) if as_text else value

    # =========================
    # HEADER
    # =========================
    today = datetime.today()
    sy = f"{today.year} - {today.year + 1}"

    for c in range(20, 25):
        write_cell(4, c, sy)

    grade = data["Grade Level"].iloc[0] if len(data) else "Grade 10"
    section_name = data["Section"].iloc[0].upper() if len(data) else "A"

    write_cell(4, 31, grade)
    write_cell(4, 32, grade)

    for c in range(39, 48):
        write_cell(4, c, section_name)

    # =========================
    # CONFIG
    # =========================
    START_ROW = 7

    COL = {
        "lrn": 1, "name": 3, "sex": 7, "birth": 8, "age": 10,
        "mother_tongue": 12, "ip": 14, "religion": 15,
        "barangay": 18, "municipality": 21, "province": 23,
        "father": 28, "mother": 32, "modality": 44, "remarks": 45
    }

    # =========================
    # HELPERS
    # =========================
    def format_name(n):
        n = safe(n).strip()
        if not n:
            return ""

        if "," in n:
            a, b = n.split(",", 1)
            return f"{a.strip().upper()}, {b.strip().upper()}"

        parts = n.split()
        if len(parts) == 1:
            return parts[0].upper()
        if len(parts) == 2:
            return f"{parts[1].upper()}, {parts[0].upper()}"

        return f"{parts[-1].upper()}, {parts[0].upper()} {' '.join(parts[1:-1]).upper()}"

    def full_name(s):
        return f"{safe(s.get('Last Name')).upper()}, {safe(s.get('First Name')).upper()} {safe(s.get('Middle Name')).upper()}"

    def write_student(s, row):
        sex = "M" if is_male(s.get("Sex")) else "F"

        write_cell(row, COL["lrn"], s.get("LRN", ""), True)
        write_cell(row, COL["name"], full_name(s))
        write_cell(row, COL["sex"], sex)
        write_cell(row, COL["birth"], format_birthdate(s.get("Birth Date")))
        write_cell(row, COL["age"], s.get("Age", ""))

        write_cell(row, COL["mother_tongue"], s.get("Mother Tongue", ""))
        write_cell(row, COL["ip"], safe(s.get("IP Ethnic Group")).upper())
        write_cell(row, COL["religion"], s.get("Religion", ""))

        write_cell(row, COL["barangay"], safe(s.get("Barangay")).upper())
        write_cell(row, COL["municipality"], safe(s.get("Municipality")).upper())
        write_cell(row, COL["province"], safe(s.get("Province")).upper() or "ILOILO")

        write_cell(row, COL["father"], format_name(s.get("Father Name")))
        write_cell(row, COL["mother"], format_name(s.get("Mother Maiden Name")))

        write_cell(row, COL["modality"], safe(s.get("Learning Modality")).replace("_", " ").title())
        write_cell(row, COL["remarks"], s.get("Remarks", ""))

    # =========================
    # SPLIT DATA
    # =========================
    males = data[data["Sex"].apply(is_male)].reset_index(drop=True)
    females = data[data["Sex"].apply(is_female)].reset_index(drop=True)

    male_count = len(males)
    female_count = len(females)
    grand_total = male_count + female_count

    # =========================
    # FOOTER DETECTION
    # =========================
    marker = "List and Code of Indicators under REMARKS column"
    footer_row = None

    for r in range(START_ROW, ws.max_row + 1):
        for c in range(1, 20):
            v = ws.cell(r, c).value
            if isinstance(v, str) and marker in v:
                footer_row = r
                break
        if footer_row:
            break

    if not footer_row:
        raise ValueError("Footer marker not found")

    LIMIT = footer_row - 3
    current = START_ROW

    # =========================
    # WRITE DATA
    # =========================
    for _, s in males.iterrows():
        if current > LIMIT:
            break
        write_student(s, current)
        current += 1

    write_cell(current, 1, male_count)
    write_cell(current, 2, male_count)
    write_cell(current, 3, "<=== TOTAL MALE")
    current += 1

    for _, s in females.iterrows():
        if current > LIMIT:
            break
        write_student(s, current)
        current += 1

    write_cell(current, 1, female_count)
    write_cell(current, 2, female_count)
    write_cell(current, 3, "<=== TOTAL FEMALE")
    current += 1

    write_cell(current, 1, grand_total)
    write_cell(current, 2, grand_total)
    write_cell(current, 3, "<=== TOTAL COMBINED")

    # =========================
    # SAVE
    # =========================
    wb.save(OUTPUT_PATH)

    print(f"[SUCCESS] Saved to {OUTPUT_PATH}")
    print(f"Male: {male_count}, Female: {female_count}, Total: {grand_total}")

except Exception as e:
    print(f"[ERROR] {e}", file=sys.stderr)
    sys.exit(1)