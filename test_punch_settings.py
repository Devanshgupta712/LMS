import urllib.request as r, json, ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Login as admin (need admin token to get punch settings)
# Try with a superadmin account first
for creds in [
    ('devanshd7124g@gmail.com', 'Pld@7124'),
]:
    try:
        login_req = r.Request(
            'https://lms-api-bkuw.onrender.com/api/auth/login',
            data=json.dumps({'email':creds[0],'password':creds[1]}).encode(),
            headers={'Content-Type':'application/json'}
        )
        resp = json.loads(r.urlopen(login_req, context=ctx).read().decode())
        token = resp['access_token']
        role = resp['user']['role']
        print(f"Logged in as {creds[0]}, role={role}")
        break
    except Exception as e:
        print(f"Login failed for {creds[0]}: {e}")

# Get punch settings
req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/training/punch-settings',
    headers={'Authorization': 'Bearer ' + token}
)
try:
    res = r.urlopen(req, context=ctx)
    print("Punch settings:", json.dumps(json.loads(res.read().decode()), indent=2))
except Exception as e:
    print("Error:", getattr(e, 'code', str(e)))
    if hasattr(e, 'read'):
        print(e.read().decode())
