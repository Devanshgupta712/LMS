import urllib.request as r;
import json;
data = json.loads(r.urlopen('https://lms-api-bkuw.onrender.com/api/debug-db').read().decode());
print(data["type"])
for c in sorted(data["columns"]):
    print(c)
