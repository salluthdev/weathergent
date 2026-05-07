import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";
import pool from "../lib/db";

async function runSync() {
  const nowUtc = new Date();
  const minute = nowUtc.getMinutes();
  const timestamp = nowUtc.toISOString();
  console.log(`\n--- Starting Global Sync at ${timestamp} ---`);

  // Base sync is exactly at minute 0 or 30
  const isBaseSync = minute === 0 || minute === 30;

  if (isBaseSync) {
    console.log("-> Performing Base Sync (30-min mark) for all cities...");
  } else {
    console.log("-> Performing Missing Data Check...");
  }

  const citiesToSync = [];

  for (const city of CITIES) {
    const now = new Date().toLocaleString("en-US", {
      timeZone: city.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [m, d, y] = now.split("/");
    const todayStr = `${y}${m}${d}`;

    // ALWAYS sync all cities to capture minute-by-minute "Current Aviation" updates
    citiesToSync.push({ city, todayStr });
  }

  if (citiesToSync.length === 0) {
    console.log("-> No cities to sync.");
  } else {
    console.log(`-> Syncing all ${citiesToSync.length} cities...`);
    // Process in batches of 5 to avoid overwhelming the API and ensure it finishes within 1 minute
    const batchSize = 5;
    for (let i = 0; i < citiesToSync.length; i += batchSize) {
      const batch = citiesToSync.slice(i, i + batchSize);
      await Promise.all(
        batch.map((item) => syncCityData(item.city, item.todayStr)),
      );
    }
  }

  console.log(`--- Sync Cycle Complete ---\n`);
}

// Main execution loop
console.log("Weathergent Sync Worker started...");

// Run sync once and exit
runSync()
  .then(async () => {
    console.log("Sync completed successfully. Exiting...");
    await pool.end(); // Close DB connections gracefully
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Sync failed:", err);
    await pool.end();
    process.exit(1);
  });
