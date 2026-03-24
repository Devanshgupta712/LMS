import zipfile
import os
import shutil

# 1. Prepare a temporary production folder
prod_dir = 'LMS_FINAL_PROD'
if os.path.exists(prod_dir):
    shutil.rmtree(prod_dir)
os.makedirs(prod_dir)

# 2. Copy Standalone files
standalone_dir = os.path.join('.next', 'standalone')
for item in os.listdir(standalone_dir):
    s = os.path.join(standalone_dir, item)
    d = os.path.join(prod_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d, dirs_exist_ok=True)
    else:
        shutil.copy2(s, d)

# 3. Create the .next/static folder and the _next/static folder (PHYSICAL COPIES)
static_src = os.path.join('.next', 'static')
dot_next_static = os.path.join(prod_dir, '.next', 'static')
underscore_next_static = os.path.join(prod_dir, '_next', 'static')

shutil.copytree(static_src, dot_next_static, dirs_exist_ok=True)
shutil.copytree(static_src, underscore_next_static, dirs_exist_ok=True)

# 4. Copy Public folder
public_src = 'public'
public_dst = os.path.join(prod_dir, 'public')
if os.path.exists(public_src):
    shutil.copytree(public_src, public_dst, dirs_exist_ok=True)

# 5. Zip it up
zip_name = 'LMS_FINAL_DEPLOY.zip'
with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(prod_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, prod_dir)
            zf.write(full_path, rel_path)

print(f"COMPLETE: {zip_name} created with 200 OK path insurance.")
