import { createClient } from "@supabase/supabase-js";
import { getCityBySlug } from "../lib/config";

async function verifyLondonFix() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  const city = getCityBySlug("london");

  const { data } = await supabase
    .from("weather_records")
    .select("temp_c, timestamp_gmt")
    .eq("station_id", city!.station);

  const day16Records = data?.filter(r => {
      const d = new Date(r.timestamp_gmt * 1000).toISOString();
      return d.startsWith("2026-04-16T12") || d.startsWith("2026-04-16T13");
  });

  console.log(`Checking London for 2026-04-16 (focused window):`);
  day16Records?.forEach(r => {
      console.log(`${new Date(r.timestamp_gmt * 1000).toISOString()} -> Temp: ${r.temp_c}°C`);
  });

  const maxTemp = Math.max(...(data?.filter(r => new Date(r.timestamp_gmt * 1000).toISOString().startsWith("2026-04-16")).map(r => r.temp_c || 0) || [0]));
  console.log(`\nVerified Daily Max Temp for London on 2026-04-16: ${maxTemp}°C`);
}

verifyLondonFix();
