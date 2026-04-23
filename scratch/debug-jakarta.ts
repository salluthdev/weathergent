import { createClient } from "@supabase/supabase-js";
import { CITIES } from "../lib/config";

const API_KEY = "e1f10a1e78da46f5b10a1e78da96f525";

async function debugJakarta() {
  const city = CITIES.find(c => c.slug === "jakarta");
  if (!city) return;
  
  const targetDate = "20260423";
  const url = `https://api.weather.com/v1/location/${city.station}/observations/historical.json?apiKey=${API_KEY}&units=m&startDate=${targetDate}&endDate=${targetDate}`;
  
  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  const data = await res.json();
  
  const obs = data.observations || [];
  console.log(`Total observations: ${obs.length}`);
  
  const targetGmt = 1776925800; // 1:30 PM WIB
  console.log(`Target GMT: ${targetGmt}`);
  
  obs.forEach((o: any) => {
    const diff = Math.abs(o.valid_time_gmt - targetGmt);
    if (diff < 3600) {
      console.log(`Obs: ${o.valid_time_gmt} (Diff: ${diff}s), Temp: ${o.temp}`);
    }
  });
}

debugJakarta();
