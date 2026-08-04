# Kikit App — App Store Resubmission (Guideline 4.3)

## Rejection reason

**4.3.0 Design: Spam** — Apple believes the app is too similar to other apps or lacks unique value.

This is **not** a login/demo-account issue. Fixing OTP and demo login alone will **not** pass review.

---

## What we changed in code (build 21)

- Added **Discover** tab (Sparks + interest-based browsing) — was built but hidden from reviewers
- Removed dev template screen with hardcoded Stream secrets and test users
- Updated permission strings to describe Kikit’s verified community (not generic “dating”)
- Realistic App Review seed profile (not “Demo account” text)
- Prior fixes: verified live rooms, no fake demo rooms, IAP security, RevenueCat webhook

---

## App Store Connect — update before resubmit

### Category
- **Primary:** Social Networking
- **Secondary:** Lifestyle (avoid Dating as primary if possible)

### Subtitle
`Verified live rooms & Sparks`

### Description (opening paragraph)
```
Kikit is a verified community platform — not another swipe app.

• Verified-only access: face match against your profile photos before live rooms or Discover
• Interest-based Live Rooms: public livestreams with in-room chat and virtual gifting
• Sparks: start conversations with shared interests and context — not anonymous likes
• Host monetization: viewers send gifts; hosts earn diamonds redeemable for payout
```

### Keywords
`live rooms, verified community, sparks, virtual gifts, interest groups`

Avoid: `dating, tinder, bumble, hookup`

### Screenshots
Reorder to show:
1. Live Rooms
2. Discover / Sparks
3. Face verification
4. In-room gifting
5. Chat

---

## App Review Notes (paste into App Review Information)

```
RE: Guideline 4.3 — Kikit is a verified community platform, not a generic dating clone.

Unique features:
• Verified-only Live Rooms (AWS Rekognition face match vs profile photos)
• Interest-based public livestreams with in-room chat + virtual gifting
• Discover + Sparks: contextual introductions tied to shared interests (not anonymous swiping)
• Custom FastAPI backend: live room lifecycle, gifting economy, payouts

Demo account (password login, no OTP):
Email: appreview@letskikit.com
Password: AppReview2026!

Test path:
1. Sign In with credentials above
2. LIVE tab: browse category rooms → join a live room
3. DISCOVER tab: browse verified members → send a Spark (interest-based intro)
4. GIFTS tab: gift history
5. CHAT: 1:1 messaging
6. PROFILE: verification badge, subscriptions, account deletion

Contact: admin@letskikit.com
Support URL: https://letskikit.com
```

---

## Backend (Render)

```env
OTP_BYPASS_EMAILS=appreview@letskikit.com
REVENUECAT_WEBHOOK_SECRET=<random secret>
```

Shell after deploy:
```bash
python -m app.scripts.dev.seed_app_review_user
```

RevenueCat webhook: `https://kikit-app.onrender.com/api/v1/revenuecat/webhook`

---

## Build & submit

1. Kamal accepts License Agreement + DSA on App Store Connect → Business
2. Xcode Archive → build **21** → Upload
3. Update metadata + App Review Notes above
4. Submit for Review

If rejected again on 4.3, use **Appeal** and reference the notes above with a 1-page differentiation letter.
