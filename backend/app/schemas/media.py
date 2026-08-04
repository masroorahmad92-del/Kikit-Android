from pydantic import BaseModel


class MediaUploadResponse(BaseModel):
    filename: str
    object_key: str
    url: str
