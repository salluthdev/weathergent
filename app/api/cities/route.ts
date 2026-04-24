import { NextResponse } from "next/server";
import { CITIES } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    success: true,
    cities: CITIES.map((c) => {
      const now = new Date().toLocaleString("en-US", {
        timeZone: c.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const [m, d, y] = now.split("/");
      const dateStr = `${y}${m}${d}`;

      return {
        name: c.name,
        slug: c.slug,
        icao: c.icao,
        station: c.station,
        timezone: c.timezone,
        latitude: c.lat,
        longitude: c.lon,
        current_date: dateStr,
      };
    }),
  });
}
