import { createClient } from "@supabase/supabase-js";
import { CITIES } from "./lib/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectForecasts() {
  const city = CITIES.find(c => c.slug === "jakarta");
  if (!city) return;
  
  const targetDate = "20260423";
  const { data, error } = await supabase
    .from("weather_records")
    .select("timestamp_gmt, forecast_c_wu")
    .eq("city_name", "jakarta")
    .gte("timestamp_gmt", 1776931200) // 3:00 PM WIB
    .lte("timestamp_gmt", 1776934800) // 4:00 PM WIB
    .order("timestamp_gmt", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  data?.forEach(r => {
    const wib = new Date(r.timestamp_gmt * 1000).toLocaleString("en-US", {timeZone: "Asia/Jakarta", timeStyle: "short"});
    console.log(`${wib}: Forecast WU=${r.forecast_c_wu}°C`);
  });
}

inspectForecasts();
