import sys
import os
import traceback

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), "backend"))

print("DEBUG: sys.path is", sys.path)

try:
    print("Step 1: Importing app.config...")
    from app.config import settings
    print("Success.")

    print("Step 2: Importing app.database...")
    from app.database import engine, Base
    print("Success.")

    print("Step 3: Importing all models via app.models...")
    import app.models
    print("Success.")

    print("Step 4: Importing routers one by one...")
    print("Importing auth...")
    from app.routers import auth
    print("Importing admin...")
    from app.routers import admin
    print("Importing marketing...")
    from app.routers import marketing
    print("Importing training...")
    from app.routers import training
    print("Importing placement...")
    from app.routers import placement
    print("Success.")

    print("Step 5: Importing main app...")
    from app.main import app
    print("Success.")

    print("\nALL MODULES LOADED SUCCESSFULLY.")
except Exception as e:
    print("\n!!! FATAL ERROR DURING INITIALIZATION !!!")
    traceback.print_exc()
    sys.exit(1)
except ImportError as e:
    print("\n!!! IMPORT ERROR DURING INITIALIZATION !!!")
    traceback.print_exc()
    sys.exit(1)
