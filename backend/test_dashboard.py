import requests

BASE_URL = 'https://lms-api-bkuw.onrender.com'
print('Logging in...')
try:
    r2 = requests.post(f'{BASE_URL}/api/auth/login', json={'email': 'superadmin@apptech.com', 'password': 'SuperAdmin123!'}, timeout=30)
    if r2.status_code == 200:
        token = r2.json().get('access_token')
        hdrs = {'Authorization': f'Bearer {token}'}
        print('Fetching Dashboard...')
        r = requests.get(f'{BASE_URL}/api/admin/dashboard', headers=hdrs)
        print("DASHBOARD:", r.status_code)
        print(r.text)
        
        print('Fetching Students...')
        r = requests.get(f'{BASE_URL}/api/admin/students', headers=hdrs)
        print("STUDENTS:", r.status_code)
        print(r.text[:200])
    else:
        print("Login failed:", r2.status_code, r2.text)
except Exception as e:
    print(e)
