# Kikit App Store Resubmission — Build 24

Addresses all six rejection reasons from build 1.0 (23).

---

## Status — Build 24 (Jul 25, 2026)

**Waiting for Review / In Review** on App Store Connect as of July 25, 2026.

No further App Store action is needed unless Apple rejects the submission.

---

## Code fixes applied (build 24)

| Guideline | Fix |
|-----------|-----|
| **3.1.2(c) Subscriptions** | Purchase sheet now shows subscription title, length, price, and tappable Terms of Use (EULA) + Privacy Policy links directly above the Subscribe button (`SubscriptionScreen.jsx`). |
| **5.1.1(v) Phone number** | Phone verification is optional. Onboarding skips phone screen by default; `Onboard3` has "Skip for now" and updated copy. Phone omitted from profile API payload when not provided. |
| **4.0.0 Sign in with Apple** | Apple/Google full names are captured from Authentication Services and sent to backend on first login. Profile setup skips the name step when SSO provides a valid name. No re-prompt for email after Apple/Google sign-in. |
| **5.1.1(iv) Location pre-prompt** | Custom pre-prompt button text changed from "Enable Location" to **Continue**. Added **Not now** skip option. |
| **5.1.5 Location Services** | App proceeds without GPS when permission denied or unavailable. Location step removed from required onboarding path (bio → photos). `location_enabled: false` when no coordinates. |
| **2.1 Demo account** | Seed script sets `is_active=True`, resets password, completes profile. See backend steps below. |

**Build number:** 23 → **24**

---

## Manual steps — App Store Connect

### 1. Terms of Use (Guideline 3.1.2c) — REQUIRED

Add Terms of Use link in **one** of these places:

- **App Description** — append:
  ```
  Terms of Use (EULA): https://www.letskikit.com/terms
  Privacy Policy: https://www.letskikit.com/privacy
  ```
- **OR** App Store Connect → App Information → **EULA** field → paste:
  `https://www.letskikit.com/terms`

Privacy Policy URL field (if separate): `https://www.letskikit.com/privacy`

### 2. Demo account (Guideline 2.1) — REQUIRED

**App Review Information → Sign-in required:**

| Field | Value |
|-------|-------|
| Email | `appreview@letskikit.com` |
| Password | `AppReview2026!` |

**App Review Notes** — include:

```
Demo login (no OTP — use email/password flow):
1. Tap "Continue with Email" on the sign-in screen
2. Email: appreview@letskikit.com
3. Password: AppReview2026!
4. Do NOT use Sign in with Apple for the demo account

Test path after login:
- LIVE tab → join a live room
- DISCOVER tab → browse verified members
- PROFILE → subscriptions, settings
```

### 3. Upload build 24

1. Open `frontend/ios/kikit.xcworkspace`
2. Confirm build number = **24**
3. Archive → Upload to App Store Connect
4. Select build **24** on version 1.0
5. Submit for Review

---

## Manual steps — Backend (Render)

Run **before** resubmitting:

```bash
# On Render shell after deploy
python -m app.scripts.dev.seed_app_review_user
```

**Required env var on Render:**

```
OTP_BYPASS_EMAILS=appreview@letskikit.com
```

This lets the demo account log in with email/password without OTP.

**Verify locally or on Render shell** (do not commit credentials):

```bash
curl -X POST "https://kikit-app.onrender.com/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"appreview@letskikit.com","password":"AppReview2026!"}'
```

Expected: `"otp_bypass": true` and an `access_token` in the response.

---

## Reply to App Review (optional paste)

```
We have addressed all issues in build 24:

1. Subscriptions: Purchase flow now displays subscription title, length, price, and functional Terms/Privacy links. Terms URL added to App Store metadata.

2. Phone number: Now optional — users can skip phone verification and use core features without a phone number.

3. Sign in with Apple: We now use the name provided by Authentication Services and no longer re-prompt for name/email after Apple sign-in.

4. Location pre-prompt: Button text changed to "Continue" with a "Not now" skip option.

5. Location Services: App is fully functional without location; location is optional for nearby room recommendations only.

6. Demo account: appreview@letskikit.com / AppReview2026! — sign in via "Continue with Email". Backend seeded with OTP bypass enabled.
```

---

## Checklist before submit

- [ ] Backend deployed with `OTP_BYPASS_EMAILS=appreview@letskikit.com`
- [ ] `seed_app_review_user` run on production
- [ ] Demo login tested via "Continue with Email"
- [ ] Terms of Use URL in App Description or EULA field
- [ ] Privacy Policy URL in metadata
- [ ] Build **24** uploaded and selected
- [ ] App Review Notes updated with demo instructions
- [ ] Submitted for review
