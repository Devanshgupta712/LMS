import requests, json
from datetime import datetime, timedelta
from jose import jwt

BASE_URL = 'https://lms-api-bkuw.onrender.com'
SECRET_KEY = "apptech-careers-lms-secret-key-2026"
ALGORITHM = "HS256"

print(f"Testing deployed server: {BASE_URL}")

login_resp = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': 's12@gmail.com',
    'password': 'welcome123'
})
print('Login response status:', login_resp.status_code)

if login_resp.status_code != 200:
    print("Error:", login_resp.text)
    raise SystemExit('Failed to login')

login_data = login_resp.json()
token = login_data.get('access_token')

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
}
payload = {'qr_token': 'eyJiIjogIjU2Nzc5YTY2LTc0Y2MtNGI4OS1hZzQxLTQzYjc4OTFhN2Y4NCIsICJkIjogIjIwMjYtMDItMjQiLCAiZXhwIjogIjIwMjYtMDItMjVUMDg6MTA6MDEuODE0Mjg3In0='}

print("\n--- Scan 1 ---")
resp1 = requests.post(f'{BASE_URL}/api/auth/attendance/scan', json=payload, headers=headers)
print('First scan status:', resp1.status_code)
print('First scan response:', resp1.text)
