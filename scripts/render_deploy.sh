#!/usr/bin/env bash
# Run AFTER: render login
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEBHOOK_SECRET="${REVENUECAT_WEBHOOK_SECRET:-kikit-rc-webhook-$(openssl rand -hex 16)}"

echo "Finding kikit service on Render..."
SERVICE_JSON="$(render services --output json)"
SERVICE_ID="$(python3 - <<'PY'
import json, os, sys
data = json.loads(os.environ["SERVICE_JSON"])
items = data if isinstance(data, list) else data.get("services") or data.get("items") or []
for item in items:
    name = (item.get("name") or item.get("service", {}).get("name") or "").lower()
    url = (item.get("serviceDetails", {}).get("url") or item.get("url") or "")
    if "kikit" in name or "kikit-app" in url:
        print(item.get("id") or item.get("service", {}).get("id") or item.get("serviceId"))
        break
PY
)"

if [[ -z "${SERVICE_ID:-}" ]]; then
  echo "Could not find kikit service. Run: render services --output json"
  exit 1
fi

echo "Updating env vars on service $SERVICE_ID..."
render services update "$SERVICE_ID" --confirm \
  --env-var "OTP_BYPASS_EMAILS=appreview@letskikit.com" \
  --env-var "REVENUECAT_WEBHOOK_SECRET=$WEBHOOK_SECRET"

echo "Triggering deploy..."
render deploys create "$SERVICE_ID" --confirm --wait

echo "Seeding App Review account via SSH..."
render ssh "$SERVICE_ID" --confirm --command "python -m app.scripts.dev.seed_app_review_user"

echo ""
echo "RevenueCat webhook secret (save in RevenueCat dashboard): $WEBHOOK_SECRET"
echo "Webhook URL: https://kikit-app.onrender.com/api/v1/revenuecat/webhook"
echo ""
echo "Testing demo login..."
curl -sS -X POST "https://kikit-app.onrender.com/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"appreview@letskikit.com","password":"AppReview2026!"}' | python3 -m json.tool
