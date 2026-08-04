#!/usr/bin/env bash
# deploy.sh - Deployment script for Render.com

set -o errexit  # exit on error
set -o pipefail # catch pipe errors
set -o nounset  # treat unset vars as errors

echo "🚀 Starting deployment..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Step 2: Apply database migrations (if using Alembic or similar)
if [ -f "alembic.ini" ]; then
  echo "📜 Running database migrations..."
  alembic upgrade head
fi
