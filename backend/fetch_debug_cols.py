import requests, time, json

BASE_URL = 'https://lms-api-bkuw.onrender.com'
print('Waiting 60s for Render deploy...')
time.sleep(60)

r2 = requests.post(f'{BASE_URL}/api/auth/login', json={'email': 'superadmin@apptech.com', 'password': 'SuperAdmin123!'}, timeout=30)
if r2.status_code != 200:
    print(f"Login Failed: {r2.status_code} {r2.text}"); exit(1)

token = r2.json().get('access_token')
hdrs = {'Authorization': f'Bearer {token}'}

r = requests.get(f'{BASE_URL}/api/admin/debug-columns', headers=hdrs, timeout=30)
print(f"DEBUG_COLUMNS: {r.status_code}")
try:
    d = r.json()
    print(json.dumps(d, indent=2))
except:
    print(r.text)
