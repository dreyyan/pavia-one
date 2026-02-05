"""
Base OCR Processor for Student Forms (SF)
Handles common OCR operations and provides framework for specific form processors
"""

import pytesseract
from pdf2image import convert_from_path
import os
import re
import csv
from datetime import datetime
from PIL import Image, ImageOps
from abc import ABC, abstractmethod


class BaseOCRProcessor(ABC):
    """Abstract base class for SF OCR processors"""
    
    def __init__(self, forms_path="backend/forms/", output_dir="backend/forms/ocr_output",
                 poppler_path=r"C:\poppler-25.12.0\Library\bin"):
        self.forms_path = forms_path
        self.output_dir = output_dir
        self.poppler_path = poppler_path
        os.makedirs(output_dir, exist_ok=True)
    
    # ==============================
    # COMMON OCR METHODS
    # ==============================
    
    def convert_pdf_to_text(self, pdf_path, dpi=300):
        """Convert PDF to text using OCR with preprocessing"""
        pages = convert_from_path(pdf_path, dpi=dpi, poppler_path=self.poppler_path)
        text = ""
        for i, page in enumerate(pages):
            # Preprocessing for better OCR
            page = ImageOps.grayscale(page)
            page = ImageOps.invert(page)
            page_text = pytesseract.image_to_string(page, config="--oem 3 --psm 6")
            text += f"\n--- PAGE {i+1} ---\n{page_text}"
        return text
    
    def save_raw_text(self, text, filename):
        """Save raw OCR text for debugging"""
        output_path = os.path.join(self.output_dir, filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)
        return output_path
    
    def save_to_csv(self, data, csv_filename, fieldnames=None):
        """Save parsed data to CSV"""
        if not data:
            print(f"⚠️  No data to save for {csv_filename}")
            return None
        
        if fieldnames is None:
            fieldnames = list(data[0].keys())
        
        csv_path = os.path.join(self.output_dir, csv_filename)
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        
        print(f"✅ Saved {len(data)} records to {csv_path}")
        return csv_path
    
    # ==============================
    # COMMON CLEANING METHODS
    # ==============================
    
    @staticmethod
    def clean_name(val):
        """Clean and format names"""
        if not val:
            return ""
        val = re.sub(r"[^A-Za-z\s\-']", "", val)
        val = re.sub(r"\s+", " ", val)
        return val.strip().title()
    
    @staticmethod
    def clean_middle_name(val):
        """Clean middle name (same as regular name)"""
        return BaseOCRProcessor.clean_name(val)
    
    @staticmethod
    def fix_birthdate(val):
        """Fix and validate birthdate format"""
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
    
    @staticmethod
    def compute_age(birth_date, max_age=30, min_age=3):
        """Compute age from birthdate with validation"""
        try:
            bd = datetime.strptime(birth_date, "%m-%d-%Y")
            today = datetime.today()
            age = today.year - bd.year - ((today.month, today.day) < (bd.month, bd.day))
            if age < min_age or age > max_age:
                return ""
            return age
        except:
            return ""
    
    @staticmethod
    def clean_lrn(val):
        """Clean and validate LRN (12 digits)"""
        if not val:
            return ""
        val = re.sub(r"\D", "", val)  # Remove non-digits
        if len(val) == 12:
            return val
        return ""
    
    @staticmethod
    def clean_grade_level(val):
        """Clean grade level"""
        if not val:
            return ""
        # Extract numbers from grade level (e.g., "Grade 7" -> "7")
        match = re.search(r"(\d+)", str(val))
        if match:
            grade = int(match.group(1))
            if 7 <= grade <= 12:  # Valid high school grades
                return str(grade)
        return val
    
    @staticmethod
    def clean_section(val):
        """Clean section name"""
        if not val:
            return ""
        val = re.sub(r"[^A-Za-z0-9\s\-]", "", val)
        return val.strip().title()
    
    # ==============================
    # ABSTRACT METHODS (must implement)
    # ==============================
    
    @abstractmethod
    def parse_form(self, pdf_path):
        """Parse specific SF form - must be implemented by subclass"""
        pass
    
    @abstractmethod
    def get_expected_fields(self):
        """Return list of expected fields for this form type"""
        pass
    
    # ==============================
    # MAIN PROCESSING WORKFLOW
    # ==============================
    
    def process(self, pdf_filename):
        """Main processing workflow"""
        print(f"\n{'='*60}")
        print(f"Processing: {pdf_filename}")
        print(f"{'='*60}")
        
        pdf_path = os.path.join(self.forms_path, pdf_filename)
        
        if not os.path.exists(pdf_path):
            print(f"❌ File not found: {pdf_path}")
            return None
        
        # Step 1: OCR
        print("📄 Running OCR...")
        ocr_text = self.convert_pdf_to_text(pdf_path)
        
        # Step 2: Save raw text
        txt_filename = pdf_filename.replace(".pdf", ".txt")
        self.save_raw_text(ocr_text, txt_filename)
        print(f"💾 Raw text saved to {txt_filename}")
        
        # Step 3: Parse (form-specific)
        print("🔍 Parsing data...")
        parsed_data = self.parse_form(ocr_text)
        
        # Step 4: Save to CSV
        csv_filename = pdf_filename.replace(".pdf", "_cleaned.csv")
        csv_path = self.save_to_csv(parsed_data, csv_filename)
        
        return {
            "pdf_path": pdf_path,
            "txt_path": os.path.join(self.output_dir, txt_filename),
            "csv_path": csv_path,
            "records_count": len(parsed_data) if parsed_data else 0
        }


class ConfidenceTracker:
    """Helper class to track parsing confidence"""
    
    def __init__(self, initial_confidence=100):
        self.confidence = initial_confidence
        self.issues = []
    
    def deduct(self, points, reason=""):
        """Deduct confidence points"""
        self.confidence = max(self.confidence - points, 0)
        if reason:
            self.issues.append(reason)
    
    def get_confidence(self):
        """Get current confidence"""
        return self.confidence
    
    def needs_review(self, threshold=80):
        """Check if record needs manual review"""
        return self.confidence < threshold
    
    def get_issues(self):
        """Get list of issues"""
        return self.issues