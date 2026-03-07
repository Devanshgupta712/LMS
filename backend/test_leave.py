import requests

try:
    # First we need to login to get a token
    login_res = requests.post("http://localhost:8000/api/auth/login", json={
        "email": "devansh712", # try to just use a dummy or I don't know the user's password. Wait I will just send a mock request
    })
    
    # Actually, I can just make a post request directly and see if it fails auth or something else.
    # But it's better to just check the actual server logs if we can. 
    # Let me just see if the backend is even running on 8000.
    res = requests.get("http://localhost:8000/api/health")
    print("Health check:", res.json())

    # Send a request without auth, it should return 401 Unauthorized
    res2 = requests.post("http://localhost:8000/api/training/leave-request", json={
        "start_date": "2026-03-18",
        "end_date": "2026-04-15",
        "leave_type": "INTERVIEW",
        "reason": "",
        "proof_base64": "",
        "proof_name": ""
    })
    print("Leave Request response:", res2.status_code, res2.text)

except Exception as e:
    print("Error:", e)
