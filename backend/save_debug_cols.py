import requests, time, json

BASE_URL = 'https://lms-api-bkuw.onrender.com'
r2 = requests.post(f'{BASE_URL}/api/auth/login', json={'email': 'superadmin@apptech.com', 'password': 'SuperAdmin123!'}, timeout=30)
token = r2.json().get('access_token')
hdrs = {'Authorization': f'Bearer {token}'}

r = requests.get(f'{BASE_URL}/api/admin/debug-columns', headers=hdrs, timeout=30)
if r.status_code == 200:
    with open('full_debug_cols.json', 'w') as f:
        json.dump(r.json(), f, indent=2)
else:
    print(f"Error: {r.status_code} {r.text}")
