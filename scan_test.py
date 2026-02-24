import requests, json

url = 'http://127.0.0.1:8001/api/auth/attendance/scan'
payload = {"qr_token": "eyJiIjogIjU2Nzc5YTY2LTc0Y2MtNGI4OS1hYzQxLTQzYjc4OTFhN2Y4NCIsICJkIjogIjIwMjYtMDItMjQiLCAiZXhwIjogIjIwMjYtMDItMjVUMDg6MTA6MDEuODE0Mjg3In0="}
headers = {"Content-Type": "application/json"}

def send():
    r = requests.post(url, json=payload, headers=headers)
    print('Status:', r.status_code)
    try:
        print('Response:', r.json())
    except Exception:
        print('Text:', r.text)

print('First scan (login):')
send()
print('\nSecond scan (logout):')
send()
