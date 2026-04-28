# [IMPORT] Libraries
import os
import io
import sys
import json
import pandas as pd
from datetime import datetime
from openpyxl import load_workbook # pyright: ignore[reportMissingModuleSource]
from openpyxl.cell.cell import MergedCell # pyright: ignore[reportMissingModuleSource]
from openpyxl.cell.cell import Cell # pyright: ignore[reportMissingModuleSource]

# [IMPORT] Utilities
from sf.utils.normalization import safe, is_male, is_female, format_birthdate
from sf.utils.name_parser import adviser_full_name

sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    PROJECT_ROOT = os.path.abspath(
        os.path.join(BASE_DIR, "..", "..", "..", "..", "..")
    )

    FORMS_DIR = os.path.join(PROJECT_ROOT, "forms")
    OUTPUT_DIR = os.path.join(FORMS_DIR, "output_data")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    TEMPLATE_PATH = os.path.join(FORMS_DIR, "SF1_template.xlsx")

    # ---------------- LOAD DATA ----------------
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            students_list = json.load(f)
    else:
        payload = json.loads(sys.stdin.read())

        output_path = payload.get("outputPath")

        if not output_path:
            output_path = os.path.join(OUTPUT_DIR, "SF1_filled_output.xlsx")

        students_list = payload["students"]
        adviser = payload.get("adviser", {})

    defaults = {
        "Age": "",
        "Mother Tongue": "",
        "Religion": "",
        "Grade Level": "Grade 10",
        "Section": "A",
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

    # ---------------- LOAD TEMPLATE ----------------
    wb = load_workbook(TEMPLATE_PATH)
    ws = wb.active

    # ---------------- SAFE CELL WRITER ----------------
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

    # ---------------- HEADER ----------------
    today = datetime.today()
    sy = f"{today.year} - {today.year + 1}"

    for c in range(20, 25):
        write_cell(4, c, sy)

    grade = data["Grade Level"].iloc[0]
    section = data["Section"].iloc[0].upper()

    write_cell(4, 31, grade)
    write_cell(4, 32, grade)

    for c in range(39, 48):
        write_cell(4, c, section)

    # ---------------- CONFIG ----------------
    START_ROW = 7

    COL = {
        "lrn": 1, "name": 3, "sex": 7, "birth": 8, "age": 10,
        "mother_tongue": 12, "ip": 14, "religion": 15,
        "barangay": 18, "municipality": 21, "province": 23,
        "father": 28, "mother": 32, "modality": 44, "remarks": 45
    }

    def format_name(n):
        n = safe(n).strip()
        if not n:
            return ""

        # already in correct format
        if "," in n:
            a, b = n.split(",", 1)
            return f"{a.strip().upper()}, {b.strip().upper()}"

        parts = n.split()

        if len(parts) == 1:
            return parts[0].upper()

        if len(parts) == 2:
            first, last = parts
            return f"{last.upper()}, {first.upper()}"

        # assume FIRST MIDDLE LAST
        first = parts[0]
        last = parts[-1]
        middle = " ".join(parts[1:-1])

        return f"{last.upper()}, {first.upper()} {middle.upper()}"

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

    # ---------------- SPLIT ----------------
    males = data[data["Sex"].apply(is_male)]
    females = data[data["Sex"].apply(is_female)]

    # ---------------- FIND FOOTER ----------------
    marker = "List and Code of Indicators under REMARKS column"
    footer_row = None

    for r in range(START_ROW, ws.max_row + 1): # pyright: ignore[reportOptionalMemberAccess]
        for c in range(1, 20):
            v = ws.cell(r, c).value # pyright: ignore[reportOptionalMemberAccess]
            if isinstance(v, str) and marker in v:
                footer_row = r
                break
        if footer_row:
            break

    if not footer_row:
        raise ValueError("Footer marker not found")

    # ---------------- CRITICAL FIX ----------------
    LIMIT = footer_row - 2   # reserve EXACT space for totals + footer safety

    current = START_ROW

    # ---------------- WRITE MALES ----------------
    for _, s in males.iterrows():
        if current >= LIMIT:
            break
        write_student(s, current)
        current += 1

    write_cell(current, 1, len(males))
    write_cell(current, 2, len(males))
    write_cell(current, 3, "<=== TOTAL MALE")
    current += 1

    # ---------------- WRITE FEMALES ----------------
    for _, s in females.iterrows():
        if current >= LIMIT:
            break
        write_student(s, current)
        current += 1

    write_cell(current, 1, len(females))
    write_cell(current, 2, len(females))
    write_cell(current, 3, "<=== TOTAL FEMALE")
    current += 1

    # ---------------- TOTAL ----------------
    total = len(males) + len(females)

    write_cell(current, 1, total)
    write_cell(current, 2, total)
    write_cell(current, 3, "<=== TOTAL COMBINED")

    # ---------------- EXTRA TOTAL BLOCK (NEW REQUIREMENT) ----------------

    # Row 59–61: Total Male (X-Z)
    write_cell(59, 24, len(males))  # X
    write_cell(59, 25, len(males))  # Y
    write_cell(59, 26, len(males))  # Z

    write_cell(60, 24, len(males))
    write_cell(60, 25, len(males))
    write_cell(60, 26, len(males))

    write_cell(61, 24, len(males))
    write_cell(61, 25, len(males))
    write_cell(61, 26, len(males))

    # Row 62–63: Total Female
    write_cell(62, 24, len(females))
    write_cell(62, 25, len(females))
    write_cell(62, 26, len(females))

    write_cell(63, 24, len(females))
    write_cell(63, 25, len(females))
    write_cell(63, 26, len(females))

    # Row 64–65: Total Combined
    write_cell(64, 24, total)
    write_cell(64, 25, total)
    write_cell(64, 26, total)

    write_cell(65, 24, total)
    write_cell(65, 25, total)
    write_cell(65, 26, total)

    # ---------------- ADVISER NAME (ROW 59–61, COL AE–AK) ----------------

    adviser_name = adviser_full_name(adviser)

    for c in range(31, 38):  # AE to AK = columns 31–37
        write_cell(59, c, adviser_name)
        write_cell(60, c, adviser_name)
        write_cell(61, c, adviser_name)

        wb.save(output_path)

        print(json.dumps({
            "filePath": output_path,
            "male": len(males),
            "female": len(females),
            "total": total
        }))

except Exception as e:
    print(f"[ERROR] {e}", file=sys.stderr)
    sys.exit(1)