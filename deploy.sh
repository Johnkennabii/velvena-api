#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
SERVICE_NAME="${SERVICE_NAME:-allure-api}"
START_TIMEOUT="${START_TIMEOUT:-10}"

log() {
  printf "\n[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Command '$1' is required but was not found in PATH." >&2
    exit 1
  fi
}

require_cmd git
require_cmd npm
require_cmd pm2
require_cmd timeout

log "Staging working tree..."
git add .

read -rp $'\nEntrez le nom de la feature / message de commit (laisser vide pour générer automatiquement) : ' COMMIT_MESSAGE
if [[ -z "${COMMIT_MESSAGE// }" ]]; then
  COMMIT_MESSAGE="chore: deploy $(date '+%Y-%m-%d %H:%M:%S')"
fi

if git diff --cached --quiet; then
  log "Aucune modification à commit. Étape 'git commit' ignorée."
else
  log "Création du commit..."
  git commit -m "$COMMIT_MESSAGE"
fi

log "Pushing current branch '$BRANCH' to '$REMOTE'..."
git push "$REMOTE" "$BRANCH"

log "Building project artifacts..."
npm run build

log "Running 'npm start' (limited to ${START_TIMEOUT}s to avoid blocking the deployment script)..."
if ! timeout "$START_TIMEOUT" npm start; then
  log "'npm start' exited (expected if it timed out). Continuing deployment."
fi

log "Restarting pm2 app '$SERVICE_NAME'..."
pm2 restart "$SERVICE_NAME"

log "Deployment complete ✅"
