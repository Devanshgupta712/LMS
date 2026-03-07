import io
try:
    with io.open('.env', 'r', encoding='utf-16le') as f:
        for line in f:
            if 'DATABASE_URL' in line:
                print(line.strip())
except Exception as e:
    print(e)
