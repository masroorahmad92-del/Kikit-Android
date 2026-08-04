import cloudinary.uploader


def upload_file_to_cloudinary(
    *,
    file_bytes: bytes,
    resource_type: str = "auto",
):
    return cloudinary.uploader.upload(
        file_bytes,
        resource_type=resource_type,
    )


def delete_file_from_cloudinary(public_id: str):
    return cloudinary.uploader.destroy(public_id)
