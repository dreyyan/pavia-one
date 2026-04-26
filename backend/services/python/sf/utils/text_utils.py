import pandas as pd

# [HELPER] Clean token
def clean_token(s: str) -> str:
    """Strip surrounding whitespace and stray commas from a name token."""
    return s.strip().strip(",").strip()

def safe(v):
    return "" if pd.isna(v) else str(v)