# [IMPORT] Libraries
import os
import io
import sys
import json
import pandas as pd
from openpyxl import load_workbook # pyright: ignore[reportMissingModuleSource]

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_ROOT = os.path.abspath(
    os.path.join(BASE_DIR, "..", "..", "..", "..", "..")
)

FORMS_DIR = os.path.join(PROJECT_ROOT, "forms")

CSV_PATH = os.path.join(FORMS_DIR, "output_data", "SF1_data.csv")
TEMPLATE_PATH = os.path.join(FORMS_DIR, "SF1_template.xlsx")
OUTPUT_PATH = os.path.join(FORMS_DIR, "output_data/SF1_filled_output.xlsx")
SCHOOL_JSON_PATH = os.path.join(FORMS_DIR, "school_data.json")

# -------------------------------------------------
# Load data
# -------------------------------------------------
data = pd.read_csv(CSV_PATH).fillna("")

with open(SCHOOL_JSON_PATH, "r", encoding="utf-8") as f:
    school_info = json.load(f)

# -------------------------------------------------
# Load workbook
# -------------------------------------------------
wb = load_workbook(TEMPLATE_PATH)
ws = wb.active
print("[SUCCESS] Loaded template and CSV")

# -------------------------------------------------
# Config
# -------------------------------------------------
START_ROW = 7
SKIP_ROWS = {32, 59, 60}

COL = {
    "lrn": 1, "name": 3, "sex": 7, "birth": 8, "age": 10,
    "mother_tongue": 12, "ip": 14, "religion": 15,
    "barangay": 18, "municipality": 21, "province": 23,
    "father": 28, "mother": 32, "modality": 44, "remarks": 45
}

# -------------------------------------------------
# Helpers
# -------------------------------------------------
def is_male(sex):
    return str(sex).upper() in ("M", "MALE")

def is_female(sex):
    return str(sex).upper() in ("F", "FEMALE")

def format_parent_name(name_str):
    if not str(name_str).strip():
        return ""
    if "," in name_str:
        parts = [p.strip() for p in name_str.split(",")]
        last = parts[0].upper()
        first_middle = parts[1].upper() if len(parts) > 1 else ""
        return f"{last}, {first_middle}".strip(", ")
    words = name_str.strip().split()
    if len(words) == 1:
        return words[0].upper()
    elif len(words) == 2:
        first, last = words
        return f"{last.upper()}, {first.upper()}"
    else:
        *first_middle, last = words
        return f"{last.upper()}, {' '.join(first_middle).upper()}"

# -------------------------------------------------
# Safe cell writer (fixes merged cell errors)
# -------------------------------------------------
def write_cell(ws, row, col, value, as_text=False):
    if value == "":
        return
    cell = ws.cell(row, col)
    # If this cell is part of a merged range, write to the top-left cell
    for merged in ws.merged_cells.ranges:
        if cell.coordinate in merged:
            cell = ws.cell(merged.min_row, merged.min_col)
            break
    cell.value = str(value) if as_text else value

# -------------------------------------------------
# Student writer
# -------------------------------------------------
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

# -------------------------------------------------
# Prepare student lists
# -------------------------------------------------
males = data[data["Sex"].apply(is_male)].sort_values(by=["Last Name", "First Name", "Middle Name"])
females = data[data["Sex"].apply(is_female)].sort_values(by=["Last Name", "First Name", "Middle Name"])

# -------------------------------------------------
# Write students
# -------------------------------------------------
current_row = START_ROW

def write_group(students):
    global current_row
    for _, student in students.iterrows():
        while current_row in SKIP_ROWS:
            current_row += 1
        write_student(student, current_row)
        current_row += 1

# -------------------------------------------------
# Male
# -------------------------------------------------
write_group(males)
male_count = len(males)
while current_row in SKIP_ROWS:
    current_row += 1
write_cell(ws, current_row, 1, male_count)
write_cell(ws, current_row, 2, male_count)
write_cell(ws, current_row, 3, "<=== TOTAL MALE")
current_row += 1

# -------------------------------------------------
# Female
# -------------------------------------------------
write_group(females)
female_count = len(females)
while current_row in SKIP_ROWS:
    current_row += 1
write_cell(ws, current_row, 1, female_count)
write_cell(ws, current_row, 2, female_count)
write_cell(ws, current_row, 3, "<=== TOTAL FEMALE")
current_row += 1

# -------------------------------------------------
# Grand total
# -------------------------------------------------
grand_total = male_count + female_count
while current_row in SKIP_ROWS:
    current_row += 1
write_cell(ws, current_row, 1, grand_total)
write_cell(ws, current_row, 2, grand_total)
write_cell(ws, current_row, 3, "<=== TOTAL COMBINED")
current_row += 1

# -------------------------------------------------
# Save
# -------------------------------------------------
wb.save(OUTPUT_PATH)
print(f"[SUCCESS] Saved to {OUTPUT_PATH}")
print(f"Male: {male_count}, Female: {female_count}, Total: {grand_total}")