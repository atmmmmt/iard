/**
 * PM2 — الـ API فقط (الواجهة مستضافة خارج هذا السيرفر).
 *
 * على السيرفر:
 *   cd /srv/iard-academy/api
 *   pm2 start deploy/api/ecosystem.api.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "iard-api",
      cwd: "/srv/iard-academy/api/server",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
      max_restarts: 10,
      restart_delay: 3000,
      out_file: "/srv/iard-academy/logs/api.out.log",
      error_file: "/srv/iard-academy/logs/api.err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
