#!/usr/bin/env bash
# Runs the UI against the local backend stack (elimika repo: scripts/local/up.sh).
#
#   scripts/local-dev.sh            # creates .env.local from .env.local.example if missing, then pnpm dev
#   scripts/local-dev.sh --check    # only checks that the local API and Keycloak realm answer
#   node scripts/local-login-check.mjs   # with the dev server up: headless sign-in as qa-student
#
# Sign in with any QA user from the backend's docs/guides/local-environment.md, e.g.
# qa-student@elimika.local / Passw0rd!
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
    cp .env.local.example .env.local
    secret="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
    sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=${secret}|" .env.local && rm -f .env.local.bak
    echo "[local-dev] created .env.local from .env.local.example"
fi

# shellcheck disable=SC1091
set -a; source .env.local; set +a

ok=1
curl -sf "${API_BASE_URL}/actuator/health" >/dev/null \
    && echo "[local-dev] API up at ${API_BASE_URL}" \
    || { echo "[local-dev] API not reachable at ${API_BASE_URL} (run scripts/local/up.sh in the backend repo)"; ok=0; }
curl -sf "${KEYCLOAK_ISSUER}/.well-known/openid-configuration" >/dev/null \
    && echo "[local-dev] Keycloak realm up at ${KEYCLOAK_ISSUER}" \
    || { echo "[local-dev] Keycloak realm not reachable at ${KEYCLOAK_ISSUER}"; ok=0; }

if [[ "${1:-}" == "--check" ]]; then
    [[ "$ok" == 1 ]]
    exit
fi

[[ -d node_modules ]] || pnpm install --frozen-lockfile
exec pnpm dev
