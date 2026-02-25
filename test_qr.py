import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_test():
    print("1. Logging in as Admin...")
    admin_payload = {"email": "superadmin@apptech.com", "password": "SuperAdmin123!"}
    r = requests.post(f"{BASE_URL}/api/auth/login", json=admin_payload)
    if r.status_code != 200:
        print("Admin login failed:", r.json())
        return
    admin_token = r.json().get("access_token")
    print("Admin logged in.")

    print("2. Fetching Global QR Token...")
    r = requests.get(f"{BASE_URL}/api/training/qr/global", headers={"Authorization": f"Bearer {admin_token}"})
    if r.status_code != 200:
        print("Failed to get QR token:", r.text)
        return
    qr_token = r.json().get("qr_token")
    print("QR Token:", qr_token)

    print("3. Registering Test Student...")
    student_payload = {
        "name": "Test Student",
        "email": f"student{int(time.time())}@apptech.com",
        "password": "Password123!",
        "phone": "9999999999",
        "role": "STUDENT"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=student_payload)
    if r.status_code not in [200, 201]:
        print("Student registration failed (might already exist):", r.text)

    print("4. Logging in as Student...")
    login_payload = {"email": student_payload["email"], "password": "Password123!"}
    r = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    if r.status_code != 200:
        print("Student login failed:", r.json())
        return
    student_token = r.json().get("access_token")
    print("Student logged in.")

    scan_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}
    scan_payload = {"qr_token": qr_token}

    print("\n--- Testing QR Scans ---")
    print("5. First Scan (Punch In)")
    r = requests.post(f"{BASE_URL}/api/auth/attendance/scan", json=scan_payload, headers=scan_headers)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    
    # Optional sleep to test duration > 0, though not necessary
    time.sleep(2)
    
    print("\n6. Second Scan (Punch Out)")
    r = requests.post(f"{BASE_URL}/api/auth/attendance/scan", json=scan_payload, headers=scan_headers)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))

    print("\n7. Third Scan (Done for day)")
    r = requests.post(f"{BASE_URL}/api/auth/attendance/scan", json=scan_payload, headers=scan_headers)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))

if __name__ == "__main__":
    run_test()
