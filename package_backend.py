import os
import zipfile

def create_backend_zip():
    zip_name = 'LMS_BACKEND_FRESH.zip'
    backend_dir = 'backend'
    
    # Exclude patterns
    excludes = ['__pycache__', '.venv', 'venv', '.env', '.pytest_cache', '.db']
    
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(backend_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in excludes]
            
            for file in files:
                # Skip excluded files or file extensions
                if any(ext in file for ext in ['.db', '.sqlite3', '.env']) or file in excludes:
                    continue
                
                full_path = os.path.join(root, file)
                # Store relative to the backend folder so it extracts cleanly
                rel_path = os.path.relpath(full_path, backend_dir)
                zf.write(full_path, rel_path)
                
    print(f"Created {zip_name} successfully!")

if __name__ == '__main__':
    create_backend_zip()
