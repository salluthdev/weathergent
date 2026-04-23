import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

async function manualSync() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in environment.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const timestamp = new Date().toISOString();
  
  console.log(`\n🚀 Starting Manual Global Sync at ${timestamp}`);
  console.log(`-----------------------------------------------`);

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

    console.log(`[Sync] Updating ${city.name} for ${todayStr}...`);
    const result = await syncCityData(city, todayStr, supabase);
    
    if (result.success) {
      console.log(`✅ Success: ${result.count} records updated.`);
    } else {
      console.error(`❌ Failed: ${result.error}`);
    }
  }

  console.log(`-----------------------------------------------`);
  console.log(`✨ Manual Sync Complete! Check your UI now.\n`);
}

manualSync();
