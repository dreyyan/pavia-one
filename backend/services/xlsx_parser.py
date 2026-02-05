import pandas as pd
import os
import re

# ==============================
# PATH CONFIG
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FORMS_DIR = os.path.join(BASE_DIR, "..", "forms")
OUTPUT_DIR = os.path.join(FORMS_DIR, "ocr_output")

os.makedirs(OUTPUT_DIR, exist_ok=True)

SF1_PATH = os.path.join(FORMS_DIR, "SF1.xlsx")
CSV_PATH = os.path.join(OUTPUT_DIR, "SF1_cleaned.csv")

# ==============================
# LOAD RAW (NO HEADER)
# ==============================
raw = pd.read_excel(SF1_PATH, header=None)
raw = raw.fillna("")

print("✅ Loaded SF1.xlsx (raw mode)")

# ==============================
# FIND HEADER ROW (LOOK FOR LRN)
# ==============================
header_row = None

for i in range(len(raw)):
    row_text = " ".join(str(v).upper() for v in raw.iloc[i])
    if "LRN" in row_text and "NAME" in row_text:
        header_row = i
        break

if header_row is None:
    raise RuntimeError("❌ Could not find SF1 header row (LRN / NAME)")

print(f"📍 Header row detected at index {header_row}")

# ==============================
# RELOAD WITH CORRECT HEADER
# ==============================
df = pd.read_excel(SF1_PATH, header=header_row)
df = df.fillna("")

# Normalize column names
def norm(col):
    return (
        str(col)
        .lower()
        .replace("\n", " ")
        .replace(".", "")
        .replace("(", "")
        .replace(")", "")
        .replace("/", "")
        .strip()
    )

df.columns = [norm(c) for c in df.columns]

print("📌 Final detected columns:")
for c in df.columns:
    print(" -", c)

# ==============================
# COLUMN FINDER
# ==============================
def find_col(keywords):
    for col in df.columns:
        for kw in keywords:
            if kw in col:
                return col
    return None

COL = {
    "lrn": find_col(["lrn"]),
    "name": find_col(["name"]),
    "sex": find_col(["sex"]),
    "birth": find_col(["birth"]),
    "age": find_col(["age"]),
    "mother_tongue": find_col(["mother tongue"]),
    "religion": find_col(["religion"]),
    "address": find_col(["address"]),
    "barangay": find_col(["barangay"]),
}

print("\n🧭 Column mapping:")
for k, v in COL.items():
    print(f"{k:15} -> {v}")

# ==============================
# NAME SPLITTER (CORRECT)
# ==============================
def split_name(val):
    if not val or "," not in val:
        return "", "", ""
    parts = [p.strip() for p in val.split(",")]
    last = parts[0] if len(parts) > 0 else ""
    first = parts[1] if len(parts) > 1 else ""
    middle = parts[2] if len(parts) > 2 else ""
    return last.title(), first.title(), middle.title()

# ==============================
# PARSE STUDENTS
# ==============================
students = []

for _, row in df.iterrows():
    lrn = str(row.get(COL["lrn"], "")).strip()

    if not re.fullmatch(r"\d{6,12}", lrn):
        continue  # skip non-student rows

    last, first, middle = split_name(str(row.get(COL["name"], "")))

    student = {
        "LRN": lrn,
        "Last Name": last,
        "First Name": first,
        "Middle Name": middle,
        "Sex": str(row.get(COL["sex"], "")).upper(),
        "Birth Date": str(row.get(COL["birth"], "")),
        "Age": str(row.get(COL["age"], "")),
        "Mother Tongue": str(row.get(COL["mother_tongue"], "")).title(),
        "Religion": str(row.get(COL["religion"], "")).title(),
        "Barangay": str(row.get(COL["barangay"], "")).title(),
        "Municipality": "Pavia",
        "Province": "Iloilo",
        "Learning Modality": "Face To Face",
        "Confidence": 100,
        "Needs Review": "No",
    }

    # Confidence scoring
    for k in ["Last Name", "First Name", "Sex", "Birth Date"]:
        if not student[k]:
            student["Confidence"] -= 10

    if student["Confidence"] < 90:
        student["Needs Review"] = "Yes"

    students.append(student)

print(f"\n📄 Parsed {len(students)} students")

# ==============================
# SAVE CSV
# ==============================
out = pd.DataFrame(students)
out.to_csv(CSV_PATH, index=False, encoding="utf-8")

print(f"✅ Saved cleaned data to {CSV_PATH}")
