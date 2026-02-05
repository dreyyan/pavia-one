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
# OCR FUNCTION WITH PREPROCESSING
# ==============================
def convert_pdf_to_text(pdf_path):
    pages = convert_from_path(pdf_path, dpi=300, poppler_path=POPPLER_PATH)
    text = ""
    for i, page in enumerate(pages):
        # Convert to grayscale and enhance contrast
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
            if m.isdigit() and d.isdigit():
                if int(m) > 12 and int(d) <= 12:
                    return f"{d}-{m}-{y}"
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
# OCR RUN
# ==============================
ocr_text = convert_pdf_to_text(PDF_PATH)
with open(TXT_PATH, "w", encoding="utf-8") as f:
    f.write(ocr_text)

with open(TXT_PATH, encoding="utf-8") as f:
    text = f.read()

# Normalize
text = text.upper()
text = text.replace("|", " ")
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n+", "\n", text)

# ==============================
# SPLIT STUDENT BLOCKS
# ==============================
blocks = re.split(r"(?=\b\d{12}\b)", text)
student_blocks = [b for b in blocks if re.match(r"\d{12}", b)]
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
    m = re.match(r"(\d{12})", block)
    if m:
        student["LRN"] = m.group(1)
    else:
        deduct(30)

    # --- Name parsing (robust) ---
    # Get the first line after LRN
    lines = block.strip().split("\n")
    if lines:
        name_line = lines[0].strip()
        # Remove LRN if present at the start
        if student["LRN"] and name_line.startswith(student["LRN"]):
            name_line = name_line[len(student["LRN"]):].strip()
        # Split by commas (Last, First, Middle)
        parts = [p.strip() for p in name_line.split(",")]
        if len(parts) >= 2:
            student["Last Name"] = clean_name(parts[0])
            # Combine all remaining parts for first + middle
            first_middle = " ".join(parts[1:]).split()
            if len(first_middle) >= 2:
                student["First Name"] = clean_name(" ".join(first_middle[:-1]))
                student["Middle Name"] = clean_middle_name(first_middle[-1])
            elif len(first_middle) == 1:
                student["First Name"] = clean_name(first_middle[0])
                student["Middle Name"] = ""
        else:
            deduct(25)
    else:
        deduct(25)

    # --- Sex ---
    s = re.search(r"\b(M|F)\b", block)
    if s:
        student["Sex"] = s.group(1)
    else:
        deduct(10)

    # --- Birthdate + Age ---
    bd_match = re.search(r"\b\d{2}[-./]\d{2}[-./]\d{4}\b", block)
    if bd_match:
        bd = fix_birthdate(bd_match.group())
        student["Birth Date"] = bd
        age = compute_age(bd)
        if age == "":
            deduct(10)
        student["Age"] = age
    else:
        deduct(15)

    # --- Mother Tongue ---
    mt = re.search(r"(HILIGAYNON|HILIGAYNO|CEBUANO|BINISAY|KINARAY-A|SINUGBUANON)", block)
    student["Mother Tongue"] = clean_mother_tongue(mt.group() if mt else "")
    if not mt:
        deduct(5)

    # --- Religion ---
    r = re.search(r"(CATHOLIC|CHRISTIAN|ISLAM)", block)
    student["Religion"] = clean_religion(r.group() if r else "")
    if not r:
        deduct(5)

    # --- Barangay ---
    brgy = re.search(r"([A-Z\s]+)\s+PAVIA\s+ILOILO", block)
    student["Barangay"] = clean_barangay(brgy.group(1) if brgy else "")
    if not brgy:
        deduct(10)

    # --- Learning Modality ---
    lm = re.search(r"(FACE TO FACE|MODULAR|ONLINE)", block)
    if lm:
        student["Learning Modality"] = lm.group().title()

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