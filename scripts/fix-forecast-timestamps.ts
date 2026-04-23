import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTimestamps() {
  console.log("Fetching records with forecast history...");
  const { data: records, error } = await supabase
    .from("weather_records")
    .select(
      "id, timestamp_gmt, city_name, forecast_history_wu, forecast_updated_at_wu",
    )
    .not("forecast_history_wu", "eq", "[]");

  if (error) {
    console.error("Error fetching records:", error);
    return;
  }

  console.log(`Found ${records?.length} records to check.`);

  for (const record of records || []) {
    const history = record.forecast_history_wu || [];
    const currentUpdate = record.forecast_updated_at_wu;
    let changed = false;

    if (!currentUpdate || history.length === 0) continue;

    const currentUnix = new Date(currentUpdate).getTime();
    const citySlug = record.city_name;
    const city = CITIES.find((c: any) => c.slug === citySlug);
    const timezone = city?.timezone || "Asia/Jakarta";

    // Calculate the target date (YYYYMMDD) from timestamp_gmt in city's timezone
    const dateObj = new Date(record.timestamp_gmt * 1000);
    const localDateStr = dateObj.toLocaleDateString("en-CA", {
      timeZone: timezone,
    }); // YYYY-MM-DD
    const targetDate = localDateStr.replace(/-/g, "");

    if (!targetDate) {
      console.log(`Skipping record ${record.id} due to missing target_date`);
      continue;
    }

    const fixedHistory = history.map((item: any, idx: number) => {
      const itemDate = new Date(item.updated_at);
      const itemUnix = itemDate.getTime();

      // If the history item is within 24 hours of the current update time
      if (Math.abs(itemUnix - currentUnix) < 3600000 * 24) {
        console.log(
          `[Fix] Adjusting history for ${citySlug} (${record.id}) at ${targetDate} to 07:00 AM...`,
        );
        changed = true;

        const year = parseInt(targetDate.slice(0, 4));
        const month = parseInt(targetDate.slice(4, 6)) - 1;
        const day = parseInt(targetDate.slice(6, 8));

        // Calculate 07:00 AM in the city's timezone
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T07:00:00`;
        const city7AM = new Date(
          new Date(dateStr).toLocaleString("en-US", { timeZone: timezone }),
        );
        const utcDate = new Date(dateStr);
        const offset = city7AM.getTime() - utcDate.getTime();
        const correctUtcDate = new Date(utcDate.getTime() - offset);

        return {
          ...item,
          updated_at: correctUtcDate.toISOString(),
        };
      }
      return item;
    });

    if (changed) {
      const { error: updateError } = await supabase
        .from("weather_records")
        .update({ forecast_history_wu: fixedHistory })
        .eq("id", record.id);

      if (updateError) {
        console.error(`Error updating record ${record.id}:`, updateError);
      } else {
        console.log(`Successfully fixed record ${record.id}`);
      }
    }
  }

  console.log("Cleanup complete.");
}

fixTimestamps();
