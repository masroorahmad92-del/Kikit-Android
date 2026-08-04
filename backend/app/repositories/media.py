from fastapi import UploadFile

from app.repositories.aws import upload_file_to_s3


def handle_media_upload(file: UploadFile, folder: str = "media"):
    """
    Handles uploading a file and returns structured response.
    """
    upload_result = upload_file_to_s3(file, folder)
    return {
        "filename": upload_result["file_name"],
        "object_key": upload_result["object_key"],
        "url": upload_result["file_url"],
    }
