# [IMPORT] Libraries
from datetime import datetime
import pandas as pd

# [IMPORT] Utilities
from sf.utils.text_utils import safe

def normalize_sex(raw: str) -> str:
    v = raw.strip().upper()
    if v in ("M", "MALE"):
        return "MALE"
    return "FEMALE"

def normalize_date(raw) -> str:
    """Return ISO date string YYYY-MM-DD or empty string."""
    if not raw:
        return ""
    s = str(raw).strip().split("T")[0]
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s  # return as-is if unparseable

def normalize_modality(raw: str) -> str:
    """Map human-readable modality to Prisma LearningModality enum."""
    mapping = {
        "face to face":      "FACE_TO_FACE",
        "f2f":               "FACE_TO_FACE",
        "face-to-face":      "FACE_TO_FACE",
        "distance":          "DISTANCE_LEARNING",
        "modular":           "DISTANCE_LEARNING",
        "distance learning": "DISTANCE_LEARNING",
        "blended":           "BLENDED",
        "online":            "ONLINE",
        "homeschool":        "HOMESCHOOL",
        "homeschooling":     "HOMESCHOOL",
    }
    return mapping.get(raw.strip().lower(), "FACE_TO_FACE")

def normalize_lrn(raw: str) -> str:
    """
    Normalize LRN to a plain integer string.
    openpyxl reads numeric cells as floats → "115521180060.0" → "115521180060"
    """
    s = raw.strip()
    try:
        return str(int(float(s)))
    except (ValueError, OverflowError):
        return s  # already a non-numeric string; return as-is

def is_male(v): return safe(v).upper() in ("M", "MALE")

def is_female(v): return safe(v).upper() in ("F", "FEMALE")

def format_birthdate(v):
    v = safe(v)
    if not v:
        return ""

    v = v.split("T")[0]

    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(v, fmt).strftime("%m-%d-%Y")
        except ValueError:
            continue

    return v  # fallback if unknown format