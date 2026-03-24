import psycopg2

# Try PostgreSQL
try:
    conn = psycopg2.connect(
        host='91.107.217.142',
        port=54256,
        user='Rabi',
        password='PCSGlobal@4321',
        connect_timeout=5,
        database='postgres'
    )
    cur = conn.cursor()
    cur.execute('SELECT version();')
    print('PostgreSQL version:', cur.fetchone()[0])
    cur.execute('SELECT datname FROM pg_database WHERE datistemplate = false;')
    print('Databases:', [r[0] for r in cur.fetchall()])
    conn.close()
except Exception as e:
    print('PostgreSQL failed:', e)

# Try MySQL
try:
    import pymysql
    conn = pymysql.connect(
        host='91.107.217.142',
        port=54256,
        user='Rabi',
        password='PCSGlobal@4321',
        connect_timeout=5
    )
    cur = conn.cursor()
    cur.execute('SELECT VERSION();')
    print('MySQL version:', cur.fetchone()[0])
    cur.execute('SHOW DATABASES;')
    print('Databases:', [r[0] for r in cur.fetchall()])
    conn.close()
except Exception as e:
    print('MySQL failed:', e)
