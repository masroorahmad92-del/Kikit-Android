#!/usr/bin/env bash
# Full Kikit App Store resubmission helper
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"

echo "=== Kikit App Store Resubmission ==="

# --- Backend deploy prep ---
echo ""
echo "1) Backend changes are in: $BACKEND"
echo "   Deploy to Render (kikit-app.onrender.com):"
echo "   - Set OTP_BYPASS_EMAILS=appreview@letskikit.com"
echo "   - Set REVENUECAT_WEBHOOK_SECRET=<from RevenueCat dashboard>"
echo "   - Redeploy service, then in Render Shell run:"
echo "     python -m app.scripts.dev.seed_app_review_user"

# --- RevenueCat webhook URL ---
echo ""
echo "2) RevenueCat webhook URL (after deploy):"
echo "   https://kikit-app.onrender.com/api/v1/revenuecat/webhook"
echo "   Authorization header: Bearer <REVENUECAT_WEBHOOK_SECRET>"

# --- Frontend deps ---
echo ""
echo "3) Installing frontend dependencies..."
cd "$FRONTEND"
if command -v yarn >/dev/null 2>&1; then
  yarn install --frozen-lockfile || yarn install
else
  npm install
fi

# --- iOS pods ---
echo ""
echo "4) Installing CocoaPods..."
cd "$FRONTEND/ios"
export LANG=en_US.UTF-8
pod install

# --- Verify demo login (after backend deploy) ---
echo ""
echo "5) Testing production login (requires backend deploy + seed)..."
curl -sS -X POST "https://kikit-app.onrender.com/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"appreview@letskikit.com","password":"AppReview2026!"}' | python3 -m json.tool || true

# --- iOS Archive ---
echo ""
echo "6) Building iOS archive (Release)..."
cd "$FRONTEND/ios"
ARCHIVE_PATH="$ROOT/build/Kikit.xcarchive"
mkdir -p "$ROOT/build"
xcodebuild \
  -workspace kikit.xcworkspace \
  -scheme kikit \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  archive \
  | tail -20

echo ""
echo "Archive created at: $ARCHIVE_PATH"
echo ""
echo "7) Upload to App Store Connect:"
echo "   See scripts/PREPARE_APP_STORE_UPLOAD.md for full cert + upload steps."
echo "   Open Xcode → Window → Organizer → Archives → Distribute App"
echo ""
echo "8) App Store Connect → App Review Information → Notes:"
cat "$ROOT/APP_REVIEW.md" | sed -n '/Paste this in/,/Contact:/p'
