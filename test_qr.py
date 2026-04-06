import urllib.request as r, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Login
token = json.loads(r.urlopen(r.Request(
    'https://lms-api-bkuw.onrender.com/api/auth/login',
    data=json.dumps({'email':'devanshd7124g@gmail.com','password':'Pld@7124'}).encode(),
    headers={'Content-Type':'application/json'}
), context=ctx).read().decode())['access_token']

print("Token OK")

# Hit the scan endpoint and capture FULL traceback
scan_req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/auth/attendance/scan',
    data=json.dumps({'qr_token': 'test'}).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token}
)
try:
    res = r.urlopen(scan_req, context=ctx)
    print("OK:", res.read().decode())
except Exception as e:
    code = getattr(e, 'code', None)
    print(f"HTTP {code}")
    if hasattr(e, 'read'):
        raw = e.read().decode()
        try:
            parsed = json.loads(raw)
            tb = parsed.get('traceback', '')
            error = parsed.get('error', parsed.get('detail', ''))
            print("ERROR:", error)
            print()
            if tb:
                # Show last 20 lines
                lines = [l for l in tb.strip().split('\n') if l.strip()]
                print("=== TRACEBACK (last 15 lines) ===")
                for line in lines[-15:]:
                    print(line)
        except:
            print("RAW:", raw[:2000])
