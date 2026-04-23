import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

async function backfill72h() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in environment.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const timestamp = new Date().toISOString();
  
  console.log(`\n🕒 Starting 72-Hour Backfill Sync at ${timestamp}`);
  console.log(`-----------------------------------------------`);

  for (const city of CITIES) {
    console.log(`\n🏙️  Backfilling ${city.name} (${city.icao})...`);
    
    // Backfill Today, Yesterday, and Day Before Yesterday
    for (let i = 0; i < 3; i++) {
      const dateObj = new Date();
      // Adjust date by subtraction of days
      dateObj.setDate(dateObj.getDate() - i);
      
      const dateStr = dateObj.toLocaleString("en-US", { 
        timeZone: city.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const [m, d, y] = dateStr.split("/");
      const targetDate = `${y}${m}${d}`;

      console.log(`  [Batch] Processing ${targetDate}...`);
      const result = await syncCityData(city, targetDate, supabase);
      
      if (result.success) {
        console.log(`  ✅ Success: ${result.count} records updated.`);
      } else {
        console.error(`  ❌ Failed: ${result.error}`);
      }
    }
  }

  console.log(`\n-----------------------------------------------`);
  console.log(`✨ 72-Hour Backfill Complete! Your history is now populated.\n`);
}

backfill72h();
