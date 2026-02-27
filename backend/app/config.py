import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./apptech_lms.db"
    JWT_SECRET: str = "apptech-careers-lms-secret-key-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    CORS_ORIGINS: list[str] = ["*"]
    
    # Cloudinary Config (Optional for local dev, required for production files)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # SMTP Email Config (for OTP verification)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "devanshdd124g@gmail.com"  # e.g. your-email@gmail.com
    SMTP_PASSWORD: str = "dhnr kttn xjsd dgrc"  # Gmail App Password
    SMTP_SENDER: str = "AppTechno Software <devanshdd124g@gmail.com>"

    class Config:
        # Get the absolute path to the root .env file
        # __file__ is backend/app/config.py
        # dirname(__file__) is backend/app
        # dirname(dirname(__file__)) is backend
        # dirname(dirname(dirname(__file__))) is root
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")

settings = Settings()
