#!/usr/bin/env bash
# Builds the standalone bundle locally, ships it to the droplet and restarts the service.
# The data directory (/var/www/nestcalc/prod/data) lives outside the rsync target and is never touched.
# See docs/DEPLOY.md for the one-time server setup.
set -euo pipefail

cd "$(dirname "$0")/.."

HOST=digital-ocean
APP_DIR=/var/www/nestcalc/prod/app

npm run build

# Standalone output does not include static assets; Next expects them next to server.js.
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

rsync -avz --delete --exclude '/data/' --exclude '.env*' .next/standalone/ "$HOST:$APP_DIR/"

ssh "$HOST" 'sudo systemctl restart nestcalc'
