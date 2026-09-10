#!/usr/bin/env bash
# =============================================================================
# I.A.R.D Academy — تهيئة سيرفر الـ API  (Ubuntu/Debian)
# يُنشئ مجلد المشروع بمواصفاته، ويثبّت Node 22 + Nginx + MongoDB + PM2.
# التشغيل:  sudo bash setup-server.sh
# =============================================================================
set -euo pipefail

ROOT=/srv/iard-academy
DEPLOY_USER="${SUDO_USER:-$USER}"
DOMAIN=iard.prootech-agency.com

echo "==> مستخدم النشر: $DEPLOY_USER   |   المجلد: $ROOT"

# ---- 1) بنية المجلد ---------------------------------------------------------
#  $ROOT/
#    api/       كود المشروع (يُستبدل عند كل نشر)
#    uploads/   الملفات المرفوعة — خارج الكود لتبقى بعد إعادة النشر
#    logs/      سجلات PM2
#    backups/   نسخ MongoDB الاحتياطية
mkdir -p "$ROOT"/{api,uploads,logs,backups}
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$ROOT"
chmod 750 "$ROOT" "$ROOT/api" "$ROOT/logs"
chmod 750 "$ROOT/backups"
chmod 775 "$ROOT/uploads"          # الـ API يكتب هنا
echo "==> بنية المجلد جاهزة:"; ls -la "$ROOT"

# ---- 2) الحزم ---------------------------------------------------------------
apt-get update -y
apt-get install -y curl ca-certificates gnupg nginx ufw

if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

command -v pm2 >/dev/null || npm install -g pm2

# ---- 3) MongoDB (محلي، مربوط بـ localhost فقط) ------------------------------
if ! command -v mongod >/dev/null; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
    | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
  . /etc/os-release
  echo "deb [signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME:-jammy}/mongodb-org/8.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -y && apt-get install -y mongodb-org
fi
systemctl enable --now mongod

# ---- 4) الجدار الناري -------------------------------------------------------
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose

echo
echo "==> تمّت التهيئة. الخطوات التالية:"
echo "   1. ارفع الكود إلى $ROOT/api"
echo "   2. cp deploy/api/server.env.production $ROOT/api/server/.env  ثم عبّئ الأسرار"
echo "   3. sudo cp deploy/api/nginx-$DOMAIN.conf /etc/nginx/sites-available/iard-api"
echo "      sudo ln -sf /etc/nginx/sites-available/iard-api /etc/nginx/sites-enabled/"
echo "      sudo nginx -t && sudo systemctl reload nginx"
echo "   4. sudo certbot --nginx -d $DOMAIN"
echo "   5. cd $ROOT/api/server && npm ci --omit=dev && npm run seed"
echo "   6. pm2 start $ROOT/api/deploy/api/ecosystem.api.config.cjs && pm2 save && pm2 startup"
