import * as dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

// Load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function migrate() {
  console.log("Starting removal of BMKG columns...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not defined in environment variables!");
    return;
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("Successfully connected to the database.");

    await client.query(`
      ALTER TABLE weather_records 
      DROP COLUMN IF EXISTS temp_c_bmkg,
      DROP COLUMN IF EXISTS temp_f_bmkg,
      DROP COLUMN IF EXISTS forecast_c_bmkg,
      DROP COLUMN IF EXISTS forecast_f_bmkg,
      DROP COLUMN IF EXISTS bmkg_exact_time,
      DROP COLUMN IF EXISTS bmkg_synced_at;
    `);
    
    console.log("BMKG columns removed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
