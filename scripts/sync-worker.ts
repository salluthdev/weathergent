import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

async function runSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n--- Starting Global Sync at ${timestamp} ---`);

  for (const city of CITIES) {
    // Get "today" in the city's timezone
    const now = new Date().toLocaleString("en-US", {
      timeZone: city.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [m, d, y] = now.split("/");
    const todayStr = `${y}${m}${d}`;

    await syncCityData(city, todayStr);
  }

  console.log(`--- Sync Cycle Complete ---\n`);
}

// Main execution loop
console.log("Weathergent Sync Worker started...");
console.log(
  `Monitoring ${CITIES.length} cities: ${CITIES.map((c) => c.name).join(", ")}`,
);

// Run sync once and exit
runSync()
  .then(() => {
    console.log("Sync completed successfully. Exiting...");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
