import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n--- Starting Global Sync at ${timestamp} ---`);

  for (const city of CITIES) {
    // Get "today" in the city's timezone
    const now = new Date().toLocaleString("en-US", { 
      timeZone: city.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [m, d, y] = now.split("/");
    const todayStr = `${y}${m}${d}`;

    await syncCityData(city, todayStr, supabase);
  }

  console.log(`--- Sync Cycle Complete ---\n`);
}

// Main execution loop
const HOURLY = 60 * 60 * 1000;

console.log("Weathergent Sync Worker started...");
console.log(`Monitoring ${CITIES.length} cities: ${CITIES.map(c => c.name).join(", ")}`);

// Run immediately on start
runSync();

// Then run every hour
setInterval(runSync, HOURLY);
