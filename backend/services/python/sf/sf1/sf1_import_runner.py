# [IMPORT] Libraries
import json
import sys
import io
import os
import csv
from datetime import datetime

# [IMPORT] Utilities
from sf.sf1.adapters.sf1_import_adapter import parse_csv, parse_xlsx

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# [MAIN] Entry Point
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("[ERROR] Usage: xlsx_importer.py <file_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    if not os.path.exists(input_path):
        print(f"[ERROR] File not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    ext = os.path.splitext(input_path)[1].lower()

    try:
        if ext == ".csv":
            students = parse_csv(input_path)
        elif ext in (".xlsx", ".xlsm"):
            students = parse_xlsx(input_path)
        else:
            print(f"[ERROR] Unsupported file type: {ext}", file=sys.stderr)
            sys.exit(1)

        print(json.dumps(students, ensure_ascii=False, indent=2))

    except Exception as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)