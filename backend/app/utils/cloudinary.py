import cloudinary
import cloudinary.uploader
import base64
import io
import os
from app.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_to_cloudinary(file_data, folder: str = "lms/leaves"):
    """
    Uploads a file (base64 string or file-like object) to Cloudinary.
    """
    try:
        if not file_data:
            return None
        
        resource_type = "auto"
        # If it's a string, it might be base64. Check for PDF to set resource_type='raw'
        if isinstance(file_data, str) and "application/pdf" in file_data:
            resource_type = "raw"
            
        result = cloudinary.uploader.upload(
            file_data,
            folder=folder,
            resource_type=resource_type
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        return None

def upload_base64_to_cloudinary(base64_string: str, folder: str = "lms/leaves"):
    return upload_to_cloudinary(base64_string, folder)
