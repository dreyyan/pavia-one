import json
import os
import pandas as pd
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter
import sys
from datetime import datetime

try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    FORMS_DIR = os.path.join(BASE_DIR, "..", "forms")
    OUTPUT_DIR = os.path.join(FORMS_DIR, "output_data")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    TEMPLATE_PATH = os.path.join(FORMS_DIR, "SF1_template.xlsx")
    OUTPUT_PATH = os.path.join(OUTPUT_DIR, "SF1_filled_output.xlsx")

    # --- Load student data ---
    if len(sys.argv) > 1:
        # If a JSON path is given, load from file
        input_json_path = sys.argv[1]
        if not os.path.exists(input_json_path):
            raise FileNotFoundError(f"JSON data not found at {input_json_path}")
        with open(input_json_path, "r", encoding="utf-8") as f:
            students_list = json.load(f)
    else:
        # Always read JSON from stdin
        input_str = sys.stdin.read()
        if not input_str.strip():
            raise FileNotFoundError("No JSON data received via stdin")
        students_list = json.loads(input_str)

    # Ensure optional fields exist to avoid missing columns
    for s in students_list:
        s.setdefault("Age", "")
        s.setdefault("Mother Tongue", "")
        s.setdefault("Religion", "")
        s.setdefault("Grade Level", "Grade 10")
        s.setdefault("Section", "A")
        s.setdefault("IP Ethnic Group", "")  # optional
        s.setdefault("Learning Modality", "")
        s.setdefault("Remarks", "")
        s.setdefault("Father Name", "")
        s.setdefault("Mother Maiden Name", "")
        s.setdefault("Barangay", "")
        s.setdefault("Municipality", "")
        s.setdefault("Province", "")

    data = pd.DataFrame(students_list).fillna("")

    # Load workbook
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")
    wb = load_workbook(TEMPLATE_PATH)
    ws = wb.active
    if ws is None:
        raise ValueError("Active worksheet is None")

    print("[SUCCESS] Loaded template and student data")

    def write_cell(ws, row, col, value, as_text=False):
        if value == "": return
        coord = f"{get_column_letter(col)}{row}"
        cell = ws.cell(row, col)
        for merged in ws.merged_cells.ranges:
            if cell.coordinate in merged:
                coord = f"{get_column_letter(merged.min_col)}{merged.min_row}"
                break
        ws[coord].value = str(value) if as_text else value

    # --- Fill header info on row 4 ---
    today = datetime.today()
    school_year_start = today.year
    school_year_end = today.year + 1
    school_year_str = f"{school_year_start} - {school_year_end}"
    for col in range(20, 25):  # T-X
        write_cell(ws, 4, col, school_year_str)

    # Example: grade level (dynamic)
    grade_level = data["Grade Level"].iloc[0] if "Grade Level" in data.columns else "Grade 10"
    write_cell(ws, 4, 31, grade_level)  # AE
    write_cell(ws, 4, 32, grade_level)  # AF

    # Section from first student (dynamic)
    section = data["Section"].iloc[0].upper() if "Section" in data.columns else "A"
    for col in range(39, 48):  # AM-AU
        write_cell(ws, 4, col, section)

    # Config
    START_ROW = 7
    COL = {
        "lrn": 1, "name": 3, "sex": 7, "birth": 8, "age": 10,
        "mother_tongue": 12, "ip": 14, "religion": 15,
        "barangay": 18, "municipality": 21, "province": 23,
        "father": 28, "mother": 32, "modality": 44, "remarks": 45
    }

    # Helpers
    def is_male(sex): return str(sex).upper() in ("M", "MALE")
    def is_female(sex): return str(sex).upper() in ("F", "FEMALE")

    def format_parent_name(name_str):
        if not str(name_str).strip(): return ""
        if "," in name_str:
            parts = [p.strip() for p in name_str.split(",")]
            last = parts[0].upper()
            first_middle = parts[1].upper() if len(parts) > 1 else ""
            return f"{last}, {first_middle}".strip(", ")
        words = name_str.strip().split()
        if len(words) == 1: return words[0].upper()
        elif len(words) == 2:
            first, last = words
            return f"{last.upper()}, {first.upper()}"
        else:
            *first_middle, last = words
            return f"{last.upper()}, {' '.join(first_middle).upper()}"

    def write_student(student, row):
        sex_display = "M" if is_male(student.get("Sex", "")) else "F"
        write_cell(ws, row, COL["lrn"], student.get("LRN", ""), as_text=True)
        last = student.get("Last Name", "").upper()
        first = student.get("First Name", "").upper()
        middle = student.get("Middle Name", "").upper()
        name = f"{last}, {first}" + (f" {middle}" if middle else "")
        write_cell(ws, row, COL["name"], name)
        write_cell(ws, row, COL["sex"], sex_display)
        birth = str(student.get("Birth Date", "")).split("T")[0]
        write_cell(ws, row, COL["birth"], birth)
        write_cell(ws, row, COL["age"], student.get("Age", ""))
        write_cell(ws, row, COL["mother_tongue"], student.get("Mother Tongue", ""))
        write_cell(ws, row, COL["ip"], student.get("IP Ethnic Group", "").upper())
        write_cell(ws, row, COL["religion"], student.get("Religion", ""))
        write_cell(ws, row, COL["barangay"], student.get("Barangay", "").upper())
        write_cell(ws, row, COL["municipality"], student.get("Municipality", "").upper())
        write_cell(ws, row, COL["province"], student.get("Province", "ILOILO").upper())
        write_cell(ws, row, COL["father"], format_parent_name(student.get("Father Name", "")))
        write_cell(ws, row, COL["mother"], format_parent_name(student.get("Mother Maiden Name", "")))
        modality = student.get("Learning Modality", "").replace("_", " ").title()
        write_cell(ws, row, COL["modality"], modality)
        write_cell(ws, row, COL["remarks"], student.get("Remarks", ""))

    # Prepare student lists
    males = data[data["Sex"].apply(is_male)].sort_values(by=["Last Name", "First Name", "Middle Name"])
    females = data[data["Sex"].apply(is_female)].sort_values(by=["Last Name", "First Name", "Middle Name"])

    # --- Find footer row ---
    marker_text = "List and Code of Indicators under REMARKS column"
    footer_row = None
    for r in range(START_ROW, ws.max_row + 1):
        for c in range(1, 20):
            val = ws.cell(r, c).value
            if val and isinstance(val, str) and marker_text in val:
                footer_row = r
                break
        if footer_row:
            break

    if footer_row is None:
        footer_row = ws.max_row + 1
        print("[WARNING] Footer marker not found — template below may be overwritten")

    # --- Determine row budget ---
    total_students = len(males) + len(females)
    needed_rows = total_students + 3  # +3 for TOTAL MALE, TOTAL FEMALE, TOTAL COMBINED
    available_rows = footer_row - START_ROW  # blank rows the template provides

    if needed_rows > available_rows:
        # Insert extra rows above the footer to fit all students
        shortfall = needed_rows - available_rows
        ws.insert_rows(START_ROW, shortfall)
        footer_row += shortfall
        print(f"[INFO] Inserted {shortfall} rows; footer now at row {footer_row}")

    # --- Clear the now-exact data region (START_ROW to footer_row - 1) ---
    for r in range(START_ROW, footer_row):
        for c in range(1, ws.max_column + 1):
            cell = ws.cell(r, c)
            for merged in ws.merged_cells.ranges:
                if cell.coordinate in merged:
                    cell = ws.cell(merged.min_row, merged.min_col)
                    break
            cell.value = None

    # --- Write students and totals ---
    current_row = START_ROW

    def write_group(students):
        global current_row
        for _, student in students.iterrows():
            write_student(student, current_row)
            current_row += 1

    write_group(males)
    male_count = len(males)
    write_cell(ws, current_row, 1, male_count)
    write_cell(ws, current_row, 2, male_count)
    write_cell(ws, current_row, 3, "<=== TOTAL MALE")
    current_row += 1

    write_group(females)
    female_count = len(females)
    write_cell(ws, current_row, 1, female_count)
    write_cell(ws, current_row, 2, female_count)
    write_cell(ws, current_row, 3, "<=== TOTAL FEMALE")
    current_row += 1

    grand_total = male_count + female_count
    write_cell(ws, current_row, 1, grand_total)
    write_cell(ws, current_row, 2, grand_total)
    write_cell(ws, current_row, 3, "<=== TOTAL COMBINED")
    current_row += 1

    # --- Hide surplus blank rows between last written row and footer ---
    # Equivalent to Excel: select rows -> right-click -> Delete -> Entire Row
    # Hiding preserves footer merged cells, row heights, and formatting in place
    for r in range(current_row, footer_row):
        ws.row_dimensions[r].hidden = True
    surplus_hidden = footer_row - current_row
    if surplus_hidden > 0:
        print(f"[INFO] Hid {surplus_hidden} surplus blank rows (rows {current_row}-{footer_row - 1})")

    # Save workbook
    wb.save(OUTPUT_PATH)
    print(f"[SUCCESS] Saved to {OUTPUT_PATH}")
    print(f"Male: {male_count}, Female: {female_count}, Total: {grand_total}")

except Exception as e:
    print(f"[ERROR] {e}", file=sys.stderr)
    sys.exit(1)