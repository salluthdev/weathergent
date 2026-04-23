"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface HistoryItem {
  temp: number;
  condition: string;
  updated_at: string;
}

interface ForecastHistoryPopupProps {
  history: HistoryItem[];
  current: { temp: number; condition: string } | null;
  updatedAt: string | null;
  timezone: string;
  cityName: string;
}

export default function ForecastHistoryPopup({
  history,
  current,
  updatedAt,
  timezone,
  cityName,
}: ForecastHistoryPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Only consider history items that have a different temperature than the current one
  const filteredHistory =
    history?.filter((item) => {
      if (!current) return true;
      return Number(item.temp) !== Number(current.temp);
    }) || [];

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 256; // w-64

      // Position to the right of the icon
      let top = rect.top + window.scrollY - 40; // Offset upwards slightly for centered feel
      let left = rect.left + rect.width + window.scrollX + 12;

      // Flip left if no space on right
      if (left + popupWidth > window.innerWidth) {
        left = rect.left + window.scrollX - popupWidth - 12;
      }

      // Constrain top to not go off-screen at the top
      top = Math.max(window.scrollY + 20, top);

      setCoords({ top, left });
    }
  }, [isOpen]);

  // Handle outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  if (filteredHistory.length === 0) return null;

  const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

  return (
    <div className="inline-block ml-2">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-md bg-[#3d5516]/10 hover:bg-[#3d5516]/20 transition-colors text-[#3d5516] flex items-center justify-center"
        title="View Forecast History"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
            }}
            className="w-64 p-4 rounded-xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl animate-in fade-in zoom-in duration-200 origin-left"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#3d5516] opacity-60">
                Forecast Evolution
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#3d5516]/40 hover:text-[#3d5516] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Current Version */}
              <div className="p-3 rounded-lg bg-[#c8ea8e]/30 border border-[#3d5516]/10">
                <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase mb-2">
                  Current Forecast
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#3d5516]">
                      {current
                        ? `${current.temp}°C / ${toF(current.temp)}°F`
                        : "-"}
                    </span>
                    <span className="text-[10px] font-bold text-[#3d5516]/60">
                      {current?.condition || "-"}
                    </span>
                  </div>
                  {updatedAt && (
                    <div className="flex flex-col gap-0.5">
                      {/* <span className="text-[10px] font-medium text-[#3d5516]/40 leading-tight">
                        Last sync:{" "}
                        {new Date(updatedAt).toLocaleString("en-US", {
                          timeZone: timezone,
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}{" "}
                        ({cityName})
                      </span> */}
                      <span className="text-[10px] font-medium text-[#3d5516]/40 leading-tight">
                        Last sync:{" "}
                        {new Date(updatedAt).toLocaleString("en-US", {
                          timeZone: "Asia/Jakarta",
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}{" "}
                        (WIB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* History List */}
              <div className="flex flex-col gap-2">
                <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase px-1">
                  Previous Versions
                </p>
                <div className="flex flex-col gap-2 divide-y divide-[#3d5516]/5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredHistory
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <div key={idx} className="pt-2 px-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#3d5516]/70">
                            {item.temp}°C / {toF(item.temp)}°F
                          </span>
                          <span className="text-[10px] font-bold text-[#3d5516]/40">
                            {item.condition}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {/* <span className="text-[10px] font-medium text-[#3d5516]/30 leading-tight">
                            Last sync:{" "}
                            {new Date(item.updated_at).toLocaleString("en-US", {
                              timeZone: timezone,
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}{" "}
                            ({cityName})
                          </span> */}
                          <span className="text-[10px] font-medium text-[#3d5516]/30 leading-tight">
                            Last sync:{" "}
                            {new Date(item.updated_at).toLocaleString("en-US", {
                              timeZone: "Asia/Jakarta",
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}{" "}
                            (WIB)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
