#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
ANDROID_DIR="$FRONTEND_DIR/android"
KEYSTORE_PROPS="$ANDROID_DIR/keystore.properties"
OUTPUT_AAB="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

# Prefer Android Studio JBR if system Java is missing
if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "/Applications/Android Studio.app/Contents/jre/Contents/Home"; do
    if [[ -d "$candidate" ]]; then
      export JAVA_HOME="$candidate"
      export PATH="$JAVA_HOME/bin:$PATH"
      break
    fi
  done
fi

if ! command -v java >/dev/null 2>&1; then
  echo "Java not found. Install Android Studio or JDK 17+, then retry."
  exit 1
fi

if [[ ! -f "$KEYSTORE_PROPS" ]]; then
  echo "Missing $KEYSTORE_PROPS"
  echo "Run: ./scripts/generate-release-keystore.sh"
  echo "Then edit keystore.properties with your passwords."
  exit 1
fi

if grep -q "REPLACE_AFTER_FIREBASE_SETUP" "$ANDROID_DIR/app/google-services.json" 2>/dev/null; then
  echo "WARNING: google-services.json still has a placeholder Android app ID."
  echo "Download the real file from Firebase Console before production release."
  echo "See GOOGLE_PLAY_SUBMISSION.md → Step 2."
  echo
fi

if grep -q "REPLACE_WITH_ANDROID_KEY" "$FRONTEND_DIR/src/utils/constants.js" 2>/dev/null; then
  echo "WARNING: RevenueCat Android API key not set in src/utils/constants.js"
  echo "IAP will not work on Android until REVENUECAT_API_KEY_ANDROID is configured."
  echo
fi

chmod +x "$ANDROID_DIR/gradlew"

cd "$ANDROID_DIR"
./gradlew clean bundleRelease

echo
echo "Release AAB built successfully:"
echo "  $OUTPUT_AAB"
echo
echo "Upload this file to Google Play Console → Release → Production → Create new release."
