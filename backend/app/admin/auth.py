from fastapi import Request
from sqladmin.authentication import AuthenticationBackend
from sqlalchemy.orm import Session

from app.core.logger import logger
from app.core.security import verify_password
from app.database.session import SessionLocal
from app.models.user import User


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = form.get("username")  # Note: 'username' field contains email
        password = form.get("password")

        if not email or not password or not isinstance(password, str):
            return False

        db: Session = SessionLocal()
        try:
            # Find user by email
            user = db.query(User).filter(User.email == email).first()

            # Verify user exists, password is correct, and user is active
            if user and verify_password(password, user.password) and user.is_active:
                if not user.is_admin:
                    return False

                # Store user info in session
                request.session.update(
                    {
                        "admin_authenticated": True,
                        "user_id": str(user.id),
                        "username": user.email,
                    }
                )
                return True

            return False

        except Exception as e:
            logger.error(f"Login error: {e}")
            return False
        finally:
            db.close()

    async def logout(self, request: Request) -> bool:
        # Clear the session
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        # Check if user is authenticated via session
        authenticated = request.session.get("admin_authenticated", False)

        if authenticated:
            user_id = request.session.get("user_id")
            if user_id:
                db: Session = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if not user or not user.is_active:
                        request.session.clear()
                        return False
                finally:
                    db.close()

        return authenticated
