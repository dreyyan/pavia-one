import json
import sys
import csv

# Read CSV path from argument
input_path = sys.argv[1]

START_ROW = 7
SKIP_ROWS = {32, 59, 60}  # adjust if CSV has same "skip row numbers"

COL = {
    "lrn": 0, "name": 2, "sex": 6, "birth": 7, "age": 9,
    "mother_tongue": 11, "ip": 13, "religion": 14,
    "barangay": 17, "municipality": 20, "province": 22,
    "father": 27, "mother": 31, "modality": 43, "remarks": 44
}

students = []

with open(input_path, newline='', encoding='utf-8-sig') as csvfile:
    reader = list(csv.reader(csvfile))
    row = START_ROW - 1  # CSV list is 0-indexed

    while row < len(reader):
        if (row + 1) in SKIP_ROWS:  # +1 because Excel rows are 1-indexed
            row += 1
            continue

        data = reader[row]
        if len(data) <= COL["lrn"] or not data[COL["lrn"]].strip():
            break  # assume end of data

        students.append({
            "LRN": data[COL["lrn"]].strip(),
            "Name": data[COL["name"]].strip() if len(data) > COL["name"] else "",
            "Sex": data[COL["sex"]].strip() if len(data) > COL["sex"] else "",
            "Birth Date": data[COL["birth"]].strip() if len(data) > COL["birth"] else "",
            "Age": data[COL["age"]].strip() if len(data) > COL["age"] else "",
            "Mother Tongue": data[COL["mother_tongue"]].strip() if len(data) > COL["mother_tongue"] else "",
            "IP": data[COL["ip"]].strip() if len(data) > COL["ip"] else "",
            "Religion": data[COL["religion"]].strip() if len(data) > COL["religion"] else "",
            "Barangay": data[COL["barangay"]].strip() if len(data) > COL["barangay"] else "",
            "Municipality": data[COL["municipality"]].strip() if len(data) > COL["municipality"] else "",
            "Province": data[COL["province"]].strip() if len(data) > COL["province"] else "",
            "Father Name": data[COL["father"]].strip() if len(data) > COL["father"] else "",
            "Mother Maiden Name": data[COL["mother"]].strip() if len(data) > COL["mother"] else "",
            "Modality": data[COL["modality"]].strip() if len(data) > COL["modality"] else "",
            "Remarks": data[COL["remarks"]].strip() if len(data) > COL["remarks"] else "",
        })

        row += 1

# Output JSON
print(json.dumps(students, ensure_ascii=False, indent=2))