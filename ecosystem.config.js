module.exports = {
  apps: [
    {
      name: "weather-app",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "weather-sync",
      script: "bun",
      args: "run scripts/sync-worker.ts",
      cron_restart: "*/2 * * * *", // Restart every 2 minutes
      autorestart: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
