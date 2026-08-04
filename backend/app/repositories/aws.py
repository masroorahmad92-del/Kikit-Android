import uuid

import boto3
from botocore.exceptions import ClientError

from app.core import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)


def upload_file_to_s3(file_obj, folder: str = "uploads") -> dict:
    """
    Upload a file to S3 and return object key, file name, and URL.
    """
    file_extension = file_obj.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_extension}"
    object_key = f"{folder}/{file_name}"

    try:
        s3_client.upload_fileobj(
            file_obj.file,
            settings.AWS_S3_BUCKET_NAME,
            object_key,
            ExtraArgs={"ACL": "public-read"},
        )
    except ClientError as e:
        raise RuntimeError(f"S3 upload failed: {e}")

    file_url = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{object_key}"

    return {
        "object_key": object_key,
        "file_name": file_name,
        "file_url": file_url,
    }
