import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const recordsToRestore = [
  {
    city_name: "new-york",
    station_id: "KLGA",
    timestamp_gmt: 1776751200,
    city_time: "Apr 21, 2026, 02:00 AM",
    wib_time: "Apr 21, 2026, 01:00 PM (13:00 WIB)",
    temp_c: 4,
    temp_f: 39,
    forecast_c: 4,
    forecast_f: 39,
    condition_history: "Fair",
    condition_forecast: "Clear"
  },
  {
    city_name: "new-york",
    station_id: "KLGA",
    timestamp_gmt: 1776754800,
    city_time: "Apr 21, 2026, 03:00 AM",
    wib_time: "Apr 21, 2026, 02:00 PM (14:00 WIB)",
    temp_c: 4,
    temp_f: 39,
    forecast_c: 4,
    forecast_f: 39,
    condition_history: "Fair",
    condition_forecast: "Clear"
  }
];

async function restore() {
  console.log("Restoring requested weather records...");
  const { data, error } = await supabase
    .from("weather_records")
    .upsert(recordsToRestore, { onConflict: "city_name,timestamp_gmt" });

  if (error) {
    console.error("Restoration failed:", error.message);
  } else {
    console.log("Successfully restored 2 records to Supabase.");
  }
}

restore();
