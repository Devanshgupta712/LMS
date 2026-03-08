import requests
import uuid

BASE_URL = 'http://localhost:8001'
email = f'tester_{uuid.uuid4().hex[:6]}@example.com'
password = 'TestPassword123!'

print(f"Registering fresh user: {email}")

reg_resp = requests.post(f'{BASE_URL}/api/auth/register', json={
    'name': 'API Tester',
    'email': email,
    'password': password,
    'phone': '9999999999',
    'role': 'STUDENT'
})

if reg_resp.status_code not in (200, 201):
    print("Registration failed:", reg_resp.text)
    exit(1)

print("Logging in...")
resp = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': email,
    'password': password
})

if resp.status_code != 200:
    print(f"Login Failed: {resp.text}")
    exit(1)

token = resp.json().get('access_token')
student_id = resp.json().get('user', {}).get('id')
headers = {'Authorization': f'Bearer {token}'}

print(f"\nFetching batches...")
res2 = requests.get(f'{BASE_URL}/api/admin/batches', headers=headers)
print(f"Batches Status: {res2.status_code}")
print(f"Batches Response: {res2.text}")
