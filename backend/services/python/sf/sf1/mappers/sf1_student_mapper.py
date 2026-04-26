# [IMPORT] Parsers
from sf.utils.name_parser import parse_name, parse_guardian_name
from sf.utils.normalization import normalize_lrn, normalize_sex, normalize_date, normalize_modality

# [MAPPER] Build normalized Student object from raw SF1 row data
def build_student(
    lrn, name_combined, sex_raw, birth_raw, age_raw,
    mother_tongue, ip, religion,
    barangay, municipality, province,
    father_raw, mother_raw,
    modality_raw, remarks
) -> dict:
    last, first, middle = parse_name(name_combined)

    # Build guardian sub-objects with correctly split name fields
    f_first, f_middle, f_last = parse_guardian_name(father_raw)
    m_first, m_middle, m_last = parse_guardian_name(mother_raw)

    return {
        "lrn":              normalize_lrn(lrn),
        "firstName":        first,
        "middleName":       middle or None,
        "lastName":         last,
        "sex":              normalize_sex(sex_raw),
        "birthDate":        normalize_date(birth_raw),
        "motherTongue":     mother_tongue.strip() or None,
        "ethnicGroup":      ip.strip() or None,
        "religion":         religion.strip() or None,

        # Address
        "barangay":         barangay.strip() or None,
        "municipality":     municipality.strip() or None,
        "province":         province.strip() or None,
        
        # Guardian (pre-split into individual name fields)
        "fatherFirstName":        f_first  or None,
        "fatherMiddleName":       f_middle or None,
        "fatherLastName":         f_last   or None,
        "motherMaidenFirstName":  m_first  or None,
        "motherMaidenMiddleName": m_middle or None,
        "motherMaidenLastName":   m_last   or None,

        # Enrollment
        "learningModality": normalize_modality(modality_raw),
        "remarks":          remarks.strip() or None,
    }