# Kikit — Google Play Store Submission Guide

**App:** Kikit  
**Play Console package name:** `app.letskikit.kikit`  
**Play Developer account:** Homelit Digital LLC (`makhan73@gmail.com`) — shared org only; Kikit is a **separate Play listing** from Homelit  
**iOS bundle ID (unchanged):** `com.kikit`  
**Version:** 1.0 (versionCode **24**, matches App Store build 24)  
**Category:** Social  
**Privacy Policy:** https://www.letskikit.com/privacy  
**Terms of Use:** https://www.letskikit.com/terms  
**Support URL:** https://letskikit.com  
**Support email:** admin@letskikit.com  

This guide covers everything you must do in Google Play Console. Local Android config has been prepared in this repo.

> **Homelit vs Kikit separation:** See [`APP_SEPARATION.md`](APP_SEPARATION.md). Firebase, RevenueCat, keystores, backends, and store listings must never be shared. Only the Play Developer **account** is shared.

---

## Why a different Android package name?

`com.kikit` is **already taken globally** on Google Play (likely tied to a lost Play Console account). Android and iOS package identifiers **do not need to match** — iOS stays `com.kikit` (already App Store approved).

| Platform | Identifier | Notes |
|----------|------------|-------|
| **Android (Play Store)** | `app.letskikit.kikit` | Matches Homelit pattern (`app.homelit.homelit`) |
| **iOS (App Store)** | `com.kikit` | Unchanged — do not rename |

**Enter this exact string in Play Console → Create app → Android package name:**
```
app.letskikit.kikit
```

---

## What was done locally (automatic)

| Item | Status |
|------|--------|
| Target SDK 35 / compile SDK 35 | ✅ Meets 2026 Play requirements |
| `applicationId` `app.letskikit.kikit` | ✅ Unique Play package (iOS stays `com.kikit`) |
| Version bumped to 24 / 1.0 | ✅ Matches App Store build 24 |
| Android permissions (camera, mic, location, notifications, media) | ✅ Added to AndroidManifest |
| Firebase Google Services plugin | ✅ Added to Gradle |
| `google-services.json` template | ✅ Created — **replace from Firebase** (Step 2) |
| Release signing config | ✅ Reads `android/keystore.properties` |
| Keystore generation script | ✅ `scripts/generate-release-keystore.sh` |
| Release AAB build script | ✅ `scripts/build-release-aab.sh` |
| RevenueCat Android hook | ✅ Added — **needs API key** (Step 3) |
| ProGuard keep rules | ✅ Added for Firebase, RevenueCat, WebRTC |
| App display name | ✅ "Kikit" |

---

## Step 1 — One-time: Google Play Developer account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with **Homelit Digital LLC** account (`makhan73@gmail.com`) — already registered
3. Create a **new app** (separate from Homelit listing):
   - **App name:** Kikit
   - **Android package name:** `app.letskikit.kikit` ← exact string, cannot be changed later
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (with in-app purchases)

### Optional: Give brother-in-law Kikit-only Play access

Play Console → **Users and permissions** → invite his Google email → under **App permissions**, add **Kikit only** (not Homelit) → role **Admin** or **Release manager**. Avoid account-level Admin — that exposes all apps.

---

## Step 2 — Firebase: Add Android app (required for push + Google Sign-In)

The iOS app uses Firebase project `kikit-c9fee`. Android must be registered with the **new** package name.

