import requests

base_url = 'http://localhost:8001/api'

res = requests.post(f"{base_url}/auth/login", json={
    "email": "devanshd7124g@gmail.com",
    "password": "demopassword"
})

print("LOGIN STATUS:", res.status_code)
print("LOGIN BODY:", res.text[:300])

if res.status_code == 200:
    token = res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    leave_res = requests.post(f"{base_url}/training/leave-request", json={
        "start_date": "2026-05-18",
        "end_date": "2026-07-18",
        "leave_type": "INTERVIEW",
        "reason": "Test"
    }, headers=headers)
    print("LEAVE STATUS:", leave_res.status_code)
    print("LEAVE BODY:", leave_res.text)
