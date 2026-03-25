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

def upload_base64_to_cloudinary(base64_string: str, folder: str = "lms/leaves"):
    """
    Uploads a base64 encoded image or PDF to Cloudinary.
    base64_string: data:image/png;base64,xxxx or data:application/pdf;base64,xxxx
    """
    try:
        if not base64_string:
            return None
        
        # Determine resource type (image or raw for PDF)
        resource_type = "auto"
        if "application/pdf" in base64_string:
            resource_type = "raw"
            
        result = cloudinary.uploader.upload(
            base64_string,
            folder=folder,
            resource_type=resource_type
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        return None
