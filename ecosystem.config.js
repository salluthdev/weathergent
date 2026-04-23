module.exports = {
  apps: [
    {
      name: 'weather-sync',
      script: './scripts/sync-worker.ts',
      interpreter: 'bun',
      // Cron restart every 10 minutes
      cron_restart: '*/10 * * * *',
      // Don't restart immediately on exit; wait for the cron schedule
      autorestart: false,

      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
