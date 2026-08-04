# Kikit Android Build — Status Report (Aug 3, 2026)

## AAB Built: YES

**Path:**
```
/Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch/frontend/android/app/build/outputs/bundle/release/app-release.aab
```

**Size:** ~45 MB  
**Version:** 1.0 (versionCode 24)  
**Package:** app.letskikit.kikit  
**Architectures:** arm64-v8a only (Play Store 64-bit requirement)

---

## Fixes Applied

### 1. react-native-incall-manager (patch-package)
- `compile` → `implementation`
- Updated SDK 35, androidx.annotation
- `android.support.annotation.Nullable` → `androidx.annotation.Nullable`
- Removed deprecated `createJSModules()` from InCallManagerPackage
- Patch: `frontend/patches/react-native-incall-manager+1.0.1.patch`

### 2. SoundPackage conflict
- Excluded `react-native-sound` from Android autolinking (iOS-only ringtone)
- Removed manual `SoundPackage` from `MainApplication.kt`
- `react-native-nitro-sound` retained for stream-chat

### 3. Native build
- Limited `reactNativeArchitectures` to `arm64-v8a` (fixes flaky armeabi-v7a CMake failures)

---

## Keystore

- Exists: `frontend/android/keystore/kikit-release.keystore`
- Properties: `frontend/android/keystore.properties` (not committed)
- Separate from Homelit keystore per APP_SEPARATION.md

---

## Still Placeholder (rebuild required after)

| Item | File |
|------|------|
| Firebase Android app ID | `frontend/android/app/google-services.json` |
| RevenueCat Android key | `frontend/src/utils/constants.js` |

See `play-submission/FIREBASE_ANDROID_SETUP.md` and `USER_CLICKS_REMAINING.md`.

---

## Rebuild Command

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd /Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch
./scripts/build-release-aab.sh
```
