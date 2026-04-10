import cloudinary
import cloudinary.uploader
import cloudinary.api
from fastapi import UploadFile, HTTPException
from typing import List, Optional
from app.core.config import settings

# Configure Cloudinary once at import time
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
FOLDER = "popote_estate"


async def upload_image(
    file: UploadFile,
    folder: str = FOLDER,
    public_id: Optional[str] = None,
) -> dict:
    """
    Upload a single image to Cloudinary.
    Returns dict with url, secure_url, public_id, width, height.
    """
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use JPEG, PNG or WebP.",
        )

    # Read and check size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit.")

    try:
        upload_params = {
            "folder": folder,
            "resource_type": "image",
            "transformation": [
                # Auto-quality, auto-format, max width 1600px
                {"quality": "auto:good", "fetch_format": "auto", "width": 1600, "crop": "limit"},
            ],
        }
        if public_id:
            upload_params["public_id"] = public_id

        result = cloudinary.uploader.upload(contents, **upload_params)

        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "size": result.get("bytes"),
        }
    except cloudinary.exceptions.Error as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")


async def upload_multiple_images(
    files: List[UploadFile],
    folder: str = FOLDER,
) -> List[dict]:
    """Upload multiple images and return list of result dicts."""
    if len(files) > 15:
        raise HTTPException(status_code=400, detail="Maximum 15 images per listing.")
    results = []
    for file in files:
        result = await upload_image(file, folder=folder)
        results.append(result)
    return results


def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by public_id."""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except cloudinary.exceptions.Error:
        return False


def delete_multiple_images(public_ids: List[str]) -> None:
    """Bulk delete images from Cloudinary."""
    if not public_ids:
        return
    try:
        cloudinary.api.delete_resources(public_ids)
    except cloudinary.exceptions.Error:
        pass  # Best-effort deletion


def get_optimized_url(public_id: str, width: int = 800, quality: str = "auto") -> str:
    """Generate an optimized URL for a given public_id."""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        quality=quality,
        fetch_format="auto",
        crop="fill",
        secure=True,
    )
