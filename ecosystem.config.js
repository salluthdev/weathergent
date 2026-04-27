module.exports = {
  apps: [
    {
      name: "weather-app",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "weather-sync",
      script: "bun",
      args: "run scripts/sync-worker.ts",
      cron_restart: "* * * * *", // Restart every 1 minute
      autorestart: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "weather-sync-deep",
      script: "bun",
      args: "run scripts/sync-full.ts",
      cron_restart: "0 0 * * *", // Run once a day at midnight
      autorestart: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
