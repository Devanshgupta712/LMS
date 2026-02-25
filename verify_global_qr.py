import requests
import sys

BASE_URL = 'https://lms-api-bkuw.onrender.com'

print(f"Testing global QR on deployed server: {BASE_URL}")

# 1. Login as an Admin/Trainer to access the QR endpoints
login_resp = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': 's12@gmail.com',
    'password': '123456'
})

if login_resp.status_code != 200:
    print("Error logging in:", login_resp.text)
    sys.exit(1)

token = login_resp.json().get('access_token')
headers = {
    'Authorization': f'Bearer {token}'
}

# 2. Fetch the Global QR
print("\n--- Fetching Global QR ---")
fetch_resp = requests.get(f'{BASE_URL}/api/training/qr/global', headers=headers)
print('Status:', fetch_resp.status_code)
print('Response:', fetch_resp.text)

if fetch_resp.status_code == 200:
    original_qr = fetch_resp.json().get('qr_token')

    # 3. Rotate the Global QR
    print("\n--- Rotating Global QR ---")
    rotate_resp = requests.post(f'{BASE_URL}/api/training/qr/global/rotate', headers=headers)
    print('Status:', rotate_resp.status_code)
    print('Response:', rotate_resp.text)
    
    new_qr = rotate_resp.json().get('qr_token')
    if original_qr != new_qr:
        print("\n✅ SUCCESS: The QR code successfully rotated!")
    else:
        print("\n❌ ERROR: The QR code did not change!")
