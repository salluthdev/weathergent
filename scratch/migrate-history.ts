import * as dotenv from "dotenv";
import path from "path";

// Load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("Checking DATABASE_URL...");
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined in environment variables!");
} else {
  const url = process.env.DATABASE_URL;
  const masked = url.replace(/:([^@]+)@/, ":****@");
  console.log("DATABASE_URL found:", masked);
}

import pool from "../lib/db";

async function migrate() {
  console.log("Starting History columns migration...");
  try {
    await pool.query(`
      ALTER TABLE weather_records 
      ADD COLUMN IF NOT EXISTS history_wu JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS history_aviation JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
