import requests, json
from datetime import datetime, timedelta, timezone
import sys

# BASE_URL = 'https://lms-api-bkuw.onrender.com'
BASE_URL = 'http://localhost:8005'

print(f"Testing local server: {BASE_URL}")

# 1. Login as the user's Trainee account
login_resp = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': 'ankit@student.com',
    'password': 'welcome123'
})
print('Login response status:', login_resp.status_code)

if login_resp.status_code != 200:
    print("Error logging in:", login_resp.text)
    sys.exit(1)

login_data = login_resp.json()
token = login_data.get('access_token')

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
}

# 2. Fake QR Token (valid static structure)
# This is a base64 encoded JSON string representing:
import base64

exp = (datetime.utcnow() + timedelta(days=1)).isoformat()
qr_payload = {
    "b": "b0a5a229-ea21-4f11-92bc-97992d9d10e6",
    "d": datetime.utcnow().strftime("%Y-%m-%d"),
    "exp": exp
}
qr_token = base64.b64encode(json.dumps(qr_payload).encode()).decode()

payload = {'qr_token': qr_token}

print("\n--- Scan 1 (Punch In) ---")
resp1 = requests.post(f'{BASE_URL}/api/auth/attendance/scan', json=payload, headers=headers)
print('First scan status:', resp1.status_code)
print('First scan response:', resp1.text)

print("\n--- Scan 2 (Punch Out) ---")
resp2 = requests.post(f'{BASE_URL}/api/auth/attendance/scan', json=payload, headers=headers)
print('Second scan status:', resp2.status_code)
print('Second scan response:', resp2.text)
