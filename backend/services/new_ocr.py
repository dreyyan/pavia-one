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
            if m.isdigit() and d.isdigit():
                if int(m) > 12 and int(d) <= 12:
                    return f"{d}-{m}-{y}"
        return val

def clean_mother_tongue(val):
    if not val:
        return ""
    val = val.upper()
    mapping = {
        "HILIGAYNON": "Hiligaynon",
        "HILIGAYNO": "Hiligaynon",
        "HIIGAYNO": "Hiligaynon",
        "MIGAYNO": "Hiligaynon",
        "KINARAY-A": "Kinaray-a",
        "CEBUANO": "Cebuano",
        "BINISAYA": "Binisaya",
        "SINUGBUANON": "Sinugbuanon"
    }
    for k, v in mapping.items():
        if k in val:
            return v
    return val.title()

def clean_religion(val):
    if not val:
        return ""
    val = val.upper().replace(" ", "").replace("TY", "").replace("I", "").replace("AN", "").replace("CHRST", "CHRISTIAN")
    if "CHRIST" in val or "CHRS" in val:
        return "Christian"
    if "CATH" in val:
        return "Catholic"
    if "ISLAM" in val:
        return "Islam"
    return val.title()

def clean_barangay(val):
    if not val:
        return ""
    val = re.sub(r"(RISTIANI|T|I|O|CHRIST|CHRISTIAN|HILIGAYNON|MIGAYNO|HIIGAYNO|FACE|TO|DATE|PUROK|\(POB\.\)|POB|POS|AN|II|UNGKA|CHNS|R|FE AR|CHRSTAN|CHRST|N|Y|GAY|MILGAYNO|O|N TY|N Y|N|CHRSTIAN|CHRST|CHRSTAN).*", "", val, flags=re.I)
    val = re.sub(r"[^A-Z\s\-]", "", val.upper())
    val = re.sub(r"\s{2,}", " ", val).strip()
    if val in ["", "PAVIA"]:
        return ""
    return val.title()

# ==============================
# PROCESSING
# ==============================
ocr_text = convert_pdf_to_text(PDF_PATH)
with open(TXT_PATH, "w", encoding="utf-8") as f:
    f.write(ocr_text)

with open(TXT_PATH, encoding="utf-8") as f:
    text = f.read()

text = text.upper()
text = text.replace("|", " ")
text = re.sub(r"[ \t]+", " ", text)
text = re.sub(r"\n+", "\n", text)

blocks = re.split(r"(?=\b\d{12}\b)", text)
student_blocks = [b.strip() for b in blocks if re.match(r"^\d{12}", b)]

print(f"📄 Found {len(student_blocks)} students")

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
        "Confidence": 100,
        "Needs Review": "No"
    }

    def deduct(p):
        student["Confidence"] = max(student["Confidence"] - p, 0)

    # 1. LRN
    m = re.match(r"(\d{12})", block)
    if m:
        student["LRN"] = m.group(1)
        block = block[len(student["LRN"]):].strip()
    else:
        continue

    # 2. Name + Sex
    sex_match = re.search(r"\b(M|F)\b", block, re.I)
    if sex_match:
        student["Sex"] = sex_match.group(1).upper()
        name_str = block[:sex_match.start()].strip()
        after_sex = block[sex_match.end():].strip()
    else:
        deduct(20)
        name_str = block
        after_sex = ""

    # Parse name
    parts = [p.strip() for p in name_str.split(",") if p.strip()]
    if len(parts) >= 3:
        student["Last Name"] = clean_name(parts[0])
        student["First Name"] = clean_name(parts[1])
        student["Middle Name"] = clean_middle_name(parts[2])
    elif len(parts) == 2:
        student["Last Name"] = clean_name(parts[0])
        student["First Name"] = clean_name(parts[1])
    else:
        deduct(15)

    # 3. Birthdate + Age
    bd_age_match = re.search(r"(\d{2}[-./]\d{2}[-./]\d{4})\s*(\d{1,2})", after_sex)
    if bd_age_match:
        bd = fix_birthdate(bd_age_match.group(1))
        student["Birth Date"] = bd
        age = compute_age(bd)
        student["Age"] = str(age) if age else bd_age_match.group(2)
    else:
        deduct(15)

    # 4. Remaining text
    remaining = after_sex

    # 5. Mother Tongue
    mt_match = re.search(r"\d{1,2}\s+([A-Z\-/ ]+?)(?:\s+CHRISTIAN|\s+CATHOLIC|\s+ISLAM|\s+|$)", remaining, re.I)
    if mt_match:
        student["Mother Tongue"] = clean_mother_tongue(mt_match.group(1))
        remaining = remaining[mt_match.end():].strip()

    # 6. Religion
    rel_match = re.search(r"(CHRISTIAN|CATHOLIC|ISLAM|CHRISTIANTY|CHRISTIANI|CHRIST)", remaining, re.I)
    if rel_match:
        student["Religion"] = clean_religion(rel_match.group(0))
        remaining = remaining[rel_match.end():].strip()
    elif "CHRIST" in remaining or "CHRS" in remaining:
        student["Religion"] = "Christian"

    # 7. Barangay
    brgy_match = re.search(r"([A-Z\s\-()]+?)\s+PAVIA\s+ILOILO", remaining, re.I)
    if brgy_match:
        raw_brgy = brgy_match.group(1).strip()
        cleaned = clean_barangay(raw_brgy)
        if cleaned:
            student["Barangay"] = cleaned
    else:
        deduct(10)

    # 8. Learning Modality
    lm = re.search(r"(FACE TO FACE|MODULAR|ONLINE)", remaining, re.I)
    if lm:
        student["Learning Modality"] = lm.group().title()

    # Flag only if critical fields missing
    if not student["Sex"] or not student["Birth Date"] or not student["Barangay"]:
        student["Needs Review"] = "Yes"

    students.append(student)

# ==============================
# SAVE CSV
# ==============================
if students:
    fieldnames = list(students[0].keys())
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(students)
    print(f"✅ Parsed {len(students)} students")
    print(f"📁 Saved to {CSV_PATH}")
else:
    print("No students parsed. Check SF1.txt for raw output.")