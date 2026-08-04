#!/usr/bin/env bash
# deploy.sh - Code cleanup and startup script

set -o pipefail # Catch errors in piped commands
set -o nounset  # Exit if variables are undefined

echo "🚀 Starting code cleanup..."

# 1. RUFF: Removes unused imports (--select F401) AND sorts imports (I)
# We use '.' to cover the whole project directory.
echo "  -> Removing unused imports and sorting..."
ruff check app/ --select F401,I --fix

# 2. ISORT: Sorts imports in all Python files
echo "  -> Sorting imports with isort..."
isort app/

# 3. BLACK: Formats the code to standard style
echo "  -> Formatting code with Black..."
black app/

echo "✅ Cleanup complete!"
