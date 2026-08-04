# KiKit Backend - Project Context

## Project Overview

**KiKit** is a social matching mobile app backend built with **FastAPI**. It provides REST APIs for a dating/social networking application with features including location-based profile matching, real-time chat, in-app gifting, face verification, push notifications, and diamond payout to real money via Trolley.

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | FastAPI + Uvicorn |
| Database | PostgreSQL with PostGIS (spatial queries) |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Auth | JWT (PyJWT), OTP via SendGrid, Google & Apple SSO |
| Chat | Stream Chat |
| Push Notifications | Firebase (FCM) |
| Storage | Cloudinary (images), AWS S3 |
| Payouts | Trolley |
| Face Verification | InsightFace + ONNX Runtime |
| Async Tasks | Celery + Redis |
| Admin Panel | SQLAdmin |
| Error Tracking | Sentry |
| Linting/Formatting | Ruff, Black, isort, mypy |

### Python Version

Python 3.12+ (specified in `.python-version`)

## Project Structure

```
backend/
├── app/
│   ├── api/v1/           # Route handlers (thin controllers)
│   ├── services/         # Business logic layer
│   ├── repositories/     # Data access layer (all DB queries)
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── core/             # Config, enums, security, Firebase, Celery
│   ├── database/         # Session and base model
│   ├── admin/            # SQLAdmin views and auth
│   ├── middlewares/      # Request/response middleware
│   ├── tasks/            # Celery async tasks
│   └── utils/            # Helpers (distance, photos, face verification)
├── alembic/              # Database migrations
│   └── versions/         # Migration scripts
├── .venv/                # Python virtual environment
├── requirements.txt      # Python dependencies
├── alembic.ini           # Alembic configuration
├── build.sh              # Render.com deployment script
└── format_files.sh       # Code cleanup script (ruff + isort + black)
```

## Architecture

The codebase follows a layered architecture:

1. **API Layer** (`app/api/v1/`) — Thin controllers that delegate to services
2. **Service Layer** (`app/services/`) — Business logic, orchestrates repositories
3. **Repository Layer** (`app/repositories/`) — All database queries and data access
4. **Models** (`app/models/`) — SQLAlchemy ORM definitions
5. **Schemas** (`app/schemas/`) — Pydantic models for request/response validation

All routes are under `/api/v1`. Key route modules:
- `auth` — SSO (Google/Apple) + token refresh
- `otp` — Email/phone OTP verification
- `profiles` — CRUD, face verification, subscriptions
- `matches` — Profile matching with spatial queries
- `gifts` — Gifting system with coin/diamond economy
- `payouts` — Diamond-to-cash conversion via Trolley
- `chat` — Stream Chat integration
- `notifications` — Push notifications via FCM
- `phone-verification` — Phone OTP verification
- `device` — FCM device registration/logout

## Building and Running

### Prerequisites

- Python 3.12+
- PostgreSQL with PostGIS extension
- Redis (for Celery and caching)

### Setup

```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload
```

API documentation is available at `http://localhost:8000/docs` (requires basic auth credentials from env vars `DOCS_USERNAME` and `DOCS_PASSWORD`).

### Celery Worker

```bash
celery -A app.core.celery:celery_app worker --loglevel=info
```

### Celery Beat (scheduled tasks)

```bash
celery -A app.core.celery:celery_app beat --loglevel=info
```

### Code Formatting

```bash
# Run the cleanup script (ruff + isort + black)
./format_files.sh

# Or individually:
ruff check app/ --fix
ruff format app/
isort app/
black app/
mypy app/
```

### Linting

```bash
ruff check app/
mypy app/
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET` | JWT signing secret |
| `ALGORITHM` | JWT algorithm (default: HS256) |
| `SENDGRID_API_KEY` | Email/OTP delivery |
| `FROM_EMAIL` | Verified sender email |
| `STREAM_API_KEY`, `STREAM_API_SECRET` | Real-time chat |
| `FIREBASE_*` | Push notifications (FCM) |
| `CLOUDINARY_*` | Image uploads |
| `AWS_*` | S3 storage |
| `REDIS_URL` | Caching backend |
| `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | Celery/Redis |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `APPLE_*` | Apple Sign-In |
| `COIN_PACKS_JSON` | RevenueCat product mapping |
| `TROLLEY_*` | Payout processing |
| `DOCS_USERNAME`, `DOCS_PASSWORD` | Swagger UI access |
| `FACE_MATCH_THRESHOLD` | Face verification threshold |
| `FACE_MIN_MATCHES` | Minimum matches for verification |

## Key Configuration Constants

| Setting | Default | Description |
|---------|---------|-------------|
| `DIAMONDS_PER_DOLLAR` | 100 | 1 diamond = $0.01 USD |
| `COINS_TO_DIAMONDS_RATIO` | 0.42 | User receives 42% of coin value as diamonds (after 30% Apple fee) |
| `MIN_PAYOUT_DIAMONDS` | 10,000 | Minimum withdrawal ($100) |
| `MAX_PAYOUT_DIAMONDS` | 100,000 | Maximum withdrawal ($1,000) |
| `PAYOUT_PROCESSING_DAYS` | 14 | Expected payout processing time |
| `PAYOUT_DELAY_DAYS` | 0 | Delay before submitting to Trolley |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 1440 | JWT access token lifetime (24h) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | JWT refresh token lifetime |

## Currency System

- **Coins** — Purchased via RevenueCat in-app purchases. Spent when sending gifts.
- **Diamonds** — Earned by receiving gifts. Can be cashed out via Trolley payouts.

## Matching Algorithm

Profiles are matched based on:
1. Gender and mutual interest preferences
2. Relationship type (`looking_for` — multi-select array)
3. Age range
4. Ethnicity
5. Distance (PostGIS `ST_DWithin`)

Results are ranked by weighted score of shared hobbies and interests, sorted by distance.

## Payout Flow

1. User requests payout (min 10,000, max 100,000 diamonds)
2. Payout is marked as `scheduled` with processing date = `now + PAYOUT_PROCESSING_DAYS`
3. Celery scheduled task processes payouts when their date arrives
4. Trolley batch payment is created and submitted
5. Status updated to `processing` → `completed` or `failed`

## Face Verification

Uses InsightFace to compare a live selfie against stored profile photos. Configurable via `FACE_MATCH_THRESHOLD` and `FACE_MIN_MATCHES` env vars.

## Celery Scheduled Tasks

| Task | Schedule | Purpose |
|------|----------|---------|
| `renew_subscriptions_task` | Daily at midnight | Renew expired subscriptions |
| `process_scheduled_payout_task` | Via Celery beat | Process scheduled payouts |

## Development Conventions

- **Imports**: Sorted with `isort`, unused imports removed by `ruff`
- **Formatting**: `black` for code style, `ruff format` as alternative
- **Type checking**: `mypy` — all code should pass without errors
- **Database**: All queries go through `repositories/` — no raw SQL in services or API handlers
- **Services**: Business logic lives in `services/` — coordinates repositories
- **API handlers**: Thin — delegate to services, handle HTTP concerns only
- **Schemas**: Pydantic models in `schemas/` for all request/response validation
- **Error handling**: Use `HTTPException` for API errors, never silent failures
- **Commits**: Clear, descriptive messages focusing on "why" not "what"

## Testing

No formal test suite is currently in the repository. Manual testing is done via the Swagger UI at `/docs`.

## Deployment

Deployed to Render.com via `build.sh`:
1. Installs dependencies
2. Runs `alembic upgrade head`
3. Uvicorn is started by Render's process manager
