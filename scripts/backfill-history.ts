import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

/**
 * BACKFILL SCRIPT: April 2025 -> Today
 * 
 * Note: We use the standard syncCityData for simplicity, but for a 1-year 
 * backfill, we should be mindful of API rate limits. 
 */

async function backfill() {
  const startDate = new Date("2025-04-01");
  const endDate = new Date(); // Today
  
  console.log(`\n--- Starting Historical Backfill ---`);
  console.log(`Range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  console.log(`Cities: ${CITIES.length}\n`);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}${m}${day}`;

    console.log(`\n>>> Processing Date: ${dateStr} <<<`);

    // Process cities in small batches of 5 to avoid overwhelming the API/DB
    const batchSize = 5;
    for (let i = 0; i < CITIES.length; i += batchSize) {
      const batch = CITIES.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (city) => {
        try {
          process.stdout.write(`  ${city.name}... `);
          const res = await syncCityData(city, dateStr);
          if (res.success) {
            console.log(`✅ (${res.count} records)`);
          } else {
            console.log(`❌ (${res.error})`);
          }
        } catch (err: any) {
          console.log(`💥 (${err.message})`);
        }
      }));
    }
  }

  console.log(`\n--- Backfill Complete ---`);
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
