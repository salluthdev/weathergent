import * as dotenv from "dotenv";
import path from "path";
import { Client } from "pg";

// Load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function cleanup() {
  console.log("Cleaning up non-30-minute Jakarta records...");
  
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

    // Delete Jakarta records where timestamp_gmt is not a multiple of 1800 (30 mins)
    // timestamp_gmt is seconds since epoch
    const result = await client.query(`
      DELETE FROM weather_records 
      WHERE city_name = 'jakarta' 
      AND (timestamp_gmt % 1800) != 0;
    `);
    
    console.log(`Cleanup completed. Non-30-minute Jakarta records deleted: ${result.rowCount}`);
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    await client.end();
  }
}

cleanup();
