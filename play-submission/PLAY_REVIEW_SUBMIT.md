# Kikit — Play Store Review Submission (exact clicks)

**Your current state:** Play Console → **Kikit** → **Testing → Internal testing** — testers selected (2 users).  
**Goal:** Upload AAB, then submit **Production** release for Google review.

---

## Before you start — have this file ready

| Item | Path on your Mac |
|------|------------------|
| **AAB (47 MB, signed)** | `/Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch/frontend/android/app/build/outputs/bundle/release/app-release.aab` |
| Version | **1.0** (versionCode **24**) |
| Package | `app.letskikit.kikit` |
| Release name | `1.0 (24)` |
| Release notes | `Initial Android release of Kikit — verified community platform with live rooms, Sparks, and virtual gifting.` |

---

## Part A — Internal testing (optional smoke test, ~5 min)

You are already on **Internal testing** with 2 testers. Use this to verify the build before Production.

1. Open [Google Play Console](https://play.google.com/console) → select **Kikit**.
2. Left sidebar: **Test and release** → **Testing** → **Internal testing**.
3. Click **Create new release** (top right).
4. Under **App bundles**, click **Upload** → select `app-release.aab` from the path above.
5. Wait for upload + processing (1–3 min). Fix any errors if shown.
6. **Release name:** type `1.0 (24)`.
7. **Release notes** (English US): paste release notes above.
8. Click **Next** (bottom right).
9. On **Review and roll out** → click **Save** (or **Start rollout to Internal testing** if prompted).
10. Testers (your 2 users) get the build within ~15 min via the opt-in link on this page.

> **Play App Signing:** On first-ever upload, Google asks you to enroll in Play App Signing. Click **Continue** → **Use Google-generated key** (recommended) or upload your upload key. Your upload keystore stays at `frontend/android/keystore/kikit-release.keystore` (local only, not in git).

---

## Part B — Production review submission (~10 min)

This is what sends the app to **Google review** for public Play Store listing.

### Step 1 — Open Production track

1. Play Console → **Kikit**.
2. Left sidebar: **Test and release** → **Production**.
3. Click **Create new release**.

### Step 2 — Upload the same AAB

1. **App bundles** → **Upload** → select the same `app-release.aab`.
2. **Release name:** `1.0 (24)`.
3. **Release notes:** paste the release notes from the table above.
4. Click **Next**.

### Step 3 — Fix dashboard blockers (must be green before rollout)

Before **Start rollout to Production** works, complete every item under **Policy status** and **Release dashboard**. Check these locations:

| Dashboard area | Left sidebar path | Status to verify |
|----------------|-------------------|------------------|
| **Store listing** | Grow → Store presence → **Main store listing** | App name, short + full description, **512×512 icon**, **1024×500 feature graphic**, **≥2 phone screenshots**, category **Social**, contact email, privacy URL |
| **Content rating** | Monitor and improve → Policy → App content → **Content rating** | Questionnaire completed; certificate issued |
| **Target audience** | Policy → App content → **Target audience** | 18+, not for children |
| **Privacy policy** | Policy → App content → **Privacy policy** | URL: `https://www.letskikit.com/privacy` |
| **Data safety** | Policy → App content → **Data safety** | Form submitted (copy from `play-submission/DATA_SAFETY.txt`) |
| **App access** | Policy → App content → **App access** | Restricted; demo `appreview@letskikit.com` / `AppReview2026!` (copy from `play-submission/APP_ACCESS.txt`) |
| **Ads** | Policy → App content → **Ads** | No ads |
| **Developer account** | Account details | Identity verification complete |
| **Payments profile** | Setup → **Payments profile** | Required if app has IAP (Kikit does) |

**Copy-paste sources:** all text files are in `play-submission/` and assets in `play-store-assets/`.

### Step 4 — Start rollout (sends to Google review)

1. Return to **Test and release → Production →** your draft release.
2. Click **Review release** (bottom).
3. Confirm version **1.0 (24)**, AAB fingerprint, and release notes.
4. Click **Start rollout to Production**.
5. Status changes to **In review** (typically **1–7 days**; first submission with IAP may take longer).

You will receive email at `makhan73@gmail.com` when approved or if Google requests changes.

---

## Known blockers (check these if rollout button is disabled)

These may still block Production even with AAB ready:

| Blocker | Why it matters | Action |
|---------|----------------|--------|
| ⚠️ **Firebase `google-services.json` placeholder** | Push notifications & Google Sign-In won't work on Android until fixed | Firebase Console → **kikit-c9fee** → Add Android app `app.letskikit.kikit` → download real JSON → rebuild AAB (see `FIREBASE_ANDROID_SETUP.md`) |
| ⚠️ **RevenueCat Android API key** | In-app purchases won't work | RevenueCat → add Google Play app → paste `goog_…` key into `frontend/src/utils/constants.js` → rebuild |
| ⚠️ **Play IAP products not created** | Subscriptions/coins fail at runtime | Play Console → **Monetize → Products** — mirror iOS product IDs |
| ⚠️ **RevenueCat ↔ Play service account** | IAP validation fails | Play Console → Setup → **API access** → link service account → upload JSON to RevenueCat |
| ⚠️ **Demo account not seeded** | Reviewers can't log in | Render: `OTP_BYPASS_EMAILS=appreview@letskikit.com` + run `python -m app.scripts.dev.seed_app_review_user` |
| ⚠️ **Payments / merchant account** | Required for paid IAP | Setup → Payments profile — complete tax/banking |
| ⚠️ **Developer identity verification** | Google legal requirement | Account details — complete if pending |

> **Note:** Google may approve the app for review even if IAP isn't fully wired, but reviewers testing purchases will fail. Complete Firebase + demo account at minimum before Production submit.

---

## Quick checklist (Production submit)

- [ ] AAB uploaded to Production track
- [ ] Release name `1.0 (24)` + release notes filled
- [ ] Store listing complete (icon, feature graphic, ≥2 screenshots)
- [ ] Content rating certificate issued
- [ ] Data safety form submitted
- [ ] App access demo credentials provided
- [ ] Target audience 18+ set
- [ ] Privacy policy URL set
- [ ] Backend demo account seeded (`appreview@letskikit.com`)
- [ ] **Start rollout to Production** clicked
- [ ] Email confirmation received — status **In review**

---

## After approval

1. **Production** track shows **Available on Google Play**.
2. Link RevenueCat + create Play IAP products before marketing paid features.
3. Add upload keystore SHA-1/SHA-256 to Firebase (if not done) and ship an update if push/Google Sign-In were broken in v24.

---

## Support references

| Doc | Purpose |
|-----|---------|
| `GOOGLE_PLAY_SUBMISSION.md` | Full setup guide |
| `play-submission/USER_CLICKS_REMAINING.md` | Remaining manual steps |
| `play-submission/BUILD_STATUS.md` | AAB build confirmation |
| `play-store-assets/` | Icon, feature graphic, 8 screenshots |
