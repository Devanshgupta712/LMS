import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(__file__))

from app.utils.email import send_verification_email
from app.config import settings

def test():
    print(f"Testing with User: {settings.SMTP_USER}")
    print(f"Testing with Pass: {settings.SMTP_PASSWORD}")
    # Try sending an email to the same address
    success = send_verification_email(settings.SMTP_USER, "123456")
    if success:
        print("Test email sent SUCCESSFULLY!")
    else:
        print("Test email FAILED!")

if __name__ == "__main__":
    test()
