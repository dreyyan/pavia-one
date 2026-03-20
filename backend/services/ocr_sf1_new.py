import pytesseract
from pdf2image import convert_from_path
import os
import re
import csv
from datetime import datetime
from PIL import Image, ImageOps

# ==============================
# PATH CONFIG
# ==============================
FORMS_PATH = "backend/forms/"
OUTPUT_DIR = "backend/forms/ocr_output"
POPPLER_PATH = r"C:\poppler-25.12.0\Library\bin"

os.makedirs(OUTPUT_DIR, exist_ok=True)

PDF_PATH = os.path.join(FORMS_PATH, "SF1.pdf")
TXT_PATH = os.path.join(OUTPUT_DIR, "SF1.txt")
CSV_PATH = os.path.join(OUTPUT_DIR, "SF1_cleaned.csv")

# ==============================
# OCR FUNCTION
# ==============================
def convert_pdf_to_text(pdf_path):
    pages = convert_from_path(pdf_path, dpi=300, poppler_path=POPPLER_PATH)
    text = ""
    for i, page in enumerate(pages):
        page = ImageOps.grayscale(page)
        page = ImageOps.invert(page)
        page_text = pytesseract.image_to_string(page, config="--oem 3 --psm 6")
        text += f"\n--- PAGE {i+1} ---\n{page_text}"
    return text

# ==============================
# CLEANING FUNCTIONS
# ==============================
def clean_name(val):
    if not val:
        return ""
    val = re.sub(r"[^A-Za-z\s\-']", "", val)
    val = re.sub(r"\s+", " ", val)
    return val.strip().title()

def clean_middle_name(val):
    return clean_name(val)

def compute_age(birth_date):
    try:
        bd = datetime.strptime(birth_date, "%m-%d-%Y")
        today = datetime.today()
        age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
        if age < 3 or age > 30:
            return ""
        return age
    except:
        return ""

def fix_birthdate(val):
    if not val:
        return ""
    val = val.replace(".", "-").replace("/", "-")
    try:
        datetime.strptime(val, "%m-%d-%Y")
        return val
    except:
        parts = val.split("-")
        if len(parts) == 3:
            m, d, y = parts
            if m.isdigit() and d.isdigit() and y.isdigit():
                if int(m) > 12 and int(d) <= 12:
                    return f"{d}-{m}-{y}"
                return f"{m}-{d}-{y}"
    return val

def clean_mother_tongue(val):
    if not val:
        return ""
    val = val.upper()
    mapping = {
        "HILIGAY": "Hiligaynon",
        "CEBU": "Cebuano",
        "KINAR": "Kinaray-a",
        "BINIS": "Binisay",
        "SINUG": "Sinugbuanon"
    }
    for k, v in mapping.items():
        if k in val:
            return v
    return val.title()

def clean_religion(val):
    if not val:
        return ""
    val = val.upper()
    mapping = {
        "CATH": "Catholic",
        "CHRIST": "Christian",
        "ISLAM": "Islam"
    }
    for k, v in mapping.items():
        if k in val:
            return v
    return val.title()

def clean_barangay(val):
    if not val:
        return ""
    val = re.sub(r"(PAVIA|ILOILO|HILIGAYNO|MOTHER|TONGUE).*", "", val, flags=re.I)
    val = re.sub(r"[^A-Z\s]", "", val.upper())
    val = re.sub(r"\s{2,}", " ", val)
    return val.strip().title()

# ==============================
# SMART NAME EXTRACTION
# ==============================
def extract_names(block):
    """
    Robustly extract Last, First, Middle names from OCR text block.
    Stops at common OCR artifacts and ignores garbage.
    """
    block = re.sub(r"^\d{12}", "", block).strip()  # Remove LRN
    block = block.replace("\n", " ")
    block = re.sub(r"\s{2,}", " ", block)  # Collapse spaces

    # Remove everything after artifact keywords
    artifacts = [
        r"M\s*-*", r"F\s*-*", r"HILIGAYNO", r"HILIGAY", r"CEBUANO", r"BINISAY",
        r"KINARAY-A", r"SINUGBUANON", r"CATHOLIC", r"CHRISTIAN", r"ISLAM",
        r"FACE TO FACE", r"MODULAR", r"ONLINE", r"--- PAGE ---", r"N TY", r"TY"
    ]
    artifact_pattern = "|".join(artifacts)
    block = re.split(artifact_pattern, block, flags=re.I)[0].strip()

    # Remove non-letter characters
    block = re.sub(r"[^A-Za-z\s\-']", " ", block)
    block = re.sub(r"\s{2,}", " ", block).strip()

    # Prefer comma-split: Last, First Middle
    if "," in block:
        parts = [p.strip() for p in block.split(",")]
        if len(parts) >= 2:
            last_name = clean_name(parts[0])
            first_middle = clean_name(parts[1]).split()
            first_name = first_middle[0] if first_middle else ""
            middle_name = " ".join(first_middle[1:]) if len(first_middle) > 1 else ""
            return last_name, first_name, middle_name

    # Otherwise split by spaces
    words = block.split()
    last_name = clean_name(words[0]) if len(words) >= 1 else ""
    first_name = clean_name(words[1]) if len(words) >= 2 else ""
    middle_name = clean_middle_name(" ".join(words[2:])) if len(words) > 2 else ""
    return last_name, first_name, middle_name

