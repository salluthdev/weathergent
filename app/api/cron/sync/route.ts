import { NextRequest, NextResponse } from "next/server";
import { CITIES } from "@/lib/config";
import { syncCityData } from "@/lib/weather-service";

export async function GET(request: NextRequest) {
  // 1. Security Check: Verify the Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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

    const res = await syncCityData(city, todayStr);
    results.push({ city: city.name, ...res });
  }

  console.log("[Cron] Weather sync complete.");

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
