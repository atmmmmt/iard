# دليل النشر — I.A.R.D Academy Portal (سيرفر VPS واحد)

يشرح هذا الدليل رفع الموقع على سيرفر لينكس واحد (Ubuntu 22.04+). المكوّنات:

| المكوّن | التقنية | المنفذ (داخلي) |
|---------|---------|----------------|
| الواجهة | vinext (Next على بيئة Workers) | 3000 |
| الـ API | Express + MongoDB | 5000 |
| قاعدة البيانات | MongoDB 8 | 27017 |
| البروكسي | Nginx + TLS (Let's Encrypt) | 80/443 |

Nginx يوجّه `/` إلى الواجهة و`/api` إلى الخادم — كلها على نفس الدومين، فتعمل كوكيز الجلسة بشكل صحيح.

---

## 1) المتطلبات على السيرفر

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# MongoDB (إما محلي عبر Docker، أو استضافة مُدارة مثل Atlas)
sudo apt-get install -y docker.io docker-compose-plugin

# مدير العمليات
sudo npm install -g pm2
```

## 2) رفع الكود

```bash
# انسخ مجلد المشروع إلى /var/www/iard  (مثلاً عبر git أو scp)
cd /var/www/iard/iard-academy-portal
```

## 3) قاعدة البيانات

خيار (أ) — MongoDB محلي عبر Docker (مضمّن في المشروع):

```bash
docker compose up -d mongodb
```

خيار (ب) — MongoDB Atlas مُدار: احصل على رابط الاتصال وضعه في `server/.env` لاحقاً. **موصى به للإنتاج** (نسخ احتياطي تلقائي).

## 4) إعداد ملفات البيئة

الواجهة:
```bash
cp .env.example .env
```
عدّل `.env`:
```
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_DEMO_MODE=false          # مهم جداً — يفعّل الربط بقاعدة البيانات والحماية
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

الخادم:
```bash
cp server/.env.example server/.env
```
عدّل `server/.env` وولّد أسراراً قوية:
```bash
openssl rand -hex 48   # ضع الناتج في JWT_SECRET
```
اضبط: `NODE_ENV=production`, `MONGODB_URI`, `CLIENT_ORIGIN=https://your-domain.com`,
و`ADMIN_PASSWORD` (12 حرفاً فأكثر).

## 5) تثبيت الحزم والبناء

```bash
# الواجهة
npm ci
npm run build

# الخادم
cd server && npm ci && cd ..
```

## 6) إنشاء حساب المدير (مرة واحدة)

```bash
cd server && npm run seed && cd ..
```
يطبع بيانات تجريبية: الطالب `STU-992038` والشهادة `IARD-BM-88291`.
بعد أول تسجيل دخول، غيّر كلمة مرور المدير وأزل `ADMIN_PASSWORD` من البيئة.

## 7) تشغيل العمليات عبر PM2

```bash
pm2 start ecosystem.config.cjs
pm2 logs                 # تأكد أن iard-web يستمع على 3000، وإلا عدّل المنفذ في nginx
pm2 save
pm2 startup              # اتبع الأمر المطبوع ليعمل بعد إعادة الإقلاع
```

## 8) Nginx + شهادة HTTPS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/iard
sudo nano /etc/nginx/sites-available/iard      # ضع الدومين الحقيقي
sudo ln -s /etc/nginx/sites-available/iard /etc/nginx/sites-enabled/iard
sudo nginx -t && sudo systemctl reload nginx

sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 9) التحقق النهائي

- `https://your-domain.com` يفتح الموقع.
- `https://your-domain.com/api/health` يرجع `{"status":"ok","database":"connected"}`.
- `/verify` يجد الطالب `STU-992038` والشهادة `IARD-BM-88291`.
- `/admin` يعيد التوجيه إلى `/admin/login` قبل الدخول (الحماية تعمل).
- تسجيل الدخول بحساب المدير ينجح، والخروج يمسح الجلسة.

---

## التحديثات اللاحقة

```bash
cd /var/www/iard/iard-academy-portal
git pull                       # أو ارفع النسخة الجديدة
npm ci && npm run build
cd server && npm ci && cd ..
pm2 restart ecosystem.config.cjs
```

## نسخ احتياطي لقاعدة البيانات

```bash
# مع Docker المحلي
docker exec $(docker ps -qf name=mongodb) mongodump --archive > backup-$(date +%F).archive
```
مع Atlas: النسخ الاحتياطي تلقائي من لوحة التحكم.

## ملاحظات أمان مهمة

- لا ترفع ملفات `.env` أبداً — محميّة في `.gitignore`.
- `NEXT_PUBLIC_DEMO_MODE` **يجب** أن يكون `false` في الإنتاج، وإلا يسمح الدخول للوحة بأي بيانات.
- الملفات المرفوعة تُخزَّن في `server/uploads` (تعمل مع سيرفر واحد). لو وسّعت لأكثر من سيرفر، انقل التخزين إلى S3/R2.
- فعّل جدار الحماية: اسمح فقط بالمنافذ 22/80/443، وأبقِ 3000/5000/27017 داخلية.

---

## ما تبقّى لإكمال "الربط الحي" (اختياري لكنه موصى به)

الواجهة العامة ولوحة الإدارة تعرض حالياً بيانات تجريبية (demo) في بعض الأقسام،
بينما الـ API الخلفي **جاهز بالكامل** لكل العمليات. لربطها بالبيانات الحقيقية:

- الصفحة الرئيسية وصفحة الكورسات: جلب الكورسات من `GET /api/courses`.
- لوحة الإدارة (طلاب، وسائط، مدراء، سجل نشاط، إعدادات، محتوى): ربطها بـ
  `/api/admin/*` بدل البيانات الثابتة في `app/data/demo.ts`.

هذه المهمة موصوفة بالتفصيل ويمكن تنفيذها كخطوة تالية.
