import secrets

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi_pagination import add_pagination
from sqladmin import Admin
from starlette.middleware.sessions import SessionMiddleware

from app.admin.auth import AdminAuth
from app.admin.gift_admin import GiftAdmin
from app.admin.user_report import UserReportAdmin
from app.api import *
from app.core import init_firebase, settings
from app.database.session import engine

app = FastAPI(
    title="KiKit",
    debug=settings.DEBUG,
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
)

_basic = HTTPBasic()


def _verify_docs_credentials(credentials: HTTPBasicCredentials = Depends(_basic)):
    valid_username = secrets.compare_digest(
        credentials.username, settings.DOCS_USERNAME
    )
    valid_password = secrets.compare_digest(
        credentials.password, settings.DOCS_PASSWORD
    )
    if not (valid_username and valid_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )


@app.get("/docs", include_in_schema=False)
def custom_swagger(credentials: HTTPBasicCredentials = Depends(_basic)):
    _verify_docs_credentials(credentials)
    return get_swagger_ui_html(openapi_url="/openapi.json", title="KiKit docs")


@app.get("/redoc", include_in_schema=False)
def custom_redoc(credentials: HTTPBasicCredentials = Depends(_basic)):
    _verify_docs_credentials(credentials)
    return get_redoc_html(openapi_url="/openapi.json", title="KiKit redoc")


# Basic health check endpoint
@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok"}


# ⚡ Add pagination support
add_pagination(app)

# ⚡ Add session middleware for admin authentication
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET)

# ⚡ Set up admin authentication backend
authentication_backend = AdminAuth(secret_key=settings.SECRET)

# ⚡ Set up SQLAdmin interface
admin = Admin(
    app, engine, authentication_backend=authentication_backend, title="KiKit Admin"
)

# ⚡ Register admin views
admin.add_view(GiftAdmin)
admin.add_view(UserReportAdmin)

# ⚡ Include all API routers
include_routers(app)

# ⚡ Register global exception handlers
register_exception_handlers(app)

# ⚡ Initialize Firebase Admin SDK
init_firebase()
