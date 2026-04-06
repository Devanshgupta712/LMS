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

# Get SystemSettings via admin API
req = r.Request(
    'https://lms-api-bkuw.onrender.com/api/admin/settings',
    headers={'Authorization': 'Bearer ' + token}
)
try:
    res = r.urlopen(req, context=ctx)
    print("Settings:", json.dumps(json.loads(res.read().decode()), indent=2))
except Exception as e:
    print("Error:", getattr(e, 'code', str(e)))
    if hasattr(e, 'read'):
        print(e.read().decode())
