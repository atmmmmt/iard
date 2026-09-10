# نشر الـ API على `iard.prootech-agency.com`

| | |
|---|---|
| الواجهة | `https://academy-iard.com` (استضافة منفصلة) |
| الـ API | `https://iard.prootech-agency.com` → Express على `127.0.0.1:5000` |
| قاعدة البيانات | MongoDB 8 محلي على `127.0.0.1:27017` |
| مجلد المشروع | `/srv/iard-academy/` |

## بنية المجلد على السيرفر

```
/srv/iard-academy/          750  abdalqader
├── api/                    750   كود المشروع (يُستبدل عند كل نشر)
│   └── server/             ← الـ Express API
├── uploads/                775   ملفات مرفوعة — خارج الكود لتنجو من إعادة النشر
├── logs/                   750   سجلات PM2
└── backups/                750   نسخ MongoDB الاحتياطية
```

## DNS

سجل واحد عند مزوّد الدومين:

| النوع | الاسم | القيمة |
|-------|-------|--------|
| A | `api` | IP السيرفر العام |

## الخطوات

```bash
sudo bash deploy/api/setup-server.sh        # 1. تهيئة السيرفر والمجلد
# 2. ارفع الكود إلى /srv/iard-academy/api
cp deploy/api/server.env.production /srv/iard-academy/api/server/.env
openssl rand -hex 48                         # ضعه في JWT_SECRET
sudo cp deploy/api/nginx-iard.prootech-agency.com.conf /etc/nginx/sites-available/iard-api
sudo ln -sf /etc/nginx/sites-available/iard-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d iard.prootech-agency.com # 3. شهادة TLS
cd /srv/iard-academy/api/server && npm ci --omit=dev && npm run seed
pm2 start /srv/iard-academy/api/deploy/api/ecosystem.api.config.cjs && pm2 save && pm2 startup
```

التحديثات لاحقاً: `bash deploy/api/deploy.sh`

## ملاحظة عن الكوكيز (دومينان مختلفان)

الجلسة تُخزَّن في كوكي `iard_admin`. الكود يضبطها تلقائياً في الإنتاج على
`secure: true` و`sameSite: "none"` — وهذا **مطلوب** لأن الواجهة والـ API على
دومينَين مختلفين. الشرطان الباقيان:

1. `CLIENT_ORIGIN` في `server/.env` يحوي `https://academy-iard.com` بالضبط.
2. كل طلبات الواجهة تُرسَل بـ `credentials: "include"`.
3. HTTPS إلزامي على الطرفين (بدونه المتصفح يرفض الكوكي).

## فحص سريع

```bash
curl https://iard.prootech-agency.com/api/health
# {"status":"ok","database":"connected"}
```
