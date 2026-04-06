import urllib.request
import json
import ssl

url = "https://lms-api-bkuw.onrender.com/api/auth/login"
data = {"email": "devanshd7124g@gmail.com", "password": "Pld@7124"}
req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    response = urllib.request.urlopen(req, context=ctx)
    print(response.getcode())
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code}")
    print(e.read().decode())
except urllib.error.URLError as e:
    print(f"URLError: {e.reason}")
