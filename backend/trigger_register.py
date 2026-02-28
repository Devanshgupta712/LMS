import requests

url = "http://127.0.0.1:8000/api/auth/register"
payload = {
    "name": "Test Error",
    "email": "test.error1234@gmail.com",
    "password": "Password123!",
    "role": "STUDENT",
    "phone": "9998887776"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
