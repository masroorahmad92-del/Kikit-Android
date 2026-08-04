# Kikit App Store Upload — Build 23

**Bundle ID:** `com.kikit`  
**Team:** KMZ ENTERTAINMENT LLC (`K3B599KVGX`)  
**Version:** 1.0 (23)

This guide covers everything you must do manually in Apple Developer / App Store Connect. Code fixes for build 23 are already applied in the repo.

---

## What was fixed in build 23 (automatic)

| Issue | Fix |
|-------|-----|
| ITMS-90683 (missing `NSLocationAlwaysAndWhenInUseUsageDescription`) | Key present; geolocation pod requires it |
| Generic privacy strings (mic/photos) | Replaced with Kikit-specific descriptions |
| Unused background modes (`fetch`, `processing`) | Removed — only `remote-notification` kept |
| Missing export compliance key | Added `ITSAppUsesNonExemptEncryption = false` |
| Release signed as Development | Release now uses `Apple Distribution` |
| Build number | Bumped `22` → `23` |
| Pod permissions | Enabled Camera, Microphone, PhotoLibrary, LocationWhenInUse in Podfile |

**Intentionally NOT added:** `NSLocationAlwaysUsageDescription` — adding it would trigger "Always" location prompts. The app only requests When In Use.

---

## Step 1 — Fix revoked development certificate

Your **Apple Development** certificate was revoked. You need fresh certs before archiving.

### In Apple Developer (developer.apple.com)

1. Sign in with the KMZ ENTERTAINMENT LLC account.
2. Go to **Certificates, Identifiers & Profiles → Certificates**.
3. Under **Development**, if the old cert shows **Revoked**, click **+** to create a new one:
   - Type: **Apple Development**
   - Upload a CSR from Keychain Access (Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority).
4. Under **Distribution**, ensure you have a valid **Apple Distribution** certificate (required for App Store upload). Create one if missing.

### In Xcode

1. Open `frontend/ios/kikit.xcworkspace` (not `.xcodeproj`).
2. Select the **kikit** target → **Signing & Capabilities**.
3. Confirm **Team** = KMZ ENTERTAINMENT LLC.
4. Check **Automatically manage signing**.
5. If Xcode shows signing errors, go to **Xcode → Settings → Accounts** → select your Apple ID → **Manage Certificates** → click **+** → **Apple Development** and **Apple Distribution**.
6. Clean stale profiles: still in Manage Certificates, revoke any expired profiles; Xcode will regenerate on next build.

### Keychain (if codesign keeps prompting)

```bash
cd /Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch
./scripts/fix_signing_keychain.sh
```

---

## Step 2 — Install dependencies

```bash
cd /Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch/frontend
npm install   # or: yarn install

cd ios
export LANG=en_US.UTF-8
pod install   # required after Podfile permission changes
```

---

## Step 3 — Verify build number

In Xcode: **kikit** target → **General** → **Build** should show **23**.

Or confirm in terminal:

```bash
grep CURRENT_PROJECT_VERSION frontend/ios/kikit.xcodeproj/project.pbxproj
# Should show: CURRENT_PROJECT_VERSION = 23;
```

---

## Step 4 — Archive build 23

1. In Xcode, set scheme to **kikit** and device to **Any iOS Device (arm64)** (not a simulator).
2. **Product → Clean Build Folder** (⇧⌘K).
3. **Product → Archive**.
4. Wait for Organizer to open with the new archive.

**If archive fails on signing:** repeat Step 1, then Clean + Archive again.

**Do not** use `CODE_SIGNING_ALLOWED=NO` from older scripts — that produces an unsigned archive that cannot be uploaded.

---

## Step 5 — Upload to App Store Connect

1. In **Organizer**, select the build 23 archive → **Distribute App**.
2. Choose **App Store Connect** → **Upload**.
3. Options (recommended):
   - Upload symbols: **Yes**
   - Manage version and build number: **No** (already set to 23)
4. Select **Apple Distribution** signing (automatic).
5. Click **Upload** and wait for processing (usually 5–30 minutes).

### Export compliance (App Store Connect)

When prompted after upload, answer:

- **Does your app use encryption?** Yes (HTTPS only)
- **Is it exempt?** Yes — standard TLS only (`ITSAppUsesNonExemptEncryption` is already `false` in Info.plist)

---

## Step 6 — App Store Connect configuration

### Replace build 22 with build 23

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps → Kikit**.
2. If build **22** is still **Waiting for Review**, you can:
   - **Option A:** Remove it from submission, upload build 23, attach build 23, resubmit.
   - **Option B:** Let build 22 finish review (likely fails on ITMS-90683 if it was built before the location key fix), then submit build 23.
3. Under **TestFlight** or the version page, confirm build **23** appears after processing.

### Metadata (critical for Guideline 4.3)

See `APP_REVIEW.md` in the repo root for full copy. Minimum updates:

- **Category:** Social Networking (primary)
- **Subtitle:** `Verified live rooms & Sparks`
- **App Review Notes:** paste the demo account block from `APP_REVIEW.md`

### App Privacy questionnaire

Align with `PrivacyInfo.xcprivacy` — collected data includes:

- Email, Name, User ID, Photos/Videos, Precise Location, Purchase History, Audio (live rooms)
- Tracking: **No**

---

## Step 7 — Backend before review

Ensure production backend is ready (reviewer uses demo login):

```bash
# On Render shell after deploy
python -m app.scripts.dev.seed_app_review_user
```

Env vars on Render:

```
OTP_BYPASS_EMAILS=appreview@letskikit.com
REVENUECAT_WEBHOOK_SECRET=<your secret>
```

Test login:

```bash
curl -sS -X POST "https://kikit-app.onrender.com/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"appreview@letskikit.com","password":"AppReview2026!"}'
```

---

## Step 8 — Submit for review

1. App Store Connect → version **1.0** → select build **23**.
2. Complete **Export Compliance**, **Content Rights**, **Advertising Identifier** (No tracking).
3. **Add for Review** → **Submit to App Review**.

---

## Troubleshooting

| Error | Action |
|-------|--------|
| ITMS-90683 location key | Build 23 includes the key; re-archive if you edited Info.plist after last archive |
| Invalid signature / revoked cert | Repeat Step 1; delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData` |
| No accounts with App Store Connect access | Add your Apple ID under Xcode → Settings → Accounts |
| Build 22 stuck in review | Cancel submission → attach build 23 |
| Guideline 4.3 rejection | Use appeal text in `APP_REVIEW.md`; emphasize verified live rooms + Sparks differentiation |

---

## Approval confidence

| Area | Confidence | Notes |
|------|------------|-------|
| ITMS-90683 / plist keys | **High** | All required keys present and consistent |
| Signing / cert | **Manual** | Revoked cert must be regenerated by you |
| Guideline 4.3 (Spam) | **Medium** | Prior rejection; metadata + review notes are critical |
| Background modes | **High** | Unused modes removed |
| Privacy strings | **High** | Specific, feature-aligned descriptions |

**Overall:** Build 23 should pass **technical** App Store validation once you upload with a valid Distribution certificate. **Human review** (4.3) depends on metadata, screenshots, and reviewer notes — follow `APP_REVIEW.md` closely.

---

## Quick checklist

- [ ] New Apple Development + Distribution certificates in Keychain
- [ ] `pod install` completed after Podfile change
- [ ] Archive shows build **23**
- [ ] Upload succeeded in Organizer
- [ ] Build 23 selected in App Store Connect
- [ ] App Review Notes + demo account pasted
- [ ] Backend seeded with `appreview@letskikit.com`
- [ ] Submitted for review
