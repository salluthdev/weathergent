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

    const isJakarta = city.slug === "jakarta";
    const resolution = isJakarta ? 600 : 1800;
    
    // For Jakarta, we also force sync every 10 minutes to get BMKG updates
    const isBaseSyncCity = isBaseSync || (isJakarta && minute % 10 === 0);

    if (isBaseSyncCity) {
      citiesToSync.push({ city, todayStr });
    } else {
      // Retries every 1 minute if missing data
      const year = parseInt(y);
      const month = parseInt(m) - 1;
      const day = parseInt(d);

      const utcDate = new Date(year, month, day);
      const cityDate = new Date(
        new Date(year, month, day).toLocaleString("en-US", {
          timeZone: city.timezone,
        }),
      );
      const tzOffsetSeconds = (cityDate.getTime() - utcDate.getTime()) / 1000;
      const finalBaseTime =
        Math.floor(utcDate.getTime() / 1000) - tzOffsetSeconds;

      const currentGmt = Math.floor(nowUtc.getTime() / 1000);
      const secondsSinceMidnight = currentGmt - finalBaseTime;
      const currentBlockIndex = Math.floor(secondsSinceMidnight / resolution);
      const currentBlockTimestamp = finalBaseTime + currentBlockIndex * resolution;

      // Check DB for missing history
      const result = await pool.query(
        `SELECT temp_c_wu, history_c_aviation, temp_c_bmkg FROM weather_records WHERE city_name = $1 AND timestamp_gmt = $2`,
        [city.slug, currentBlockTimestamp],
      );

      const record = result.rows[0];
      const hasWu = record && record.temp_c_wu !== null;
      const hasAviation = record && record.history_c_aviation !== null;
      const hasBmkg = isJakarta ? (record && record.temp_c_bmkg !== null) : true;

      if (!hasWu || !hasAviation || !hasBmkg) {
        console.log(
          `[Sync] ${city.name} missing data for current block (${hasWu ? "WU: OK" : "WU: MISSING"}, ${hasAviation ? "Aviation: OK" : "Aviation: MISSING"}${isJakarta ? (", BMKG: " + (hasBmkg ? "OK" : "MISSING")) : ""}), scheduling sync...`,
        );
        citiesToSync.push({ city, todayStr });
      }
    }
  }

  if (citiesToSync.length === 0) {
    console.log("-> All cities are up-to-date. No sync needed this minute.");
  } else {
    console.log(`-> Syncing ${citiesToSync.length} cities...`);
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
