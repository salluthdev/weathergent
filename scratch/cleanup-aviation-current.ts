import * as dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

// Load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function cleanup() {
  console.log("Starting cleanup of leaked Aviation Current data...");
  
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

    // Define 'now' in GMT
    const nowGmt = Math.floor(Date.now() / 1000);

    // Nullify current aviation columns for all rows that are already in the past.
    // We only keep 'Current' data for the row that is currently active.
    // This cleans up the data that leaked into multiple rows earlier.
    const result = await client.query(`
      UPDATE weather_records 
      SET 
        temp_c_aviation_current = NULL,
        aviation_current_exact_time = NULL,
        aviation_current_synced_at = NULL,
        history_aviation_current = '[]'
      WHERE 
        (timestamp_gmt + 1800 <= $1 AND city_name != 'jakarta') OR
        (timestamp_gmt + 600 <= $1 AND city_name = 'jakarta');
    `, [nowGmt]);
    
    console.log(`Cleanup completed. Rows updated: ${result.rowCount}`);
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    await client.end();
  }
}

cleanup();
