"""
SF1 (School Form 1) Processor
Basic Education Enrollment Form
Contains: LRN, Name, Sex, Birthdate, Address, etc.
"""

import re
from base_ocr_processor import BaseOCRProcessor, ConfidenceTracker


class SF1Processor(BaseOCRProcessor):
    """Processor for SF1 - Student Enrollment Form"""
    
    def get_expected_fields(self):
        """Fields expected in SF1"""
        return [
            "LRN", "Last Name", "First Name", "Middle Name", "Sex",
            "Birth Date", "Age", "Mother Tongue", "Religion",
            "Barangay", "Municipality", "Province", "Learning Modality",
            "Confidence", "Needs Review"
        ]
    
    def parse_form(self, ocr_text):
        """Parse SF1 form from OCR text"""
        # Preprocess text
        text = ocr_text.upper()
        text = text.replace("|", " ")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n+", "\n", text)
        
        # Split into student blocks (each starts with 12-digit LRN)
        blocks = re.split(r"(?=\b\d{12}\b)", text)
        student_blocks = [b.strip() for b in blocks if re.match(r"^\d{12}", b)]
        
        print(f"📊 Found {len(student_blocks)} student records")
        
        students = []
        for i, block in enumerate(student_blocks, 1):
            student = self._parse_student_block(block)
            if student:
                students.append(student)
                if i % 10 == 0:
                    print(f"   Processed {i}/{len(student_blocks)} records...")
        
        return students
    
    def _parse_student_block(self, block):
        """Parse individual student record"""
        tracker = ConfidenceTracker()
        
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
        
        # 1. Extract LRN (12 digits)
        m = re.match(r"(\d{12})", block)
        if m:
            student["LRN"] = m.group(1)
            block = block[len(student["LRN"]):].strip()
        else:
            return None  # Skip if no valid LRN
        
        # 2. Extract Name + Sex (anchor on M/F)
        name_sex_match = re.search(r"([A-Z ,\-]+?)\s+(M|F)\b", block, re.I)
        if name_sex_match:
            name_line = name_sex_match.group(1).strip()
            student["Sex"] = name_sex_match.group(2).upper()
            
            # Parse name (format: LAST, FIRST, MIDDLE)
            parts = [p.strip() for p in name_line.split(",") if p.strip()]
            if len(parts) >= 3:
                student["Last Name"] = self.clean_name(parts[0])
                student["First Name"] = self.clean_name(parts[1])
                student["Middle Name"] = self.clean_middle_name(parts[2])
            elif len(parts) == 2:
                student["Last Name"] = self.clean_name(parts[0])
                student["First Name"] = self.clean_name(parts[1])
                tracker.deduct(5, "Missing middle name")
            else:
                tracker.deduct(15, "Incomplete name")
            
            after_sex = block[name_sex_match.end():].strip()
        else:
            tracker.deduct(20, "Name/Sex not found")
            after_sex = block
        
        # 3. Extract Birthdate + Age
        bd_age_match = re.search(r"(\d{2}[-./]\d{2}[-./]\d{4})\s*(\d{1,2})", after_sex)
        if bd_age_match:
            bd = self.fix_birthdate(bd_age_match.group(1))
            student["Birth Date"] = bd
            age = self.compute_age(bd)
            student["Age"] = str(age) if age else bd_age_match.group(2)
        else:
            tracker.deduct(15, "Birthdate not found")
        
        # 4. Extract Mother Tongue
        remaining = after_sex
        mt_match = re.search(r"\d{1,2}\s+([A-Z\-/ ]+?)(?:\s+CHRISTIAN|\s+CATHOLIC|\s+ISLAM|\s+|$)", remaining, re.I)
        if mt_match:
            student["Mother Tongue"] = self._clean_mother_tongue(mt_match.group(1))
            remaining = remaining[mt_match.end():].strip()
        
        # 5. Extract Religion
        rel_match = re.search(r"(CHRISTIAN|CATHOLIC|ISLAM|CHRISTIANTY|CHRISTIANI|CHRIST)", remaining, re.I)
        if rel_match:
            student["Religion"] = self._clean_religion(rel_match.group(0))
            remaining = remaining[rel_match.end():].strip()
        elif "CHRIST" in remaining or "CHRS" in remaining:
            student["Religion"] = "Christian"
        
        # 6. Extract Barangay
        brgy_match = re.search(r"([A-Z\s\-()]+?)\s+PAVIA\s+ILOILO", remaining, re.I)
        if brgy_match:
            raw_brgy = brgy_match.group(1).strip()
            cleaned = self._clean_barangay(raw_brgy)
            if cleaned:
                student["Barangay"] = cleaned
        else:
            tracker.deduct(10, "Barangay not found")
        
        # 7. Extract Learning Modality
        lm = re.search(r"(FACE TO FACE|MODULAR|ONLINE)", remaining, re.I)
        if lm:
            student["Learning Modality"] = lm.group().title()
        
        # Update confidence and review flag
        student["Confidence"] = tracker.get_confidence()
        
        # Flag for review if critical fields missing
        if not student["Sex"] or not student["Birth Date"] or not student["Barangay"]:
            student["Needs Review"] = "Yes"
        elif tracker.needs_review(threshold=75):
            student["Needs Review"] = "Yes"
        
        return student
    
    # ==============================
    # SF1-SPECIFIC CLEANING METHODS
    # ==============================
    
    def _clean_mother_tongue(self, val):
        """Clean mother tongue field"""
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
    
    def _clean_religion(self, val):
        """Clean religion field"""
        if not val:
            return ""
        val = val.upper().replace(" ", "").replace("TY", "").replace("I", "")
        val = val.replace("AN", "").replace("CHRST", "CHRISTIAN")
        
        if "CHRIST" in val or "CHRS" in val:
            return "Christian"
        if "CATH" in val:
            return "Catholic"
        if "ISLAM" in val:
            return "Islam"
        return val.title()
    
    def _clean_barangay(self, val):
        """Clean barangay field (remove noise)"""
        if not val:
            return ""
        
        # Remove common noise patterns
        noise_patterns = [
            "RISTIANI", "CHRIST", "CHRISTIAN", "HILIGAYNON", "MIGAYNO",
            "HIIGAYNO", "FACE", "TO", "DATE", "PUROK", r"\(POB\.\)",
            "POB", "POS", "UNGKA", "CHNS", "FE AR", "CHRSTAN", "CHRST",
            "GAY", "MILGAYNO", "N TY", "N Y", "CHRSTIAN"
        ]
        
        for pattern in noise_patterns:
            val = re.sub(pattern, "", val, flags=re.I)
        
        val = re.sub(r"[^A-Z\s\-]", "", val.upper())
        val = re.sub(r"\s{2,}", " ", val).strip()
        
        if val in ["", "PAVIA"]:
            return ""
        
        return val.title()


# ==============================
# STANDALONE EXECUTION
# ==============================
if __name__ == "__main__":
    processor = SF1Processor()
    result = processor.process("SF1.pdf")
    
    if result:
        print(f"\n{'='*60}")
        print(f"✅ SF1 Processing Complete!")
        print(f"{'='*60}")
        print(f"Records parsed: {result['records_count']}")
        print(f"Output CSV: {result['csv_path']}")