# ==============================
# OCR RUN
# ==============================
ocr_text = convert_pdf_to_text(PDF_PATH)
with open(TXT_PATH, "w", encoding="utf-8") as f:
    f.write(ocr_text)

# ==============================
# PARSE STUDENT BLOCKS
# ==============================
with open(TXT_PATH, encoding="utf-8") as f:
    text = f.read()

# Normalize
text = text.upper()
text = text.replace("|", " ")
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n+", "\n", text)

# Split blocks by LRN
blocks = re.split(r"(?=\b\d{12}\b)", text)
student_blocks = [b.strip() for b in blocks if re.match(r"\d{12}", b)]
print(f"📄 Found {len(student_blocks)} students")

# ==============================
# PARSE STUDENTS
# ==============================
students = []

for block in student_blocks:
    student = {
        "LRN": "",
        "Last Name": "",
        "First Name": "",
        "Middle Name": "",
        "Sex": "",
        "Birth Date": "",
        "Age": "",
        "Mother Tongue": "",
        "Religion": "",
        "Barangay": "",
        "Municipality": "Pavia",
        "Province": "Iloilo",
        "Learning Modality": "Face To Face",
        "Confidence": 100
    }

    def deduct(p):
        student["Confidence"] = max(student["Confidence"] - p, 0)

    # --- LRN ---
    lrn_match = re.match(r"\d{12}", block)
    if lrn_match:
        student["LRN"] = lrn_match.group()
    else:
        deduct(30)

    # --- Sex ---
    sex_match = re.search(r"\b(M|F)\b", block)
    if sex_match:
        student["Sex"] = sex_match.group()
    else:
        deduct(10)

    # --- Birthdate & Age ---
    bd_match = re.search(r"\b\d{2}[-./]\d{2}[-./]\d{4}\b", block)
    if bd_match:
        bd = fix_birthdate(bd_match.group())
        student["Birth Date"] = bd
        student["Age"] = compute_age(bd)
    else:
        deduct(15)

    # --- Mother Tongue ---
    mt_match = re.search(r"(HILIGAYNON|HILIGAYNO|CEBUANO|BINISAY|KINARAY-A|SINUGBUANON)", block)
    student["Mother Tongue"] = clean_mother_tongue(mt_match.group() if mt_match else "")
    if not mt_match:
        deduct(5)

    # --- Religion ---
    r_match = re.search(r"(CATHOLIC|CHRISTIAN|ISLAM)", block)
    student["Religion"] = clean_religion(r_match.group() if r_match else "")
    if not r_match:
        deduct(5)

    # --- Barangay ---
    brgy_match = re.search(r"([A-Z\s]+)\s+PAVIA\s+ILOILO", block)
    student["Barangay"] = clean_barangay(brgy_match.group(1) if brgy_match else "")
    if not brgy_match:
        deduct(10)

    # --- Learning Modality ---
    lm_match = re.search(r"(FACE TO FACE|MODULAR|ONLINE)", block)
    if lm_match:
        student["Learning Modality"] = lm_match.group().title()

    # --- Names (smart extraction) ---
    last, first, middle = extract_names(block)
    student["Last Name"] = last
    student["First Name"] = first
    student["Middle Name"] = middle

    students.append(student)

# ==============================
# SAVE CSV
# ==============================
if students:
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=students[0].keys())
        writer.writeheader()
        writer.writerows(students)

print(f"✅ Parsed {len(students)} students")
print(f"📁 Saved to {CSV_PATH}")
