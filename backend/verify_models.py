import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

try:
    print("Checking models...")
    from app.models import user, course, registration, notification, project, lead, placement, attendance, setting
    print("Models imported successfully.")

    print("Checking schemas...")
    from app.schemas import schemas
    print("Schemas imported successfully.")

    print("Checking routers...")
    from app.routers import auth, admin, marketing, training, placement as placement_router
    print("Routers imported successfully.")

    print("Checking main app...")
    from app.main import app
    print("Main app imported successfully.")

    print("\nALL MODULES IMPORTED SUCCESSFULLY. NO SYNTAX OR IMPORT ERRORS FOUND.")
except Exception as e:
    import traceback
    print("\nERROR DURING IMPORT VERIFICATION:")
    traceback.print_exc()
    sys.exit(1)
