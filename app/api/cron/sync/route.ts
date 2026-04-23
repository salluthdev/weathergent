import { NextRequest, NextResponse } from "next/server";
import { CITIES } from "@/lib/config";
import { syncCityData } from "@/lib/weather-service";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // 1. Security Check: Verify the Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Initialize Supabase Admin (using Service Role Key)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Configuration missing: Supabase URL or Service Role Key" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`[Cron] Starting global weather sync for ${CITIES.length} cities...`);

  const results = [];

  for (const city of CITIES) {
    // Get "today" in city's timezone
    const now = new Date().toLocaleString("en-US", {
      timeZone: city.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const [m, d, y] = now.split("/");
    const todayStr = `${y}${m}${d}`;

    const res = await syncCityData(city, todayStr, supabase);
    results.push({ city: city.name, ...res });
  }

  console.log("[Cron] Weather sync complete.");

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
