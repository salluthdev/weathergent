"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function DateFilter({ initialDate }: { initialDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value.replace(/-/g, "");
    const params = new URLSearchParams(searchParams);
    params.set("date", date);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Convert YYYYMMDD to YYYY-MM-DD for input
  const formatForInput = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return "";
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md border border-white/20 p-2 pl-4 rounded-xl shadow-sm">
      <span className="text-sm font-bold text-[#3d5516]/60 uppercase tracking-wider">Date context</span>
      <input
        type="date"
        defaultValue={formatForInput(initialDate)}
        onChange={handleDateChange}
        className="bg-transparent border-none focus:ring-0 text-[#3d5516] font-bold text-sm cursor-pointer"
      />
    </div>
  );
}
