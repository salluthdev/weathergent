import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatest() {
  const { data, error } = await supabase
    .from("weather_records")
    .select("timestamp_gmt, temp_c_wu")
    .eq("city_name", "jakarta")
    .not("temp_c_wu", "is", null)
    .order("timestamp_gmt", { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No data found for Jakarta.");
    return;
  }

  const latest = data[0];
  const date = new Date(latest.timestamp_gmt * 1000);
  const wibTime = date.toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short"
  });

  console.log(`Latest Jakarta WU Temp: ${latest.temp_c_wu}°C`);
  console.log(`Timestamp (WIB): ${wibTime}`);
}

checkLatest();
