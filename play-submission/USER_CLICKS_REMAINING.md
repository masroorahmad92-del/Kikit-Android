# Kikit Play Console — Minimal Clicks Remaining (for you)

Everything automatable locally is done. AAB is built. Copy-paste files are in `play-submission/`.

---

## 1. Firebase (5 min) — BLOCKS push & Google Sign-In on Android

1. [Firebase Console](https://console.firebase.google.com) → **kikit-c9fee**
2. Add app → Android → package `app.letskikit.kikit`
3. Download `google-services.json` → replace `frontend/android/app/google-services.json`
4. Add upload keystore SHA-1/SHA-256 (run keytool — see `FIREBASE_ANDROID_SETUP.md`)
5. Rebuild: `./scripts/build-release-aab.sh`

---

## 2. Play Console — Store listing (10 min)

Go to [Play Console](https://play.google.com/console) → **Kikit** → **Grow → Store presence → Main store listing**

| Field | Action |
|-------|--------|
| Short description | Paste from `STORE_LISTING.txt` |
| Full description | Paste from `STORE_LISTING.txt` |
| App icon 512×512 | Upload (see `SCREENSHOT_CHECKLIST.txt`) |
| Feature graphic 1024×500 | Upload |
| Phone screenshots | Upload min 2 |
| Category | Social |
| Contact email | admin@letskikit.com |
| Privacy policy | https://www.letskikit.com/privacy |

---

## 3. Policy forms (15 min)

| Form | Location | Copy from |
|------|----------|-----------|
| Content rating | Policy → App content → Content rating | `CONTENT_RATING.txt` |
| Data safety | Policy → App content → Data safety | `DATA_SAFETY.txt` |
| App access | Policy → App content → App access | `APP_ACCESS.txt` |
| Target audience | Policy → App content → Target audience | 18+, not for children |
| Ads | Policy → App content → Ads | No ads |
| News app | Policy → App content | No |

---

## 4. Upload AAB (5 min)

1. **Release → Testing → Internal testing** (recommended first) OR **Production**
2. **Create new release**
3. Upload:
   ```
   frontend/android/app/build/outputs/bundle/release/app-release.aab
   ```
4. Release name: `1.0 (24)`
5. Release notes: from `STORE_LISTING.txt`
6. **Opt in to Play App Signing** when prompted (Yes)

---

## 5. CANNOT automate — requires your identity/payment

| Item | Why blocked |
|------|-------------|
| Developer identity verification | Google legal requirement |
| Payments profile / merchant account | Tax/banking |
| RevenueCat ↔ Play service account | Needs Play API access + JSON key upload |
| Create IAP products in Play Console | Needs monetization setup |
| RevenueCat Android API key | Paste `goog_…` into `frontend/src/utils/constants.js` |

---

## 6. Backend demo account (before submit)

On Render (`kikit-app.onrender.com`):

```bash
# Env var
OTP_BYPASS_EMAILS=appreview@letskikit.com

# Shell
python -m app.scripts.dev.seed_app_review_user
```

---

## 7. Final rollout

1. All Policy status items = green checkmarks
2. **Review release** → **Start rollout**
3. Review time: typically 1–7 days (first IAP submission may take longer)

---

## Quick reference

| Resource | Value |
|----------|-------|
| Package | `app.letskikit.kikit` |
| AAB | `frontend/android/app/build/outputs/bundle/release/app-release.aab` |
| Version | 1.0 (24) |
| Firebase | `kikit-c9fee` (NOT Homelit) |
| Support | admin@letskikit.com |
| Privacy | https://www.letskikit.com/privacy |
