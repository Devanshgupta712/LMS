import requests, time, json

BASE_URL = 'https://lms-api-bkuw.onrender.com'
print('Waiting 25s...')
time.sleep(25)

r2 = requests.post(f'{BASE_URL}/api/auth/login', json={'email': 'superadmin@apptech.com', 'password': 'SuperAdmin123!'}, timeout=30)
token = r2.json().get('access_token')
hdrs = {'Authorization': f'Bearer {token}'}

r = requests.get(f'{BASE_URL}/api/admin/leaves', headers=hdrs, timeout=30)
print(f"LEAVES: {r.status_code}")
with open('leaves_err.txt', 'w') as f:
    f.write(r.text)
try:
    d = r.json()
    print(json.dumps(d, indent=2, default=str)[:2000])
except:
    print(r.text[:2000])
