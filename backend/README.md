# KiKit Backend

REST API backend for KiKit — a social matching app with location-based matching, gifting, real-time chat, and in-app purchases.

## Tech Stack

- **Framework:** FastAPI + Uvicorn
- **Database:** PostgreSQL with PostGIS (spatial queries)
- **ORM / Migrations:** SQLAlchemy 2.0 + Alembic
- **Auth:** JWT (PyJWT), OTP via SendGrid, Google & Apple SSO
- **Chat:** Stream Chat
- **Push Notifications:** Firebase (FCM)
- **Storage:** Cloudinary (images), AWS S3
- **In-App Purchases:** RevenueCat webhooks
- **Face Verification:** InsightFace + ONNX Runtime
- **Async Tasks:** Celery + Redis
- **Admin Panel:** SQLAdmin
- **Error Tracking:** Sentry

## Project Structure

```
app/
├── api/v1/         # Route handlers (thin controllers)
├── services/       # Business logic
├── repositories/   # Data access layer (all DB queries)
├── models/         # SQLAlchemy ORM models
├── schemas/        # Pydantic request/response schemas
├── core/           # Config, enums, security, Firebase init
├── database/       # Session and base model
├── admin/          # SQLAdmin views and auth
├── middlewares/    # Request/response middleware
├── tasks/          # Celery async tasks
└── utils/          # Helpers (distance, photos, face verification)
alembic/            # Database migrations
```

## API Endpoints

All routes are prefixed with `/api/v1`.

| Tag | Prefix | Key Endpoints |
|---|---|---|
| Users | `/users` | `POST /signup`, `POST /login`, `DELETE /me`, `PATCH /me/balance` |
| Auth | `/auth` | `POST /refresh`, `POST /google`, `POST /apple` |
| OTP | `/otp` | `POST /verify`, `POST /resend` |
| Profiles | `/profiles` | `PATCH /`, `GET /me`, `GET /{id}`, `GET /user/{user_id}`, `POST /verify` |
| Matches | `/matches` | `GET /` |
| Profile Likes | `/profile-likes` | `POST /{id}/like`, `GET /mine`, `GET /who-liked-me` |
| Profile Skip | `/profile-skip` | `POST /{id}` |
| Preferences | `/preferences` | `GET /me`, `PUT /me`, `DELETE /me` |
| Gifts | `/gifts` | `GET /`, `POST /send`, `GET /history/received`, `GET /history/sent` |
| Chat | `/chat` | `POST /create/{other_user_id}` |
| Notifications | `/notifications` | `GET /`, `GET /unread-count`, `POST /{id}/read` |
| Media | `/media` | `POST /upload`, `DELETE /delete/{public_id}` |
| Phone Verification | `/phone-verification` | `POST /send`, `POST /verify` |
| RevenueCat | `/revenuecat` | `POST /webhook` |
| User Reports | `/report` | `POST /`, `GET /reasons` |
| Announcements | `/announcements` | `GET /` |
| Hobbies | `/hobbies` | `GET /` |
| Interests | `/interests` | `GET /` |

Admin panel is available at `/admin`.

## Setup

### Prerequisites

- Python 3.12+
- PostgreSQL with PostGIS extension enabled
- Redis

### Install dependencies

```bash
pip install -r requirements.txt
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kikit

# Security
SECRET=your-jwt-secret
ALGORITHM=HS256

# SendGrid (email / OTP)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# Stream Chat
STREAM_API_KEY=
STREAM_API_SECRET=

# Firebase (push notifications)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_REGION=

# RevenueCat
REVENUECAT_WEBHOOK_SECRET=
COIN_PACKS_JSON={"product_id": {"amount": 1000}}

# Celery / Redis
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Google OAuth
GOOGLE_CLIENT_ID=

# Admin
ADMIN_SECRET_KEY=
```

### Run migrations

```bash
alembic upgrade head
```

### Start the server

```bash
uvicorn app.main:app --reload
```

API docs are available at `http://localhost:8000/docs`.

## Deployment

The project includes a `build.sh` script for Render.com:

```bash
./build.sh
```

This installs dependencies and runs pending migrations automatically on deploy.

## Currency System

KiKit uses two in-app currencies:

- **Coins** — purchased via RevenueCat in-app purchases. Spent when sending gifts.
- **Diamonds** — earned by receiving gifts. Not purchasable.

Coin packs are configured via the `COIN_PACKS_JSON` env var, keyed by RevenueCat product ID.

## Matching

Profiles are matched based on:
1. Gender and mutual interest preferences
2. Relationship type (`looking_for`)
3. Age range
4. Ethnicity
5. Distance (`ST_DWithin` via PostGIS)

Results are ranked by a weighted score of shared hobbies and interests, then sorted by distance.

## Face Verification

Profile verification uses InsightFace to compare a live selfie upload against the user's stored profile photos. The match threshold and minimum required matches are configurable via env vars.
