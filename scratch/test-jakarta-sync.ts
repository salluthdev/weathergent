import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";
import { syncCityData } from "../lib/weather-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSync() {
  const city = CITIES.find(c => c.slug === "jakarta");
  if (!city) return;
  
  const targetDate = "20260423";
  console.log(`Manually syncing ${city.name} for ${targetDate}...`);
  const result = await syncCityData(city, targetDate, supabase);
  console.log(JSON.stringify(result, null, 2));
}

testSync();
