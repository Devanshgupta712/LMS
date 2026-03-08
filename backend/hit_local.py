import requests

BASE_URL = 'http://127.0.0.1:8000'
print('Logging in...')
try:
    r2 = requests.post(f'{BASE_URL}/api/auth/login', json={'email': 'superadmin@apptech.com', 'password': 'SuperAdmin123!'}, timeout=30)
    if r2.status_code == 200:
        token = r2.json().get('access_token')
        hdrs = {'Authorization': f'Bearer {token}'}
        print('Fetching Batches...')
        r = requests.get(f'{BASE_URL}/api/admin/batches', headers=hdrs)
        print("BATCHES:", r.status_code)
        
        print('Fetching Courses...')
        r = requests.get(f'{BASE_URL}/api/admin/courses', headers=hdrs)
        print("COURSES:", r.status_code)
    else:
        print("Login failed:", r2.status_code, r2.text)
except Exception as e:
    print(e)
