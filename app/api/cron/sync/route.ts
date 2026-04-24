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
    const cityResults = [];
    
    // Sync Today + Next 7 Days
    for (let i = 0; i <= 7; i++) {
      const date = new Date();
      // Adjust date based on city timezone and offset
      const cityNow = new Date(new Date().toLocaleString("en-US", { timeZone: city.timezone }));
      cityNow.setDate(cityNow.getDate() + i);
      
      const y = cityNow.getFullYear();
      const m = String(cityNow.getMonth() + 1).padStart(2, "0");
      const d = String(cityNow.getDate()).padStart(2, "0");
      const dateStr = `${y}${m}${d}`;

      const res = await syncCityData(city, dateStr);
      cityResults.push({ date: dateStr, success: res.success });
    }
    
    results.push({ 
      city: city.name, 
      syncs: cityResults 
    });
  }

  console.log("[Cron] Weather sync complete.");

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
