import urllib.request as r, json, ssl, traceback

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Login
login_req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/auth/login',
    data=json.dumps({'email':'devanshd7124g@gmail.com','password':'Pld@7124'}).encode(),
    headers={'Content-Type':'application/json'}
)
token = json.loads(r.urlopen(login_req, context=ctx).read().decode())['access_token']
print("Logged in, token:", token[:30]+"...")

# Get the current QR token from backend (check SystemSetting)
debug_req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/debug-db',
    headers={'Content-Type':'application/json', 'Authorization': 'Bearer ' + token}
)
debug_res = r.urlopen(debug_req, context=ctx)
print("DB debug:", debug_res.read().decode())
print("---")

# Test scan with coords that pass (simulate being inside office)
scan_req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/auth/attendance/scan',
    data=json.dumps({'qr_token':'test_token', 'latitude': 0.0, 'longitude': 0.0}).encode(),
    headers={'Content-Type':'application/json', 'Authorization': 'Bearer ' + token}
)
try:
    scan_res = r.urlopen(scan_req, context=ctx)
    body = scan_res.read().decode()
    print("SUCCESS:", body)
except Exception as e:
    print("Error code:", getattr(e, 'code', type(e).__name__))
    if hasattr(e, 'read'):
        raw = e.read().decode()
        try:
            parsed = json.loads(raw)
            print("Error detail:", parsed.get('error') or parsed.get('detail'))
            tb = parsed.get('traceback', '')
            if tb:
                # Print last 10 lines of traceback
                lines = tb.strip().split('\n')
                print("Last traceback lines:")
                for l in lines[-10:]:
                    print(l)
        except:
            print("Raw error:", raw[:1000])
