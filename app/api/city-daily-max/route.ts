import { NextRequest, NextResponse } from "next/server";
import { getCityBySlug } from "@/lib/config";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("city");
  const month = searchParams.get("month"); // YYYYMM

  if (!slug || !month || !/^\d{6}$/.test(month)) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid params. Expected city=<slug>&month=YYYYMM",
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
    const year = parseInt(month.slice(0, 4));
    const m = parseInt(month.slice(4, 6)) - 1;

    // Wide UTC bounds (one day padding either side) so timezone-shifted
    // rows still fall into the local_date filter inside SQL.
    const startTs = Math.floor(
      new Date(Date.UTC(year, m, 1)).getTime() / 1000,
    ) - 86400;
    const endTs =
      Math.floor(new Date(Date.UTC(year, m + 1, 1)).getTime() / 1000) + 86400;

    const result = await pool.query(
      `
      WITH daily AS (
        SELECT
          to_char(to_timestamp(timestamp_gmt) AT TIME ZONE $2, 'YYYYMMDD') AS local_date,
          temp_c_wu,
          timestamp_gmt
        FROM weather_records
        WHERE city_name = $1
          AND timestamp_gmt >= $3
          AND timestamp_gmt < $4
          AND temp_c_wu IS NOT NULL
      ),
      maxed AS (
        SELECT local_date, MAX(temp_c_wu) AS max_temp
        FROM daily
        GROUP BY local_date
      )
      SELECT m.local_date, m.max_temp, MAX(d.timestamp_gmt) AS at_ts
      FROM maxed m
      JOIN daily d
        ON d.local_date = m.local_date
       AND d.temp_c_wu = m.max_temp
      WHERE substr(m.local_date, 1, 6) = $5
      GROUP BY m.local_date, m.max_temp
      ORDER BY m.local_date;
      `,
      [city.slug, city.timezone, startTs, endTs, month],
    );

    const days: Record<string, { maxC: number; timestamp: number }> = {};
    for (const row of result.rows) {
      days[row.local_date] = {
        maxC: Number(row.max_temp),
        timestamp: Number(row.at_ts),
      };
    }

    return NextResponse.json({
      success: true,
      city: city.slug,
      month,
      timezone: city.timezone,
      days,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
