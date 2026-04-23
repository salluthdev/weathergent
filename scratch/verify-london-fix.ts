import { createClient } from "@supabase/supabase-js";
import { getCityBySlug } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

async function verifyLondonFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const city = getCityBySlug("london");

  if (!city) {
    console.error("City not found.");
    return;
  }

  console.log("🏙️  Re-syncing London for 20260417 with Peak Match logic...");
  const result = await syncCityData(city, "20260417", supabase);
  
  if (result.success) {
    console.log(`✅ Success: ${result.count} records updated.`);
    
    // Query all records for that day
    const { data } = await supabase
      .from("weather_records")
      .select("*")
      .eq("station_id", city.station)
      .order("timestamp_gmt", { ascending: true });
      
    // Filter for April 17 records
    const focusRecords = data?.filter(r => {
        const d = new Date(r.timestamp_gmt * 1000).toISOString();
        return d.includes("2026-04-17T12") || d.includes("2026-04-17T13") || d.includes("2026-04-17T14");
    });

    console.log("\nRecords for 2026-04-17 focusing on the 13:00-20:00 UTC window (peak search):");
    focusRecords?.forEach(r => {
        console.log(`${new Date(r.timestamp_gmt * 1000).toISOString()} -> Temp: ${r.temp_c}°C`);
    });

    const maxTemp = Math.max(...(data?.map(r => r.temp_c || 0) || [0]));
    console.log(`\nVerified Daily Max Temp for London on 20260417: ${maxTemp}°C`);
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }
}

verifyLondonFix();
