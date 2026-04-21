import Image from "next/image";
import Link from "next/link";
import { CITIES } from "@/lib/config";

function getDynamicPolymarketUrl(polySlug: string, timezone: string) {
  const now = new Date().toLocaleString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  // Format: highest-temperature-in-[polySlug]-on-[month]-[day]-[year]
  // Example: highest-temperature-in-london-on-april-22-2026
  const parts = now.replace(",", "").split(" ");
  const month = parts[0].toLowerCase();
  const day = parts[1];
  const year = parts[2];
  
  return `https://polymarket.com/event/highest-temperature-in-${polySlug}-on-${month}-${day}-${year}`;
}

export default function Home() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 min-h-screen bg-[#f8faf4]">
      <div className="flex items-center justify-between px-4">
        <h1 className="text-3xl font-black text-[#3d5516] tracking-tight">
          WEATHERGENT
        </h1>
        <div className="text-sm font-bold text-[#3d5516]/40 uppercase tracking-widest">
          Settlement Intelligence
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
        {CITIES.map((city) => (
          <div 
            key={city.slug}
            className="p-6 rounded-2xl bg-white border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(61,85,22,0.1)] hover:border-[#3d5516]/10 transition-all duration-300 flex justify-between items-center gap-6 group"
          >
            <Link href={`/city/${city.slug}`} className="flex flex-col flex-1">
              <p className="font-bold text-xl text-[#3d5516] group-hover:text-[#3d5516] transition-colors">
                {city.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8ea8e]"></span>
                <p className="text-xs font-bold text-[#3d5516]/40 uppercase tracking-wider">
                  {city.station} Station
                </p>
              </div>
            </Link>
            
            <div className="flex items-center">
              <Link
                href={getDynamicPolymarketUrl(city.polySlug, city.timezone)}
                target="_blank"
                className="p-3 rounded-xl bg-[#f0f4e8] hover:bg-[#c8ea8e]/40 transition-all duration-300 shadow-sm hover:scale-105 active:scale-95"
                title="View on Polymarket"
              >
                <Image
                  src={"/img/polymarket.webp"}
                  width={24}
                  height={24}
                  alt="Polymarket"
                  className="rounded-sm grayscale hover:grayscale-0 transition-all duration-300"
                />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
