import requests
import json

base_url = 'https://lms-api.onrender.com/api'

# 1. Login to get token
res = requests.post(f"{base_url}/auth/login", json={
    "email": "devanshd7124g@gmail.com",
    "password": "demopassword"
})
if res.status_code != 200:
    res = requests.post(f"{base_url}/auth/login", json={
        "email": "admin@apptech.com", 
        "password": "admin"
    })

if res.status_code == 200:
    token = res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Submit leave request
    leave_res = requests.post(f"{base_url}/training/leave-request", json={
        "start_date": "2026-05-18",
        "end_date": "2026-07-18",
        "leave_type": "INTERVIEW",
        "reason": "Test"
    }, headers=headers)
    print("STATUS:", leave_res.status_code)
    print("BODY:", leave_res.text)
else:
    print("Could not login to prod API:", res.status_code, res.text)
