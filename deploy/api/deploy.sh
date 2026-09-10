#!/usr/bin/env bash
# نشر/تحديث الـ API — يُشغَّل على السيرفر داخل /srv/iard-academy/api
set -euo pipefail
ROOT=/srv/iard-academy
cd "$ROOT/api/server"
npm ci --omit=dev
node --check src/server.js
pm2 reload iard-api --update-env || pm2 start "$ROOT/api/deploy/api/ecosystem.api.config.cjs"
pm2 save
sleep 2
curl -fsS http://127.0.0.1:5000/api/health && echo "  <- API سليم"
