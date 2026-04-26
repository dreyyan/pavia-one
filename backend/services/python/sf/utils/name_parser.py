# [IMPORT] Utilities
from sf.utils.text_utils import ( clean_token, safe )

# [HELPER] Parse student's full name in the format "LAST, FIRST, MIDDLE"
def parse_name(combined: str):
    combined = combined.strip()
    if not combined:
        return "", "", ""

    if "," in combined:
        # Split only on the FIRST comma → last | "first [middle...]"
        last_raw, rest_raw = combined.split(",", 1)
        last  = clean_token(last_raw).title()
        parts = [clean_token(p) for p in rest_raw.split() if clean_token(p)]
        first  = parts[0].title() if parts else ""
        # Everything after the first word is the middle name
        middle = " ".join(p.title() for p in parts[1:]) if len(parts) > 1 else ""
    else:
        words = [clean_token(w) for w in combined.split() if clean_token(w)]
        if len(words) == 1:
            return words[0].title(), "", ""
        elif len(words) == 2:
            return words[-1].title(), words[0].title(), ""
        else:
            last   = words[-1].title()
            first  = words[0].title()
            middle = " ".join(w.title() for w in words[1:-1])

    return last, first, middle

# [HELPER] Parse guardian's full name in the format "LAST, FIRST, MIDDLE"
def parse_guardian_name(full: str):
    if not full or not full.strip():
        return "", "", ""

    tokens = [clean_token(t) for t in full.replace(",", " , ").split() if clean_token(t)]
    # Remove any empty tokens that resulted from lone commas
    tokens = [t for t in tokens if t]

    # Detect "LAST, FIRST [MIDDLE...]" pattern — comma immediately after first token
    if len(tokens) >= 2 and full.strip().index(",") < len(full.strip().split()[0]) + 2:
        # First word before comma is the last name
        raw_last = clean_token(full.split(",", 1)[0]).title()
        rest     = [clean_token(t).title() for t in full.split(",", 1)[1].split() if clean_token(t)]
        first    = rest[0] if rest else ""
        middle   = " ".join(rest[1:]) if len(rest) > 1 else ""
        return first, middle, raw_last

    # Fallback: "FIRST [MIDDLE...] LAST"
    if len(tokens) == 1:
        return tokens[0].title(), "", ""
    if len(tokens) == 2:
        return tokens[0].title(), "", tokens[1].title()
    first  = tokens[0].title()
    last   = tokens[-1].title()
    middle = " ".join(t.title() for t in tokens[1:-1])
    return first, middle, last

def adviser_full_name(a):
    return safe(a.get("name")).strip().upper()