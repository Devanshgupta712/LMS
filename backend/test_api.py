import requests

print("Registering local test user...")
base_url = "http://localhost:8001/api/auth"
training_url = "http://localhost:8001/api/training"

email = "leavetestuser@example.com"
password = "TestPassword123!"

try:
    # 1. Register User
    reg_response = requests.post(f"{base_url}/register", json={
        "name": "Leave Tester",
        "email": email,
        "password": password,
        "phone": "9999999999",
        "role": "STUDENT"
    })
    
    # Ignore 400 if user already exists
    if reg_response.status_code not in (200, 201, 400):
        print(f"Failed to register: {reg_response.text}")
    
    # 2. Login User
    login_response = requests.post(f"{base_url}/login", json={
        "email": email,
        "password": password
    })
    
    if int(login_response.status_code) >= 400:
        print(f"Failed to login: {login_response.text}")
        exit(1)
        
    data = login_response.json()
    token = data.get("access_token")
    user_id = data.get("user", {}).get("id")
    
    if not token or not user_id:
        print("Could not retrieve token or user_id from login response.")
        exit(1)
        
    print(f"Logged in successfully. User ID: {user_id}")
    
    # 3. Submit Leave
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "leave_type": "MEDICAL",
        "start_date": "2026-05-18",
        "end_date": "2026-05-20",
        "reason": "Test backend fix",
        "user_id": user_id
    }
    
    print("Testing POST /leave-request ...")
    leave_response = requests.post(f"{training_url}/leave-request", json=payload, headers=headers)
    print("Status Code:", leave_response.status_code)
    print("Response JSON:", leave_response.text)

except Exception as e:
    print("Test script failed:", e)
