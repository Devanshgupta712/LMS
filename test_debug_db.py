import urllib.request
import json
import ssl
import time

url = "https://lms-api-bkuw.onrender.com/api/debug-db"
req = urllib.request.Request(url)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print(f"Polling {url}...")
for i in range(15):
    try:
        response = urllib.request.urlopen(req, context=ctx)
        text = response.read().decode()
        if "postgresql" in text or "sqlite" in text or "error" in text:
            print(f"SUCCESS on attempt {i+1}:")
            print(text)
            break
        else:
            print(f"Attempt {i+1}: Output didn't match debug endpoint, deployment might not be live yet.")
    except urllib.error.HTTPError as e:
        print(f"HTTPError on attempt {i+1}: {e.code}")
    except Exception as e:
        print(f"Error on attempt {i+1}: {e}")
    time.sleep(10)
