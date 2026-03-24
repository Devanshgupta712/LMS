import os
import re

directory = 'src'
api_base = "https://api.appteknow.com"

count = 0
for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.tsx') or filename.endswith('.ts'):
            # Skip api.ts itself
            if filename == 'api.ts':
                continue
                
            filepath = os.path.join(root, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Replace fetch('/api/... with fetch('https://api.appteknow.com/api/...
            new_content = re.sub(r"fetch\(['\"]/api/", f"fetch('{api_base}/api/", content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f"Updated: {filepath}")

print(f"Total files updated: {count}")
