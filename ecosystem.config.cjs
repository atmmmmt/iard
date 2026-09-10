/**
 * PM2 process manager configuration for a single Node VPS.
 * Runs two long-lived processes:
 *   1. iard-web  — the vinext (Next on Workers runtime) frontend
 *   2. iard-api  — the Express + MongoDB backend API
 *
 * Usage on the server:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup      # survive reboots
 *   pm2 logs                     # tail logs
 *
 * Make sure you have run the production build first (`npm run build`)
 * and created both .env files (see .env.example and server/.env.example).
 */
module.exports = {
  apps: [
    {
      name: "iard-web",
      cwd: __dirname,
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        // Port the frontend listens on. Nginx proxies to this.
        // Confirm the port in `pm2 logs iard-web` after first start.
        PORT: "3000",
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
    {
      name: "iard-api",
      cwd: __dirname + "/server",
      script: "src/server.js",
      node_args: "",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
