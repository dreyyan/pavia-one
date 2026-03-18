# [IMPORT] Libraries
import pandas as pd
import os
import re

# [SETUP] File Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FORMS_DIR = os.path.join(BASE_DIR, "..", "forms")
SF1_PATH = os.path.join(FORMS_DIR, "SF1.xlsx")
OUTPUT_DIR = os.path.join(FORMS_DIR, "ocr_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------
# STEP 1: Load Raw Data
# -------------------------------------------------
raw = pd.read_excel(SF1_PATH, header=None).fillna("")
print("[SUCCESS] Loaded SF1.xlsx (raw mode)")

# -------------------------------------------------
# STEP 2A: Detect Header Rows
# -------------------------------------------------
main_header = None
sub_header = None

for i in range(len(raw)):
    row = " ".join(str(v).upper() for v in raw.iloc[i])
    if "LRN" in row and "NAME" in row:
        main_header = i
    if "BARANGAY" in row and "MUNICIPALITY" in row:
        sub_header = i

if main_header is None or sub_header is None:
    raise RuntimeError("[ERROR] Could not detect SF1 header rows")
print(f">> Main header row: {main_header}")
print(f">> Sub header row : {sub_header}")

# -------------------------------------------------
# STEP 2B: Detect "Parents" Row
# -------------------------------------------------
parents_header = None
for i in range(len(raw)):
    row = " ".join(str(v).upper() for v in raw.iloc[i])
    if "FATHER" in row or "MOTHER" in row:
        parents_header = i
        break
print(f">> Parents header row: {parents_header}")

# Handle merged cells by "ffill"
raw.iloc[main_header] = raw.iloc[main_header].ffill()
if sub_header:
    raw.iloc[sub_header] = raw.iloc[sub_header].ffill()
if parents_header:
    raw.iloc[parents_header] = raw.iloc[parents_header].ffill()

# [FUNCTION] Normalize columns
def norm(col):
    return (
        col.lower()
        .replace("\n", " ")
        .replace(".", "")
        .replace("(", "")
        .replace(")", "")
        .replace("/", " ")
        .strip()
    )

# -------------------------------------------------
# STEP 3: Merge headers including Parents row and Remarks row (fixed priority)
# -------------------------------------------------
remarks_header = None
for i in range(len(raw)):
    row = " ".join(str(v).upper() for v in raw.iloc[i])
    if "REMARK" in row:
        remarks_header = i
        break
print(f">> Remarks header row: {remarks_header}")

merged_headers = []
for col_idx in range(len(raw.columns)):
    main = str(raw.iloc[main_header, col_idx]).strip()
    sub = str(raw.iloc[sub_header, col_idx]).strip() if sub_header else ""
    parents = str(raw.iloc[parents_header, col_idx]).strip() if parents_header else ""
    remarks = str(raw.iloc[remarks_header, col_idx]).strip() if remarks_header else ""

    # Determine column type
    col_name = main  # default

    # Use sub-header if available
    if sub:
        col_name = sub
    # Use parents row only for Father/Mother columns
    if parents and any(k in parents.upper() for k in ["FATHER", "MOTHER"]):
        col_name = parents
    # Use remarks only if this column is actually the remarks column
    if remarks and any(k in remarks.upper() for k in ["REMARK"]):
        col_name = remarks

    merged_headers.append(col_name)

merged_headers = [norm(c) for c in merged_headers]

# -------------------------------------------------
# STEP 4: Load Data
# -------------------------------------------------
# Skip rows: sub_header (header), parents_header (already merged), remarks_header
skip_rows = [main_header, sub_header]
if parents_header: skip_rows.append(parents_header)
if remarks_header: skip_rows.append(remarks_header)

df = raw.drop(skip_rows).copy()
df.columns = merged_headers
df = df.fillna("")

print(">> Final detected columns:")
for c in df.columns:
    if c:
        print(" -", c)
        
# -------------------------------------------------
# STEP 5: Column Finder
# -------------------------------------------------
def find_col(keywords, skip=[]):
    for col in df.columns:
        if col in skip:
            continue
        col_norm = norm(col)
        for kw in keywords:
            kw_norm = norm(kw)
            if kw_norm in col_norm:
                return col
    return None

used_cols = []
COL = {}

COL["lrn"] = find_col(["lrn"], skip=used_cols)
if COL["lrn"]:
    used_cols.append(COL["lrn"])
COL["name"] = find_col(["last name", "first name", "middle name"], skip=used_cols)
if COL["name"]:
    used_cols.append(COL["name"])
COL["sex"] = find_col(["sex"], skip=used_cols)
if COL["sex"]:
    used_cols.append(COL["sex"])
COL["birth"] = find_col(["birth"], skip=used_cols)
if COL["birth"]:
    used_cols.append(COL["birth"])
COL["age"] = find_col(["age"], skip=used_cols)
if COL["age"]:
    used_cols.append(COL["age"])
COL["mother_tongue"] = find_col(["mother tongue"], skip=used_cols)
if COL["mother_tongue"]:
    used_cols.append(COL["mother_tongue"])
COL["religion"] = find_col(["religion"], skip=used_cols)
if COL["religion"]:
    used_cols.append(COL["religion"])
COL["barangay"] = find_col(["barangay"], skip=used_cols)
if COL["barangay"]:
    used_cols.append(COL["barangay"])
COL["municipality"] = find_col(["municipality", "city"], skip=used_cols)
if COL["municipality"]:
    used_cols.append(COL["municipality"])
COL["province"] = find_col(["province"], skip=used_cols)
if COL["province"]:
    used_cols.append(COL["province"])
COL["father_name"] = find_col(["father", "father's", "father name", "father's name"], skip=used_cols)
if COL["father_name"]:
    used_cols.append(COL["father_name"])
COL["mother_maiden_name"] = find_col(["mother", "mother's", "maiden", "mother maiden", "mother's maiden", "maiden name"], skip=used_cols)
if COL["mother_maiden_name"]:
    used_cols.append(COL["mother_maiden_name"])
COL["learning_modality"] = find_col(["learning modality"], skip=used_cols)
if COL["learning_modality"]:
    used_cols.append(COL["learning_modality"])
COL["remarks"] = find_col(["remark", "remarks"], skip=used_cols)
if COL["remarks"]:
    used_cols.append(COL["remarks"])

print(">> Assigned columns:")
for k, v in COL.items():
    print(f" - {k}: {v}")

# -------------------------------------------------
# STEP 6: Name Splitter
# -------------------------------------------------
def split_name(val):
    parts = [p.strip() for p in val.split(",") if p.strip()]
    if not parts:
        return "", "", ""
    last = parts[0]
    first = parts[1] if len(parts) > 1 else ""
    middle = parts[2] if len(parts) > 2 else ""
    return last.title(), first.title(), middle.title()

# -------------------------------------------------
# STEP 6B: Parent Name Parser
# -------------------------------------------------
def parse_parent_name(val):
    parts = [p.strip() for p in val.split(",") if p.strip()]
    if not parts:
        return ""
    last = parts[0].title()
    if len(parts) == 1:
        return last
    first_middle = " ".join([p.title() for p in parts[1:]])
    return f"{first_middle} {last}"

# -------------------------------------------------
# STEP 7: Parse Students
# -------------------------------------------------
students = []
for _, row in df.iterrows():
    lrn = str(row.get(COL["lrn"], "")).strip()
    if not re.fullmatch(r"\d{6,12}", lrn):
        continue
    last, first, middle = split_name(row.get(COL["name"], ""))
    try:
        age = int(float(row.get(COL["age"], "")))
    except:
        age = ""
    father_raw = row.get(COL["father_name"], "")
    mother_raw = row.get(COL["mother_maiden_name"], "")
    students.append({
        "LRN": lrn,
        "Last Name": last,
        "First Name": first,
        "Middle Name": middle,
        "Sex": row.get(COL["sex"], "").upper(),
        "Birth Date": row.get(COL["birth"], ""),
        "Age": age,
        "Mother Tongue": row.get(COL["mother_tongue"], "").title(),
        "Religion": row.get(COL["religion"], "").title(),
        "Barangay": row.get(COL["barangay"], "").title(),
        "Municipality": row.get(COL["municipality"], "Pavia").title(),
        "Province": row.get(COL["province"], "Iloilo").title(),
        "Father Name": parse_parent_name(father_raw),
        "Mother Maiden Name": parse_parent_name(mother_raw),
        "Learning Modality": row.get(COL["learning_modality"], "").title(),
        "Remarks": row.get(COL["remarks"], ""),
    })
print(f"\n>> Parsed {len(students)} students")

# -------------------------------------------------
# STEP 8: Save Data to CSV
# -------------------------------------------------
out = pd.DataFrame(students)
out_path = os.path.join(OUTPUT_DIR, "SF1_cleaned.csv")
out.to_csv(out_path, index=False, encoding="utf-8-sig")
print(f"[SUCCESS] Saved cleaned data to {out_path}")