"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <footer
      className={`w-full py-12 transition-colors duration-500 ${
        isHome ? "bg-background" : "bg-background"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-black text-[#3d5516] tracking-tighter">
            WEATHERGENT
          </h2>
          <div className="text-[10px] font-bold text-[#3d5516]/30 uppercase tracking-[0.2em] mt-1">
            Settlement Intelligence
          </div>
        </div>
      </div>
    </footer>
  );
}
