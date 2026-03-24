import zipfile
import sys

with zipfile.ZipFile('frontend_build_new.zip', 'r') as z:
    files = z.namelist()
    for f in files[:50]:
        print(f)
    print(f"... and {len(files) - 50} more")
    
    # Check for next specific file
    target = 'node_modules/next/dist/server/next.js'
    if target in files:
        print(f"\nFOUND: {target}")
    else:
        print(f"\nNOT FOUND: {target}")
