import zipfile
import os
import shutil

def zip_folder(zip_name, folders_to_zip, files_to_zip):
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
        # 1. Add files from standalone root
        for f in files_to_zip:
            if os.path.exists(f):
                zf.write(f, os.path.basename(f))
                print(f"Added file: {f}")

        # 2. Add folders recursively
        for folder, arc_prefix in folders_to_zip:
            if os.path.exists(folder):
                for root, dirs, files in os.walk(folder):
                    for file in files:
                        full_path = os.path.join(root, file)
                        # Construct archive path: arc_prefix + relative_path_from_folder
                        rel_path = os.path.relpath(full_path, folder)
                        arc_path = os.path.join(arc_prefix, rel_path)
                        zf.write(full_path, arc_path)
                print(f"Added folder: {folder} as {arc_prefix}")

# Prepare folders to package
# We take the content of standalone and merge the static assets into it
folders = [
    (r'.next\standalone\node_modules', 'node_modules'),
    (r'.next\standalone\.next', '.next'),
    (r'.next\static', os.path.join('.next', 'static')),
    (r'public', 'public')
]
files = [
    r'.next\standalone\server.js',
    r'.next\standalone\package.json'
]

zip_name = 'LMS_COMPLETE_BUILD.zip'
zip_folder(zip_name, folders, files)
print(f"\nSUCCESS: {zip_name} created.")
