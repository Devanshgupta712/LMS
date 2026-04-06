import subprocess

result = subprocess.run(
    ['git', 'diff', '0fd02b8', 'HEAD', '--', 
     'backend/app/models/user.py',
     'backend/app/routers/auth.py',
     'backend/app/main.py'],
    capture_output=True, text=True, cwd=r'c:\Users\devan\OneDrive\Desktop\lmsproject'
)

with open('diff_output.txt', 'w', encoding='utf-8') as f:
    f.write(result.stdout)

print("Written to diff_output.txt, size:", len(result.stdout))
