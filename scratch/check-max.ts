import { createClient } from "@supabase/supabase-js";
import { getCityBySlug } from "../lib/config";

async function checkMaxLondon() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);
  const city = getCityBySlug("london");

  const { data } = await supabase
    .from("weather_records")
    .select("temp_c, timestamp_gmt")
    .eq("station_id", city!.station);

  const dayRecords = data?.filter(r => {
      const d = new Date(r.timestamp_gmt * 1000).toISOString();
      return d.startsWith("2026-04-17");
  });

  console.log(`Found ${dayRecords?.length} records for 2026-04-17.`);
  const temps = dayRecords?.map(r => r.temp_c);
  console.log("Temperatures found:", temps);
  console.log("MAX Temperature:", Math.max(...(temps || [])));
}

checkMaxLondon();
