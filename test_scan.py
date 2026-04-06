import urllib.request as r; import json, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 1. Login
login_req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/auth/login',
    data=json.dumps({'email':'devanshd7124g@gmail.com','password':'Pld@7124'}).encode(),
    headers={'Content-Type':'application/json'}
)
login_res = r.urlopen(login_req, context=ctx)
token = json.loads(login_res.read().decode())['access_token']
print("Logged in!")

# 2. Scan QR
scan_req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/auth/attendance/scan',
    data=json.dumps({'qr_token':'some_token', 'latitude':12.9716, 'longitude':77.5946}).encode(),
    headers={'Content-Type':'application/json', 'Authorization': 'Bearer ' + token}
)
try:
    scan_res = r.urlopen(scan_req, context=ctx)
    print("Success:", scan_res.read().decode())
except Exception as e:
    print("Error:", getattr(e, 'code', str(e)))
    if hasattr(e, 'read'):
        print(json.dumps(json.loads(e.read().decode()), indent=2))
