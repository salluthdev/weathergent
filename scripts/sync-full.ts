import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

async function runDeepSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n--- Starting Global DEEP Sync (14 Days) at ${timestamp} ---`);

  for (const city of CITIES) {
    console.log(`\nProcessing ${city.name}...`);
    
    // Sync Today + Next 14 Days
    for (let i = 0; i <= 14; i++) {
      const cityNow = new Date(new Date().toLocaleString("en-US", { timeZone: city.timezone }));
      cityNow.setDate(cityNow.getDate() + i);
      
      const y = cityNow.getFullYear();
      const m = String(cityNow.getMonth() + 1).padStart(2, "0");
      const d = String(cityNow.getDate()).padStart(2, "0");
      const dateStr = `${y}${m}${d}`;

      process.stdout.write(`  Day ${i}: ${dateStr}... `);
      const res = await syncCityData(city, dateStr);
      console.log(res.success ? "✅" : "❌");
    }
  }

  console.log(`\n--- Deep Sync Complete ---\n`);
}

runDeepSync()
  .then(() => {
    console.log("Deep sync completed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Deep sync failed:", err);
    process.exit(1);
  });
