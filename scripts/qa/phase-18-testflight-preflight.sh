#!/usr/bin/env bash
# scripts/qa/phase-18-testflight-preflight.sh

set -Eeuo pipefail

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/choir-testflight.XXXXXX")"
EAS_ENV_FILE="$WORK_DIR/production.env"
EXPO_CONFIG_FILE="$WORK_DIR/expo-config.json"
API_BODY_FILE="$WORK_DIR/api-body.json"

cleanup() {
    rm -rf "$WORK_DIR"
}

trap cleanup EXIT

require_command() {
    command -v "$1" >/dev/null 2>&1 || {
        echo "Falta el comando requerido: $1" >&2
        exit 1
    }
}

require_command node
require_command npm
require_command npx
require_command eas
require_command jq
require_command curl

echo '== Sesión de EAS =='
eas whoami

echo '== Verificación local =='
npm run verify:phase-17-18
npx expo install --check

echo '== Variables del environment production =='
eas env:pull --environment production --path "$EAS_ENV_FILE" --non-interactive

ENV_JSON="$(node - "$EAS_ENV_FILE" <<'NODE'
const fs = require('fs');
const dotenv = require('dotenv');
const envPath = process.argv[2];
const parsed = dotenv.parse(fs.readFileSync(envPath));
console.log(JSON.stringify({
    apiUrl: parsed.EXPO_PUBLIC_API_URL ?? '',
    socketUrl: parsed.EXPO_PUBLIC_SOCKET_URL ?? '',
    bundleIdentifier: parsed.IOS_BUNDLE_IDENTIFIER ?? ''
}));
NODE
)"

API_URL="$(printf '%s' "$ENV_JSON" | jq -r '.apiUrl')"
SOCKET_URL="$(printf '%s' "$ENV_JSON" | jq -r '.socketUrl')"
BUNDLE_IDENTIFIER="$(printf '%s' "$ENV_JSON" | jq -r '.bundleIdentifier')"

[[ "$API_URL" == https://* ]] || {
    echo 'EXPO_PUBLIC_API_URL debe existir y usar HTTPS en production.' >&2
    exit 1
}

[[ "$SOCKET_URL" == https://* ]] || {
    echo 'EXPO_PUBLIC_SOCKET_URL debe existir y usar HTTPS en production.' >&2
    exit 1
}

[[ "$API_URL" != */api && "$API_URL" != */api/ ]] || {
    echo 'EXPO_PUBLIC_API_URL no debe terminar en /api.' >&2
    exit 1
}

[[ "$BUNDLE_IDENTIFIER" =~ ^[A-Za-z0-9]+([.-][A-Za-z0-9]+)+$ ]] || {
    echo 'IOS_BUNDLE_IDENTIFIER no tiene formato reverse-DNS válido.' >&2
    exit 1
}

export EXPO_PUBLIC_API_URL="$API_URL"
export EXPO_PUBLIC_SOCKET_URL="$SOCKET_URL"
export IOS_BUNDLE_IDENTIFIER="$BUNDLE_IDENTIFIER"
export EAS_BUILD_PROFILE=production

npx expo config --type public --json > "$EXPO_CONFIG_FILE"

jq -e --arg bundle "$BUNDLE_IDENTIFIER" '.ios.bundleIdentifier == $bundle' "$EXPO_CONFIG_FILE" >/dev/null
jq -e '.extra.eas.projectId == "453ab38a-8f9e-4c53-8ac8-9ed975e6415a"' "$EXPO_CONFIG_FILE" >/dev/null
jq -e '.runtimeVersion.policy == "appVersion"' "$EXPO_CONFIG_FILE" >/dev/null
jq -e '.plugins | map(if type == "array" then .[0] else . end) | index("expo-notifications") != null' "$EXPO_CONFIG_FILE" >/dev/null
jq -e '.build.production.environment == "production" and .build.production.autoIncrement == true' eas.json >/dev/null

echo '✓ Configuración Expo/EAS de producción validada.'

API_URL="${API_URL%/}"
STATUS="$(curl -sS -o "$API_BODY_FILE" -w '%{http_code}' "$API_URL/api/auth/me")"

[[ "$STATUS" == '401' ]] || {
    echo "El API de producción respondió HTTP $STATUS en /api/auth/me." >&2
    jq . "$API_BODY_FILE" 2>/dev/null || cat "$API_BODY_FILE" >&2
    exit 1
}

jq -e '.code == "ACCESS_TOKEN_REQUIRED"' "$API_BODY_FILE" >/dev/null || {
    echo 'El API no devolvió el contrato fail-closed esperado.' >&2
    jq . "$API_BODY_FILE"
    exit 1
}

echo '✓ API de producción accesible mediante HTTPS.'
echo
echo 'Preflight aprobado.'
echo 'Siguiente build:'
echo '  eas build --platform ios --profile production'
echo 'Para construir y enviar en un solo paso:'
echo '  eas build --platform ios --profile production --auto-submit'
