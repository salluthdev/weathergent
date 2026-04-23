import { createClient } from "@supabase/supabase-js";
import { CITIES } from "./lib/config";
import { syncCityData } from "./lib/weather-service";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSync() {
  const city = CITIES.find(c => c.slug === "jakarta");
  if (!city) return;
  await syncCityData(city, "20260423");
  process.exit(0);
}

runSync();
