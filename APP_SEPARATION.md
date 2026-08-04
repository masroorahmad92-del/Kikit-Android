# Homelit vs Kikit — Complete App Separation

This document defines what must stay **separate** between Homelit (your company) and Kikit (brother-in-law's app). The only intentional overlap is the **Google Play Developer account** (Homelit Digital LLC) used to publish both apps as **separate listings**.

---

## Package identifiers

| App | Android (Play Store) | iOS (App Store) |
|-----|----------------------|-----------------|
| **Homelit** | `app.homelit.homelit` | `app.homelit.homelit` |
| **Kikit** | `app.letskikit.kikit` | `com.kikit` |

**Play Console → Create app → Android package name for Kikit:**
```
app.letskikit.kikit
```

> **Why Kikit Android ≠ iOS:** `com.kikit` is globally taken on Google Play (lost Play Console account). iOS stays `com.kikit` (already App Store approved). Android and iOS package IDs **do not need to match**.

---

## What's separate (never mix)

| Resource | Homelit | Kikit |
|----------|---------|-------|
| **Firebase project** | `homelit-e1845` | `kikit-c9fee` |
| **google-services.json** | `homelit-app/android/app/` | `frontend/android/app/` |
| **Google Cloud project** | Homelit Sync / `homelit-e1845` | Kikit (`kikit-c9fee`) |
| **RevenueCat project** | Homelit app project | Kikit project (`appl_…` / `goog_…` keys) |
| **Backend / API** | Homelit services | `kikit-app.onrender.com` |
| **Upload keystore** | Homelit release keystore | `kikit-release.keystore` (alias `kikit`) |
| **Support email** | `hello@homelit.app`, `privacy@homelit.app` | `admin@letskikit.com` |
| **Website / legal** | `homelit.app` | `letskikit.com` |
| **Privacy policy** | `homelit.app/privacy-policy` | `letskikit.com/privacy` |
| **Terms** | `homelit.app/terms` | `letskikit.com/terms` |
| **Play Store listing** | Homelit app listing | Kikit app listing (new) |
| **App Store listing** | Homelit | Kikit (`com.kikit`) |
| **Code repos** | `Homelit/homelit-app`, `homelit-site`, `homelit-social-sync` | `Kitkit-App-hamza-merged-branch` |

---

## What's shared (by design)

| Resource | Notes |
|----------|-------|
| **Google Play Developer account** | Homelit Digital LLC (`makhan73@gmail.com`) — OK to publish both apps under one org |
| **Play Console user access** | You can add brother-in-law as **Admin on Kikit app only** (see below) |

---

## Play Console: app-level access for brother-in-law

To give your brother-in-law access to **Kikit only** (not Homelit):

1. Play Console → **Users and permissions**
2. **Invite new users** → enter his Google account email
3. Under **App permissions**, choose **Add app** → select **Kikit** only
4. Role: **Admin** (or **Release manager** if he only needs to upload builds)
5. Do **not** grant account-level Admin — that would expose Homelit listing, billing, and all apps

Account-level permissions apply to every app; app-level permissions limit access to one listing.

---

## Audit status (Aug 2026)

| Check | Status |
|-------|--------|
| Kikit Android `applicationId` = `app.letskikit.kikit` | ✅ |
| Kikit iOS bundle ID = `com.kikit` (unchanged) | ✅ |
| No `homelit` refs in Kikit frontend/backend code | ✅ |
| No `kikit` refs in Homelit site / social-sync / homelit-app | ✅ |
| Kikit Firebase = `kikit-c9fee` only | ✅ |
| Homelit Firebase = `homelit-e1845` only | ✅ |
| Kikit keystore = `kikit-release.keystore` (separate from Homelit) | ✅ |
| Kikit IAP product IDs (`com.kikit.subscription.*`) | ✅ Correct — store SKUs, not Android package |
| Kikit `google-services.json` | ⚠️ Template — download real file from Firebase after registering Android app |
| RevenueCat Android key | ⚠️ Placeholder — add `goog_…` key for Kikit project only |

---

## Do NOT mix (checklist for day-to-day)

- ❌ Do not copy Homelit `google-services.json` into Kikit (or vice versa)
- ❌ Do not sign Kikit AAB with Homelit upload keystore (or vice versa)
- ❌ Do not use Homelit RevenueCat API keys in Kikit (or vice versa)
- ❌ Do not point Kikit app at Homelit backend/API
- ❌ Do not use Homelit privacy/terms URLs in Kikit store listing
- ❌ Do not reuse Firebase OAuth clients across projects
- ❌ Do not create one Play Console app for both products — **two separate listings**
- ✅ OK: Same Play Developer **account** org publishing both apps
- ✅ OK: Kikit Android package differs from iOS (`app.letskikit.kikit` vs `com.kikit`)
