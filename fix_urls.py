import os
files = [
    'src/app/verify-email/page.tsx', 'src/app/training/violations/page.tsx',
    'src/app/training/attendance/page.tsx', 'src/app/student/profile/page.tsx',
    'src/app/register/page.tsx', 'src/app/login/page.tsx'
]
for fp in files:
    with open(fp, 'r', encoding='utf-8') as f: 
        content = f.read()
    content = content.replace("'https://api.appteknow.com", "(process.env.NEXT_PUBLIC_API_URL || 'https://api.appteknow.com') + '")
    with open(fp, 'w', encoding='utf-8') as f: 
        f.write(content)
    print(f"Fixed {fp}")
