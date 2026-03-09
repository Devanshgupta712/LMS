
import os
from datetime import datetime

log_path = r"c:\Users\devan\OneDrive\Desktop\lmsproject\backend\server.log"
if os.path.exists(log_path):
    with open(log_path, "rb") as f:
        content = f.read()
    for encoding in ["utf-16", "utf-8", "latin-1"]:
        try:
            text = content.decode(encoding)
            lines = text.splitlines()
            print(f"--- Last 100 lines (Decoded with {encoding}) ---")
            for line in lines[-100:]:
                print(line)
            break
        except Exception:
            continue
else:
    print("Log file not found")
