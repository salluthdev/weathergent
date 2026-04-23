import { NextResponse } from "next/server";
import { CITIES } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    success: true,
    cities: CITIES.map((c) => ({
      name: c.name,
      slug: c.slug,
      icao: c.icao,
      station: c.station,
      timezone: c.timezone,
      latitude: c.lat,
      longitude: c.lon,
    })),
  });
}
