#!/usr/bin/env bash
# One-time fix: stop codesign from repeatedly asking for keychain password.
set -euo pipefail

KEYCHAIN="$HOME/Library/Keychains/login.keychain-db"

echo "Enter your Mac login password (input hidden):"
read -rs PASS
echo

security unlock-keychain -p "$PASS" "$KEYCHAIN"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$PASS" "$KEYCHAIN"

echo "Done. Keychain unlocked and codesign access granted."
echo "Now in Xcode: Product → Archive"
