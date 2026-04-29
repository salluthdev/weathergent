"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ObservationDetailPopupProps {
  exactTime: number | null;
  syncedAt?: string | null;
  source: string;
  temp: number | null;
  preferredUnit: "C" | "F";
  historyPoints?: { 
    temp: number; 
    timestamp: number;
    exactTime?: number | null;
    syncedAt?: string | null;
  }[];
}

export default function ObservationDetailPopup({
  exactTime,
  syncedAt,
  source,
  temp,
  preferredUnit,
  historyPoints,
}: ObservationDetailPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 320; // w-80

      let top = rect.top + window.scrollY - 20;
      let left = rect.left + rect.width + window.scrollX + 8;

      if (left + popupWidth > window.innerWidth) {
        left = rect.left + window.scrollX - popupWidth - 8;
      }

      top = Math.max(window.scrollY + 10, top);
      setCoords({ top, left });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Hide icon if no metadata to show
  if (!temp && (!historyPoints || historyPoints.length === 0)) return null;

  const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

  const formatDateTime = (ts: number | string) => {
    const date = typeof ts === "number" ? new Date(ts * 1000) : new Date(ts);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="inline-block ml-2">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded-md transition-all flex items-center justify-center ${
          isOpen 
            ? "bg-[#3d5516] text-[#c8ea8e] shadow-sm" 
            : "bg-[#3d5516]/5 text-[#3d5516]/40 hover:bg-[#3d5516]/10 hover:text-[#3d5516]"
        }`}
        title="View Metadata"
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
          className="pointer-events-none"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
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
            className="w-80 p-4 rounded-xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl animate-in fade-in zoom-in duration-200 origin-left"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#3d5516] opacity-60">
                {source} Metadata
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
              <div className="p-3 rounded-lg bg-[#3d5516]/5 border border-[#3d5516]/10">
                <p className="text-[10px] font-black opacity-40 uppercase mb-1">Recorded Value</p>
                <p className="text-lg font-bold text-[#3d5516]">
                  {temp !== null ? (preferredUnit === "F" ? `${toF(temp)}°F` : `${temp}°C`) : "-"}
                </p>
              </div>

              {historyPoints && historyPoints.length > 0 && (
                <div className="flex flex-col gap-2 px-1">
                  <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase mb-1">Data Points in Range</p>
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {historyPoints.map((p, i) => (
                      <div key={i} className="flex flex-col gap-1 bg-[#3d5516]/5 p-2 rounded border border-[#3d5516]/5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-[#3d5516]/60">
                            Slot: {new Date(p.timestamp * 1000).toLocaleTimeString("en-US", {
                              timeZone: "Asia/Jakarta",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                          </span>
                          <span className="text-[#3d5516]">
                            {preferredUnit === "F" ? `${toF(p.temp)}°F` : `${p.temp}°C`}
                          </span>
                        </div>
                        {(p.exactTime || p.syncedAt) && (
                          <div className="flex flex-col gap-0.5 border-t border-[#3d5516]/10 pt-1 mt-1">
                            {p.exactTime && (
                              <div className="flex justify-between text-[9px] font-medium opacity-50">
                                <span>API:</span>
                                <span>{formatDateTime(p.exactTime)}</span>
                              </div>
                            )}
                            {p.syncedAt && (
                              <div className="flex justify-between text-[9px] font-medium opacity-50">
                                <span>Sync:</span>
                                <span>{formatDateTime(p.syncedAt)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 px-1">
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase">API Exact Time</p>
                  <p className="text-[11px] font-bold text-[#3d5516]/80 leading-tight">
                    {exactTime 
                      ? new Date(exactTime * 1000).toLocaleString("en-US", {
                          timeZone: "Asia/Jakarta",
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }) + " (WIB)"
                      : "Not available"}
                  </p>
                </div>

                {syncedAt && (
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase">Sync Timestamp</p>
                    <p className="text-[11px] font-bold text-[#3d5516]/80 leading-tight">
                      {new Date(syncedAt).toLocaleString("en-US", {
                        timeZone: "Asia/Jakarta",
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }) + " (WIB)"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
