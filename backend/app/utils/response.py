from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.schemas.response import ResponseModel


def success_response(data=None, message="Success", status_code=200) -> JSONResponse:
    """Generate a standardized success response."""
    response_body = ResponseModel(status="success", message=message, data=data)
    return JSONResponse(
        status_code=status_code, content=jsonable_encoder(response_body)
    )


def error_response(message="Error", data=None, status_code=400) -> JSONResponse:
    """Generate a standardized error response."""
    response_body = ResponseModel(status="error", message=message, data=data)
    return JSONResponse(
        status_code=status_code, content=jsonable_encoder(response_body)
    )
