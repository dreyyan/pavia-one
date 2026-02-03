# [IMPORT] Required Libraries
import pytesseract
from pdf2image import convert_from_path
import os, re

# [CONFIGURATION] Paths
FORMS_PATH = "backend/forms/"
forms = ["SF1", "SF2", "SF5", "SF10"]
output_dir = "backend/forms/ocr_output"

# [CONFIGURATION] Settings
os.makedirs(output_dir, exist_ok=True) # Make sure output directory exists

SF_FIELDS = {
    "SF1": [
        "LRN",
        "Name (Last Name, First Name, Middle Name)",
        "Sex",
        "Birth Date",
        "Age as of 1st Friday June",
        "Mother Tongue (Grade 1 to 3 Only)",
        "IP (Ethnic Group)",
        "Religion",
        {
            "Address": [
                "House #/Street/Sitio/Purok",
                "Barangay",
                "Municipality/City",
                "Province",
            ]
        },
        {
            "Parents": [
                "Father's Name (Last Name, First Name, Middle Name)",
                "Mother's Maiden Name (Last Name, First Name, Middle Name)",
            ]
        },
        {
            "Guardian (if Not Parent)": [
                "Name",
                "Relationship"
            ]
        },
        "Contact Number of Parent or Guardian",
        "Learning Modality",
        {
            "Remarks": [
                "(Please refer to the legend on the last page)"
            ]
        }
    ]
}

# [FUNCTION] Convert PDF to Text using Optical Character Recognition (OCR)
def convert_pdf_to_text(pdf_path):
    """Convert a scanned PDF to text using OCR."""
    pages = convert_from_path(
        pdf_path,
        dpi=300,
        poppler_path=r"C:\poppler-25.12.0\Library\bin"  # <-- force pdf2image to use Poppler
    )
    full_text = ""
    for page_number, page in enumerate(pages):
        text = pytesseract.image_to_string(page, config="--psm 6")
        full_text += f"\n\n--- Page {page_number + 1} ---\n\n{text}"
    return full_text

# [FUNCTION] Clean Extracted Text for Better Matching
def clean_text(text):
    text = text.replace("\n", " ")        # Replace newlines with spaces
    text = text.replace("\r", "")
    text = " ".join(text.split())         # Collapse multiple spaces
    return text.lower()                   # Convert to lowercase for matching

# [DATA STRUCTURE] Define Fields for Each Form
def flatten_fields(fields):
    flat_list = []
    for f in fields:
        if isinstance(f, str):
            flat_list.append(f)
        elif isinstance(f, dict):
            for key, subfields in f.items():
                for sub in subfields:
                    flat_list.append(f"{key} - {sub}")
    return flat_list

flat_sf1_fields = flatten_fields(SF_FIELDS["SF1"])
print(flat_sf1_fields)

# [FUNCTION] Extract Specific Fields from Text
def extract_field(text, field_name):
    # Use regex to get text after the field name until the next field (simplest approach)
    pattern = re.escape(field_name.lower()) + r"\s*[:\-]?\s*(.+?)(?=\s[A-Z]{2,}|\Z)"
    match = re.search(pattern, text)
    if match:
        return match.group(1).strip()
    return None

# [CONVERSION] Convert each form PDF to text and save the output
for form in forms:
    pdf_file = os.path.join(FORMS_PATH, f"{form}.pdf")
    if os.path.exists(pdf_file):
        text = convert_pdf_to_text(pdf_file)
        output_file = os.path.join(output_dir, f"{form}.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"OCR output saved: {output_file}")

        # Only extract SF1 if we're on SF1
        if form == "SF1":
            ocr_text_clean = clean_text(text)
            sf1_data = {}
            for field in flat_sf1_fields:
                sf1_data[field] = extract_field(ocr_text_clean, field)
            print(sf1_data)

# Split OCR text into lines and clean each line
lines = [clean_text(line) for line in text.splitlines() if line.strip()]

sf1_data = {}

for field in flat_sf1_fields:
    field_lower = field.lower()
    sf1_data[field] = None
    for i, line in enumerate(lines):
        if field_lower in line:
            # Try to get the value from same line after the field name
            value = line.split(field_lower, 1)[-1].strip(": -")
            if value:
                sf1_data[field] = value
            else:
                # Or get the next line if current line is empty
                if i + 1 < len(lines):
                    sf1_data[field] = lines[i + 1].strip()
            break

print(sf1_data)

import re

raw_text = open('backend/forms/ocr_output/SF1.txt').read()

# Split by LRN
students_raw = re.split(r'(\d{12})', raw_text)  # LRN is 12 digits
students = []

for i in range(1, len(students_raw), 2):
    lrn = students_raw[i]
    rest = students_raw[i+1]

    # Extract Birth Date
    birth_match = re.search(r'(\d{2}-\d{2}-\d{4})', rest)
    birth_date = birth_match.group(1) if birth_match else None

    # Extract Sex
    sex_match = re.search(r'\|\s*(M|F)\s*\|', rest)
    sex = sex_match.group(1) if sex_match else None

    # Extract Name (rough approach, might need more regex tuning)
    name_match = re.match(r'(.*?),\s*(.*?),\s*(.*?)\s*\|', rest)
    name = f"{name_match.group(1)}, {name_match.group(2)}, {name_match.group(3)}" if name_match else None

    students.append({
        'LRN': lrn,
        'Name': name,
        'Sex': sex,
        'Birth Date': birth_date
    })