1. Open [Firebase Console](https://console.firebase.google.com) → project **kikit-c9fee**
2. Click **Add app** → **Android**
3. **Android package name:** `app.letskikit.kikit`
4. **App nickname:** Kikit Android
5. Skip debug SHA-1 for now (add after Step 4)
6. Download **`google-services.json`**
7. Replace:
   ```
   frontend/android/app/google-services.json
   ```
   (The template in repo has a placeholder `mobilesdk_app_id` — the downloaded file is required for FCM.)

> **Note:** Keep the existing iOS app (`com.kikit`) in Firebase. You are adding a **second** Android app alongside it, not replacing iOS.

### After generating release keystore (Step 4)

Add **SHA-1** and **SHA-256** from your upload keystore to:
- Firebase → Project Settings → Your Android app → **Add fingerprint**
- [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your **Web client** (used for Google Sign-In on Android)

Print fingerprints:
```bash
keytool -list -v -keystore frontend/android/keystore/kikit-release.keystore -alias kikit
```

---

## Step 3 — RevenueCat: Android app + Play products

1. [RevenueCat Dashboard](https://app.revenuecat.com) → your Kikit project
2. **Apps** → **+ New** → **Google Play Store**
3. **Package name:** `app.letskikit.kikit`
4. Link your Google Play app — requires Play Console access + service account (see Step 12)
5. Copy the **Android API key** (starts with `goog_`)
6. Update `frontend/src/utils/constants.js`:
   ```js
   export const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_KEY_HERE';
   ```
7. Create matching **subscription and consumable products** in Play Console (mirror iOS product IDs from RevenueCat)

> **Note:** IAP product IDs (e.g. `com.kikit.subscription.monthly`) stay the same — they are store product identifiers, not the Android package name.

---

## Step 4 — Generate release keystore + build AAB

**Requires:** Android Studio (or JDK 17+) installed.

```bash
cd /Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch

# 1. Generate upload keystore (one time)
chmod +x scripts/generate-release-keystore.sh scripts/build-release-aab.sh
./scripts/generate-release-keystore.sh

# 2. Edit passwords
nano frontend/android/keystore.properties

# 3. Build signed AAB
./scripts/build-release-aab.sh
```

**Output AAB path:**
```
frontend/android/app/build/outputs/bundle/release/app-release.aab
```

**Play App Signing:** On first upload, Google Play will ask you to opt in to **Play App Signing**. Choose **Yes** — Google manages the app signing key; you keep the upload key (`kikit-release.keystore`). **Back up the keystore and passwords** — losing the upload key requires a Google support request.

---

## Step 5 — Store listing (copy-paste)

### Short description (80 chars max)
```
Verified live rooms, Sparks & virtual gifts — interest-based community, not dating.
```

### Full description (4000 chars max)
```
Kikit is a verified community platform for interest-based connection.

Join public Live Rooms hosted by verified members — watch, chat, and support creators with virtual gifts. Browse the Community tab to find people who share your hobbies and send a Spark: a contextual introduction tied to a shared interest, not an anonymous swipe.

Every member passes face verification before accessing live rooms or community features. Hosts earn diamonds from gifts; members enjoy safe 1:1 chat and premium video calls.

KEY FEATURES
• Verified-only access — face match against profile photos
• Interest-based Live Rooms with in-room chat and virtual gifting
• Sparks — contextual introductions tied to shared interests
• Host monetization — viewers send gifts; hosts earn diamonds
• Safe 1:1 chat and premium video calls

Kikit is a community platform, not a dating app.

Terms of Use: https://www.letskikit.com/terms
Privacy Policy: https://www.letskikit.com/privacy
Support: https://letskikit.com
```

### App category
- **Category:** Social
- **Tags (if prompted):** Social networking, Live streaming, Community

### Contact details
| Field | Value |
|-------|-------|
| Email | admin@letskikit.com |
| Website | https://letskikit.com |
| Privacy policy URL | https://www.letskikit.com/privacy |

---

## Step 6 — Store assets to upload

| Asset | Spec | Source |
|-------|------|--------|
| **App icon** | 512×512 PNG, 32-bit, no alpha | Export from iOS `1024.png` in Xcode asset catalog, resize to 512×512 |
| **Feature graphic** | 1024×500 PNG/JPEG | Create banner with Kikit logo + "Verified Live Rooms & Community" |
| **Phone screenshots** | Min 2, max 8; 16:9 or 9:16; min 320px short side | Capture from Android emulator or device — prioritize: Live Rooms, Discover/Sparks, Face verification, Gifting, Chat |
| **7-inch tablet screenshots** | Optional but recommended | Same flows on tablet emulator |
| **10-inch tablet screenshots** | Optional | Same |

**Screenshot order (match App Store):**
1. Live Rooms
2. Discover / Sparks
3. Face verification
4. In-room gifting
5. Chat

---

## Step 7 — Content rating questionnaire

Play Console → **Policy → App content → Content rating**

Start **IARC questionnaire**. Expected answers for Kikit:

| Question area | Likely answer |
|---------------|---------------|
| Violence | None or mild |
| Sexual content | None (community platform, not dating) |
| User-generated content | **Yes** — live chat, profiles, photos |
| Users interact / share location | **Yes** |
| Digital purchases | **Yes** — subscriptions + consumable coins |
| Shares precise location | **Yes** (optional feature) |

Expected rating: **Teen** or **Mature 17+** depending on live chat/UGC answers. Complete honestly.

---

## Step 8 — Data safety form

Play Console → **Policy → App content → Data safety**

Align with App Store privacy disclosures and `PrivacyInfo.xcprivacy`:

### Data collected
| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email address | Yes | No | Account, auth |
| Name | Yes | No | Profile |
| User IDs | Yes | No | Account |
| Photos/Videos | Yes | No | Profile, verification, chat |
| Precise location | Yes (optional) | No | Nearby rooms/members |
| Purchase history | Yes | No | IAP, subscriptions |
| Audio | Yes | No | Live rooms, video calls |
| Messages | Yes | No | Chat, live room chat |

### Security
- Data encrypted in transit: **Yes** (HTTPS/TLS)
- Users can request deletion: **Yes** (in-app Profile → Delete account)

### Tracking
- **No** — app does not track users across apps for advertising

---

## Step 9 — App access (demo account for reviewers)

Play Console → **Policy → App content → App access**

Select **All or some functionality is restricted** and provide:

| Field | Value |
|-------|-------|
| Username | `appreview@letskikit.com` |
| Password | `AppReview2026!` |

**Instructions for reviewers:**
```
Demo login (no OTP):
1. Tap "Continue with Email" on sign-in
2. Email: appreview@letskikit.com
3. Password: AppReview2026!
4. Do NOT use Sign in with Apple/Google for demo

Test path:
- LIVE tab → join a live room
- DISCOVER tab → browse verified members → send a Spark
- PROFILE → subscriptions, account deletion

Backend must have OTP_BYPASS_EMAILS=appreview@letskikit.com and seed script run.
```

Ensure backend is ready (same as App Store):
```bash
# On Render shell
python -m app.scripts.dev.seed_app_review_user
```

Env on Render:
```
OTP_BYPASS_EMAILS=appreview@letskikit.com
```

---

## Step 10 — Target audience & ads

- **Target audience:** 18+ (social platform with UGC and live streaming)
- **Appeals to children:** No
- **Contains ads:** No
- **News app:** No

---

## Step 11 — Upload AAB and submit

1. Play Console → **Release → Production** (or **Internal testing** first for smoke test)
2. **Create new release**
3. Upload: `frontend/android/app/build/outputs/bundle/release/app-release.aab`
4. **Release name:** `1.0 (24)`
5. **Release notes:**
   ```
   Initial Android release of Kikit — verified community platform with live rooms, Sparks, and virtual gifting.
   ```
6. Complete all **Policy status** items (green checkmarks)
7. **Review release** → **Start rollout to Production**

Review typically takes **1–7 days** (sometimes longer for first submission with IAP).

---

## Step 12 — Google Play ↔ RevenueCat service account (for IAP)

Required before subscriptions/coins work on Android:

1. Play Console → **Setup → API access**
2. Link Google Cloud project
3. Create **service account** with **Release manager** or **Admin** permissions
4. Download JSON key → upload to RevenueCat dashboard
5. In Play Console → **Monetize → Products → Subscriptions / In-app products** — create products matching iOS/RevenueCat IDs

---

## Build command reference

```bash
# Full path from repo root
cd /Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch

# Generate keystore (once)
./scripts/generate-release-keystore.sh

# Build signed AAB
./scripts/build-release-aab.sh

# Manual Gradle (if scripts fail)
cd frontend/android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
./gradlew clean bundleRelease
```

---

## Blockers requiring your action

1. **Google Play Developer account** — $25 registration + identity verification (1–3 days)
2. **Download real `google-services.json`** from Firebase after adding Android app (`app.letskikit.kikit`)
3. **RevenueCat Android API key** — paste into `frontend/src/utils/constants.js`
4. **Generate release keystore** — run `./scripts/generate-release-keystore.sh`, save passwords
5. **Install JDK / Android Studio** — required to build AAB (Java was not found on this machine)
6. **Build and upload AAB** — run `./scripts/build-release-aab.sh`, upload to Play Console
7. **Store assets** — 512×512 icon, 1024×500 feature graphic, 2+ phone screenshots
8. **Play Console forms** — content rating, data safety, app access demo account
9. **RevenueCat ↔ Play service account** — for in-app purchases to work
10. **Create Play Console products** — subscriptions and coin packs matching iOS

---

## Differentiation note (avoid "dating app" rejection)

Same positioning as App Store approval:

- Kikit is a **verified community platform**, not a dating app
- Primary experience: **Live Rooms** (public livestreams by interest)
- Discovery via **Sparks** (contextual interest-based intros, not swiping)
- Face verification required for live/community features

Use this language in store listing and reviewer notes.

---

## Quick checklist

- [ ] Play Developer account created + verified
- [ ] Firebase Android app added; real `google-services.json` in place
- [ ] Release keystore generated; SHA-1 added to Firebase + Google Cloud
- [ ] RevenueCat Android key in `constants.js`
- [ ] Signed AAB built
- [ ] Store listing text pasted
- [ ] Icon, feature graphic, screenshots uploaded
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] Demo account credentials provided
- [ ] Backend seeded (`appreview@letskikit.com`)
- [ ] AAB uploaded to Production (or Internal test first)
- [ ] RevenueCat service account linked for IAP

---

## Approval confidence

| Area | Confidence | Notes |
|------|------------|-------|
| Target SDK / technical requirements | **High** | SDK 35, permissions declared |
| Signing / AAB | **Manual** | Requires keystore + JDK on your machine |
| Firebase / FCM | **Manual** | Needs real google-services.json |
| IAP / RevenueCat | **Manual** | Needs Play products + service account |
| Policy / UGC social app | **Medium** | Complete data safety + demo account carefully |
| "Not a dating app" positioning | **Medium** | Use App Store-approved copy |

**Overall:** Local Android config is ready. Submission is blocked on Play Console account setup, Firebase Android registration, keystore generation, and AAB build on a machine with Java/Android Studio.
