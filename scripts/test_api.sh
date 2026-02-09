#!/usr/bin/env bash
set -euo pipefail

# Base URL (can be overridden with BASE env var)
API=${BASE:-http://76.13.232.232:8000}

echo "API: $API"

req() {
  local METHOD="$1"; shift
  local PATH="$1"; shift
  local DATA="${1:-}"
  echo "== $METHOD $PATH =="
  if [[ "$METHOD" == "GET" ]]; then
    curl -i --max-time 8 "$API$PATH" || true
  else
    curl -i -X "$METHOD" -H "Content-Type: application/json" --data "$DATA" --max-time 8 "$API$PATH" || true
  fi
  echo -e "\n\n"
}

req GET "/"
req GET "/api/v1/beaches?limit=1"
req GET "/api/v1/analytics/beaches/recommend?limit=1"
req GET "/api/v1/balneability/report"
req GET "/api/v1/auth/me"
req POST "/api/v1/auth/login" '{"email":"test@example.com","password":"wrong"}'

# Extrai o primeiro beach id para testes adicionais
ID=$(curl -s --max-time 8 "$API/api/v1/beaches?limit=1" || true | python3 - <<'PY'
import sys, json
try:
    d=json.load(sys.stdin)
    if isinstance(d, list) and d:
        print(d[0].get('id',''))
    else:
        print('')
except:
    print('')
PY
)

echo "Extracted beach id: $ID"
if [[ -n "$ID" ]]; then
  req GET "/api/v1/beaches/$ID"
else
  echo "No beach id, skipping /api/v1/beaches/{id} test"
fi

echo "== FIM DOS TESTES =="
