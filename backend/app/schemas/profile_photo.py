from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class PhotoSchema(BaseModel):
    id: Optional[UUID] = None
    filename: str
    url: str
    public_id: str
    resource_type: Optional[str] = "image"
    is_primary: bool = False

    model_config = {"from_attributes": True}
