import asyncio

from fastapi import HTTPException, UploadFile

from app.core.cloudinary_gateway import (
    delete_file_from_cloudinary,
    upload_file_to_cloudinary,
)


async def upload_media_service(
    *,
    file: UploadFile,
):
    if not file:
        raise HTTPException(status_code=400, detail="File is required")

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # Run synchronous Cloudinary upload in a thread to avoid blocking the event loop
    upload_result = await asyncio.to_thread(
        upload_file_to_cloudinary, file_bytes=file_bytes, resource_type="auto"
    )

    return {
        "filename": file.filename,
        "url": upload_result.get("secure_url"),
        "public_id": upload_result.get("public_id"),
        "resource_type": upload_result.get("resource_type"),
    }


async def delete_media_service(public_id: str):
    if not public_id:
        raise HTTPException(status_code=400, detail="Public ID is required")

    result = await asyncio.to_thread(delete_file_from_cloudinary, public_id)

    if result.get("result") != "ok":
        raise HTTPException(
            status_code=400,
            detail="Failed to delete media",
        )

    return result
