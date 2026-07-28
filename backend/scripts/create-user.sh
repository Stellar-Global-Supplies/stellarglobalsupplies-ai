#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# Create a user in the Stellar Global Supplies AI app
# ─────────────────────────────────────────────────────
# Usage:
#   ./scripts/create-user.sh <email> <password> [display_name]
#
# Example:
#   ./scripts/create-user.sh admin@example.com mypassword "Admin User"
#
# Prerequisites:
#   - ADMIN_KEY must be set in your .env or exported
#   - The backend must be running
#   - curl and jq must be installed
# ─────────────────────────────────────────────────────

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <email> <password> [display_name]"
  exit 1
fi

EMAIL="$1"
PASSWORD="$2"
DISPLAY_NAME="${3:-${EMAIL%@*}}"

# ── config ───────────────────────────────────────────
# Change BASE_URL if your backend runs on a different
# host/port (e.g. http://localhost:3000 when developing
# locally without Docker).
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_KEY="${ADMIN_KEY:-}"
# ─────────────────────────────────────────────────────

if [ -z "$ADMIN_KEY" ]; then
  # Try loading from ../../.env relative to this script's location
  ENV_FILE="$(dirname "$0")/../.env"
  if [ -f "$ENV_FILE" ]; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
  fi
fi

if [ -z "$ADMIN_KEY" ]; then
  echo "ERROR: ADMIN_KEY is not set."
  echo "  Export it:  export ADMIN_KEY='your-secret-key'"
  echo "  Or set it in the backend .env file."
  exit 1
fi

echo "→ Creating user: $EMAIL ($DISPLAY_NAME)"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/admin/create-user" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d "$(jq -n --arg e "$EMAIL" --arg p "$PASSWORD" --arg n "$DISPLAY_NAME" \
        '{email: $e, password: $p, display_name: $n}')")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ User created successfully:"
  echo "$BODY" | jq .
elif [ "$HTTP_CODE" = "409" ]; then
  echo "⚠️  User already exists (email taken)."
else
  echo "❌ Error ($HTTP_CODE):"
  echo "$BODY"
  exit 1
fi