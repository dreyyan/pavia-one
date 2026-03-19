import json
from openpyxl import load_workbook
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FORMS_DIR = os.path.join(BASE_DIR, "..", "forms")

CSV_PATH = os.path.join(FORMS_DIR, "output_data", "SF1_data.csv")
TEMPLATE_PATH = os.path.join(FORMS_DIR, "SF1_template.xlsx")
OUTPUT_PATH = os.path.join(FORMS_DIR, "SF1_filled_output.xlsx")
SCHOOL_JSON_PATH = os.path.join(FORMS_DIR, "school_data.json")

# Load student CSV
data = pd.read_csv(CSV_PATH).fillna("")

# Load general school info JSON
with open(SCHOOL_JSON_PATH, "r", encoding="utf-8") as f:
    school_info = json.load(f)

# -------------------------------------------------
# Workbook
# -------------------------------------------------
wb = load_workbook(TEMPLATE_PATH)
ws = wb.active
print("[SUCCESS] Loaded template and CSV")

# -------------------------------------------------
# CONFIG — SF1 LAYOUT
# -------------------------------------------------
START_ROW = 7        # First student row
ROW_HEIGHT = 1       # One row per student
SKIP_ROWS = {32, 59, 60}  # Totals rows

COL = {
    "lrn": 1, "name": 3, "sex": 7, "birth": 8, "age": 10,
    "mother_tongue": 12, "ip": 14, "religion": 15,
    "barangay": 18, "municipality": 21, "province": 23,
    "father": 28, "mother": 32, "modality": 44, "remarks": 45
}

# -------------------------------------------------
# SAFE WRITER
# -------------------------------------------------
def write_cell(ws, r, c, value, as_text=False):
    if value == "":
        return
    cell = ws.cell(r, c)
    # Handle merged cells
    for merge in ws.merged_cells.ranges:
        if cell.coordinate in merge:
            cell = ws.cell(merge.min_row, merge.min_col)
            break
    if as_text:
        cell.value = str(value)
        cell.number_format = "@"
    else:
        cell.value = value

# -------------------------------------------------
# Parent Name Formatter
# -------------------------------------------------
def format_parent_name(name_str):
    """Convert parent name to 'LAST, FIRST MIDDLE' in uppercase"""
    if not name_str.strip():
        return ""
    # Case 1: Already in 'LAST, FIRST MIDDLE' format
    if "," in name_str:
        parts = [p.strip() for p in name_str.split(",")]
        last = parts[0].upper()
        first_middle = parts[1].upper() if len(parts) > 1 else ""
        return f"{last}, {first_middle}".strip(", ")
    # Case 2: 'First Middle Last' format → assume last word is LAST NAME
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
# Fill general info from JSON
# -------------------------------------------------
write_cell(ws, 4, 20, "")  # School Year (T-X row 4) → frontend will fill
write_cell(ws, 4, 31, "")  # Grade Level (AE-AF row 4)
write_cell(ws, 4, 39, "")  # Section (AM-AT row 4)

# -------------------------------------------------
# Fill student data
# -------------------------------------------------
current_row = START_ROW
male_count = 0
female_count = 0

for _, student in data.iterrows():
    # Skip totals rows
    while current_row in SKIP_ROWS:
        current_row += 1

    sex = student.get("Sex", "").upper()
    if sex == "M":
        male_count += 1
    elif sex == "F":
        female_count += 1

    # LRN as text
    write_cell(ws, current_row, COL["lrn"], student.get("LRN", ""), as_text=True)

    # Name uppercase
    write_cell(
        ws, current_row, COL["name"],
        f'{student.get("Last Name","").upper()}, '
        f'{student.get("First Name","").upper()}, '
        f'{student.get("Middle Name","").upper()}'
    )

    write_cell(ws, current_row, COL["sex"], sex)
    write_cell(ws, current_row, COL["birth"], student.get("Birth Date", ""))
    write_cell(ws, current_row, COL["age"], student.get("Age", ""))

    # Mother Tongue & Religion (preserve capitalization)
    write_cell(ws, current_row, COL["mother_tongue"], student.get("Mother Tongue", ""))
    write_cell(ws, current_row, COL["ip"], student.get("IP Ethnic Group", "").upper())
    write_cell(ws, current_row, COL["religion"], student.get("Religion", ""))

    # Barangay / Municipality / Province uppercase
    write_cell(ws, current_row, COL["barangay"], student.get("Barangay", "").upper())
    write_cell(ws, current_row, COL["municipality"], student.get("Municipality", "").upper())
    write_cell(ws, current_row, COL["province"], student.get("Province", "ILOILO").upper())

    # Parent names formatted properly
    write_cell(ws, current_row, COL["father"], format_parent_name(student.get("Father Name", "")))
    write_cell(ws, current_row, COL["mother"], format_parent_name(student.get("Mother Maiden Name", "")))

    # Learning modality fix capitalization
    modality = student.get("Learning Modality", "")
    if modality.lower() == "face to face":
        modality = "Face to Face"
    write_cell(ws, current_row, COL["modality"], modality)

    write_cell(ws, current_row, COL["remarks"], student.get("Remarks", ""))

    current_row += ROW_HEIGHT

# -------------------------------------------------
# Insert Totals
# -------------------------------------------------
write_cell(ws, 32, 1, male_count)
write_cell(ws, 32, 2, male_count)

write_cell(ws, 59, 1, female_count)
write_cell(ws, 59, 2, female_count)

write_cell(ws, 60, 1, male_count + female_count)
write_cell(ws, 60, 2, male_count + female_count)

# -------------------------------------------------
# Save
# -------------------------------------------------
wb.save(OUTPUT_PATH)
print(f"[SUCCESS] Saved to {OUTPUT_PATH}")
print(f"Male: {male_count}, Female: {female_count}, Total: {male_count + female_count}")