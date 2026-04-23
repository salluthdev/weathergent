import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRecords() {
  const { data, error } = await supabase
    .from("weather_records")
    .select("timestamp_gmt, temp_c_wu, history_c_aviation")
    .eq("city_name", "jakarta")
    .gte("timestamp_gmt", 1776915000) // Around 10 AM WIB
    .order("timestamp_gmt", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  data?.forEach(r => {
    const wib = new Date(r.timestamp_gmt * 1000).toLocaleString("en-US", {timeZone: "Asia/Jakarta", timeStyle: "short"});
    console.log(`${wib}: WU=${r.temp_c_wu}, Aviation=${r.history_c_aviation}`);
  });
}

inspectRecords();
