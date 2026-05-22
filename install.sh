#!/usr/bin/env bash
set -euo pipefail

TOKEN="${1:?Usage: install.sh <token>}"
shift
BASE_URL="${AUDIT_BASE_URL:-https://audit.securecodehq.com}"

command -v node >/dev/null 2>&1 || {
  echo "Error: Node.js is required but not installed." >&2
  exit 1
}

TMPFILE=$(mktemp /tmp/audit-agent-XXXXXX.js)
trap 'rm -f "$TMPFILE"' EXIT

EXPECTED_SHA256=$(curl -sSfI "$BASE_URL/api/agent-bundle" | grep -i x-content-sha256 | cut -d' ' -f2 | tr -d '\r\n')
curl -sSfL "$BASE_URL/api/agent-bundle" -o "$TMPFILE"

if [ -z "$EXPECTED_SHA256" ]; then
  echo "Error: Server did not provide integrity hash. Aborting." >&2
  exit 1
fi

ACTUAL_SHA256=""
if command -v sha256sum &>/dev/null; then
  ACTUAL_SHA256=$(sha256sum "$TMPFILE" | cut -d' ' -f1)
elif command -v shasum &>/dev/null; then
  ACTUAL_SHA256=$(shasum -a 256 "$TMPFILE" | cut -d' ' -f1)
elif command -v openssl &>/dev/null; then
  ACTUAL_SHA256=$(openssl dgst -sha256 "$TMPFILE" | awk '{print $NF}')
fi
if [ -z "$ACTUAL_SHA256" ]; then
  echo "Error: No SHA256 tool available (sha256sum, shasum, or openssl required)." >&2
  exit 1
fi
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
  echo "Error: Integrity check failed. Downloaded agent does not match expected hash." >&2
  exit 1
fi

node "$TMPFILE" --token="$TOKEN" "$@"
