import requests

print("Registering local ADMIN user...")
base_url = "http://localhost:8001/api/auth"
admin_url = "http://localhost:8001/api/admin"

email = "admintester@example.com"
password = "TestPassword123!"

try:
    # 1. Register Admin
    reg_response = requests.post(f"{base_url}/register", json={
        "name": "Admin Tester",
        "email": email,
        "password": password,
        "phone": "8888888888",
        "role": "ADMIN"
    })
    
    # Ignore 400 if user already exists
    if reg_response.status_code not in (200, 201, 400):
        print(f"Failed to register Admin: {reg_response.text}")
    
    # 2. Login Admin
    login_response = requests.post(f"{base_url}/login", json={
        "email": email,
        "password": password
    })
    
    if int(login_response.status_code) >= 400:
        print(f"Failed to login: {login_response.text}")
        exit(1)
        
    data = login_response.json()
    token = data.get("access_token")
    admin_id = data.get("user", {}).get("id")
    
    # 3. Create a Dummy Student
    student_email = "studenttester@example.com"
    requests.post(f"{base_url}/register", json={
        "name": "Student Tester",
        "email": student_email,
        "password": "TestPassword123!",
        "phone": "7777777777",
        "role": "STUDENT"
    })
    s_login = requests.post(f"{base_url}/login", json={
        "email": student_email,
        "password": "TestPassword123!"
    }).json()
    student_id = s_login.get("user", {}).get("id")
    
    print(f"Logged in Admin. Student ID to test: {student_id}")
    
    # 4. Hit the Failing Endpoint
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("Testing GET /users/{user_id}/details ...")
    test_response = requests.get(f"{admin_url}/users/{student_id}/details", headers=headers)
    print("Status Code:", test_response.status_code)
    print("Response JSON:", test_response.text)

except Exception as e:
    print("Test script failed:", e)
