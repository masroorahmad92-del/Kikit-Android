from datetime import timedelta

from app.core.security import create_access_token
from app.database.session import get_db
from app.repositories.user import get_user_by_email

# in shell, run:
# from app.scripts.dev.create_access_token_long_lived import generate_long_lived_token
# generate_long_lived_token()

# OR

# python -m app.scripts.dev.create_access_token_long_lived


def generate_long_lived_token():
    email = input("Enter the user email to generate token for: ").strip()

    if not email:
        print("Email cannot be empty.")
        return
    db = next(get_db())
    user = get_user_by_email(db, email)
    if not user:
        print(f"No user found with email: {email}")
        return

    long_expiry = timedelta(days=100)

    # Create the token
    token_data = {"sub": str(user.id)}
    token = create_access_token(data=token_data, expires_delta=long_expiry)

    print("\n--- Long-Lived Access Token ---")
    print(token)
    print("-------------------------------\n")
    print(f"This token for {email} will expire in 100 days.")


if __name__ == "__main__":
    generate_long_lived_token()
