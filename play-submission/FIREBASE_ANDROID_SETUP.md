# Firebase Android Setup — Kikit ONLY

**Do NOT use Homelit Firebase (`homelit-e1845`).** Kikit uses project **`kikit-c9fee`** only.

| | Homelit | Kikit |
|---|---------|-------|
| Firebase project | `homelit-e1845` | `kikit-c9fee` |
| Android package | `app.homelit.homelit` | `app.letskikit.kikit` |
| google-services.json path | homelit-app repo | `frontend/android/app/google-services.json` |

---

## Step 1 — Add Android app in Firebase

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select project **kikit-c9fee** (NOT homelit-e1845)
3. Click **Add app** → **Android**
4. **Android package name:** `app.letskikit.kikit` (exact — must match Play Console)
5. **App nickname:** Kikit Android
6. **Debug signing certificate SHA-1:** skip for now (add after Step 3)
7. Click **Register app**
8. Download **`google-services.json`**
9. Replace file at:
   ```
   frontend/android/app/google-services.json
   ```
10. Verify `package_name` in the file is `app.letskikit.kikit`
11. Verify `mobilesdk_app_id` is NOT `REPLACE_AFTER_FIREBASE_SETUP`

> Keep existing iOS app (`com.kikit`) in the same Firebase project. You are **adding** Android, not replacing iOS.

---

## Step 2 — Add upload keystore SHA fingerprints

After release keystore exists (`frontend/android/keystore/kikit-release.keystore`):

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
keytool -list -v \
  -keystore frontend/android/keystore/kikit-release.keystore \
  -alias kikit
```

Copy **SHA-1** and **SHA-256**.

Add both to:
1. **Firebase** → Project Settings → Your apps → **Kikit Android** → Add fingerprint
2. **Google Cloud Console** → [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials?project=kikit-c9fee)
   - Open the **Web client** OAuth 2.0 client used for Google Sign-In on Android
   - Add SHA-1 fingerprint

---

## Step 3 — Rebuild AAB (after real google-services.json)

```bash
cd /Users/masroorahmadkhan/Projects/Kitkit-App-hamza-merged-branch
./scripts/build-release-aab.sh
```

---

## Step 4 — Verify template vs real file

Current template (placeholder — replace before production):

```json
"mobilesdk_app_id": "1:1030759039274:android:REPLACE_AFTER_FIREBASE_SETUP"
"package_name": "app.letskikit.kikit"
"project_id": "kikit-c9fee"
```

Real downloaded file will have a concrete `mobilesdk_app_id` like:
`1:1030759039274:android:xxxxxxxxxxxxxxxx`

---

## What Firebase enables in Kikit

- FCM push notifications (`@react-native-firebase/messaging`)
- Google Sign-In (with SHA-1 on OAuth client)
- Future Analytics/Crashlytics if added

---

## Separation checklist

- [ ] Firebase project = `kikit-c9fee` only
- [ ] Package = `app.letskikit.kikit` only
- [ ] Did NOT copy Homelit `google-services.json`
- [ ] SHA-1 from **kikit-release.keystore** (not Homelit keystore)
- [ ] Rebuilt AAB after replacing json file
