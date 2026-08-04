from fastapi import APIRouter, Depends, File, UploadFile

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.media_service import delete_media_service, upload_media_service

router = APIRouter(prefix="/media", tags=["Media"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Upload a media file."""
    return await upload_media_service(file=file)


@router.delete("/delete/{public_id}")
async def delete_file(
    public_id: str, current_user: User = Depends(get_current_user)
) -> dict:
    """Delete a media file by its public ID."""
    return await delete_media_service(public_id=public_id)
