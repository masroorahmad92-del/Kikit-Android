from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from fastapi.responses import JSONResponse
from starlette import status

from app.core.logger import logger
from app.schemas.response import ResponseModel


def register_exception_handlers(app: FastAPI):
    """Register all global exception handlers."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions and return standardized JSON response."""
        return JSONResponse(
            status_code=exc.status_code,
            content=ResponseModel(
                status="error", message=exc.detail, data=None
            ).model_dump(),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        """Handle request validation errors and return details."""
        errors = []
        for err in exc.errors():
            field = " → ".join(str(loc) for loc in err["loc"])
            message = err["msg"]
            errors.append({field: message})
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=ResponseModel(
                status="error", message="Validation failed", data=errors
            ).model_dump(),
        )

    @app.exception_handler(ResponseValidationError)
    async def response_validation_exception_handler(
        request: Request, exc: ResponseValidationError
    ):
        """Handle response validation errors."""
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ResponseModel(
                status="error",
                message="Internal server error (response serialization failed)",
                data=None,
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def all_exception_handler(request: Request, exc: Exception):
        """Handle all unexpected exceptions."""
        logger.error("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ResponseModel(
                status="error", message="Internal server error", data=None
            ).model_dump(),
        )
