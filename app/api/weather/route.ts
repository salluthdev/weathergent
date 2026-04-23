import { NextRequest, NextResponse } from "next/server";
import { getCityBySlug } from "@/lib/config";
import { getWeatherFromDb } from "@/lib/weather-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("city");
  const date = searchParams.get("date");

  if (!slug || !date) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required parameters: city and date (YYYYMMDD)",
      },
      { status: 400 },
    );
  }

  const city = getCityBySlug(slug);
  if (!city) {
    return NextResponse.json(
      { success: false, error: `City not found: ${slug}` },
      { status: 404 },
    );
  }

  try {
    const result = await getWeatherFromDb(city, date);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "No data available for this city and date in the database.",
          hint: "Try visiting the city page on the dashboard to trigger a live sync.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      city: city.name,
      icao: city.icao,
      date: date,
      timezone: city.timezone,
      data: result.hourlyReport,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
