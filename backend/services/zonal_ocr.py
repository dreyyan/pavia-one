from pdf2image import convert_from_path
from PIL import Image
import pytesseract
import re

POPPLER_PATH = r"C:\poppler-25.12.0\Library\bin"

SF1_ZONES = {
    "LRN": (150, 250, 900, 310),
    "Last Name": (150, 330, 600, 380),
    "First Name": (620, 330, 1050, 380),
    "Middle Name": (1080, 330, 1450, 380),
    "Sex": (150, 400, 250, 450),
    "Birth Date": (300, 400, 600, 450),
    "Age": (650, 400, 750, 450),
    "Barangay": (150, 470, 600, 520),
    "Municipality": (620, 470, 1050, 520),
    "Province": (1080, 470, 1450, 520),
    "Learning Modality": (150, 540, 600, 590),
}

def pdf_to_image(pdf_path):
    pages = convert_from_path(
        pdf_path,
        dpi=300,
        poppler_path=POPPLER_PATH
    )
    return pages[0]

def ocr_zone(image, box):
    cropped = image.crop(box)
    return pytesseract.image_to_string(
        cropped,
        config="--psm 7"
    )

def clean_text(text):
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def extract_sf1(pdf_path):
    image = pdf_to_image(pdf_path)
    data = {}

    for field, box in SF1_ZONES.items():
        raw = ocr_zone(image, box)
        data[field] = clean_text(raw)

    return data

# ---- RUN ----
if __name__ == "__main__":
    result = extract_sf1("backend/forms/SF1.pdf")
    for k, v in result.items():
        print(f"{k}: {v}")