# I.A.R.D Academy Portal

Bilingual Arabic/English academy website, certificate registry, student profiles, administration dashboard, and Node.js/MongoDB backend based on the supplied Visily designs.

## Included

- Responsive RTL/LTR public website, courses and course details.
- WhatsApp course inquiry with course title and code prefilled.
- Verification by Student ID or Certificate Number.
- Public student profile with certificate search and pagination.
- Public verified certificate page, download, print and share.
- Admin areas for courses, students, certificates, content, media, roles, activity and settings.
- Express/MongoDB API with JWT HTTP-only cookies, RBAC, rate limits, audit logs and validation.
- Original certificate preservation plus optimized WebP image generation.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

API and database:

```bash
docker compose up -d mongodb
cd server
cp .env.example .env
npm install
# Set a 12+ character ADMIN_PASSWORD and a long random JWT_SECRET.
npm run seed
npm run dev
```

Demo records: student `STU-992038`, certificate `IARD-BM-88291`.

## Core API

- Public: `GET /api/courses`, `POST /api/verify`, `GET /api/public/students/:studentId`, `GET /api/public/certificates/:number`
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Admin CRUD: `/api/admin/courses`, `/api/admin/students`, `/api/admin/certificates`, `/api/admin/settings`
- Audit and roles: `/api/admin/activity`, `/api/admin/administrators`

Set `NEXT_PUBLIC_DEMO_MODE=false` in production. Use managed MongoDB and durable S3/R2-compatible object storage for multi-instance production hosting; local uploads are included for a single Node server.

## Deployment

For a full step-by-step production deployment on a single Node VPS (Nginx + PM2 + MongoDB + TLS), see **[DEPLOYMENT.md](DEPLOYMENT.md)**. Environment templates: [.env.example](.env.example) (frontend) and [server/.env.example](server/.env.example) (API). PM2 process file: `ecosystem.config.cjs`. Nginx template: `deploy/nginx.conf.example`.
