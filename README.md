# KiKit

KiKit is a social matching app with location-based discovery, virtual gifting, real-time chat, and in-app purchases.

## Repository Structure

```
KiKit-App/
├── backend/    # FastAPI REST API
└── frontend/   # Mobile app (coming soon)
```

## Backend

The backend is a FastAPI application backed by PostgreSQL (with PostGIS), Redis, and a suite of third-party services.

See [backend/README.md](./backend/README.md) for full setup and API documentation.

### Key Features

- **Matching** — Location-aware profile matching with gender, age, ethnicity, and preference filters
- **Gifting** — Virtual gift system with a dual-currency economy (Coins & Diamonds)
- **Chat** — Real-time one-to-one messaging via Stream Chat
- **Auth** — Email/OTP login, Google and Apple SSO, JWT-based sessions
- **Face Verification** — Selfie-based profile verification using InsightFace
- **In-App Purchases** — RevenueCat webhook integration for coin pack purchases
- **Push Notifications** — Firebase Cloud Messaging (FCM)
- **Admin Panel** — SQLAdmin interface for managing gifts and user reports
