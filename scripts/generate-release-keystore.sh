#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE_DIR="$ROOT_DIR/frontend/android/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/kikit-release.keystore"
PROPS_FILE="$ROOT_DIR/frontend/android/keystore.properties"
PROPS_EXAMPLE="$ROOT_DIR/frontend/android/keystore.properties.example"

if [[ -f "$KEYSTORE_FILE" ]]; then
  echo "Release keystore already exists: $KEYSTORE_FILE"
  echo "Delete it first if you need to regenerate."
  exit 1
fi

if ! command -v keytool >/dev/null 2>&1; then
  echo "keytool not found. Install a JDK (Android Studio bundled JBR works)."
  exit 1
fi

mkdir -p "$KEYSTORE_DIR"

echo "Generating release keystore for Kikit (app.letskikit.kikit)..."
echo "You will be prompted for keystore and key passwords — save them securely."
echo

keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_FILE" \
  -alias kikit \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Kikit, OU=Mobile, O=KMZ Entertainment LLC, L=Unknown, ST=Unknown, C=US"

echo
echo "Keystore created: $KEYSTORE_FILE"
echo
echo "Next steps:"
echo "1. Copy keystore.properties.example to keystore.properties"
echo "2. Fill in storePassword and keyPassword"
echo "3. Add upload certificate SHA-1 to Firebase Console (Project Settings → Android app)"
echo "4. Add upload certificate SHA-1 to Google Cloud OAuth client for Google Sign-In"
echo
echo "Print SHA-1 / SHA-256 for Play Console and Firebase:"
keytool -list -v -keystore "$KEYSTORE_FILE" -alias kikit | grep -E 'SHA1:|SHA256:'

if [[ ! -f "$PROPS_FILE" ]]; then
  cp "$PROPS_EXAMPLE" "$PROPS_FILE"
  echo
  echo "Created $PROPS_FILE — edit passwords before building release AAB."
fi
