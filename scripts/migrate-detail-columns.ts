import pool from "../lib/db";

async function migrate() {
  console.log("[Migration] Adding forecast_detail_wu and history_detail_wu columns...");
  try {
    await pool.query(
      `ALTER TABLE weather_records ADD COLUMN IF NOT EXISTS forecast_detail_wu JSONB;`,
    );
    await pool.query(
      `ALTER TABLE weather_records ADD COLUMN IF NOT EXISTS history_detail_wu JSONB;`,
    );
    console.log("[Migration] Done.");
  } catch (err) {
    console.error("[Migration] Failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
