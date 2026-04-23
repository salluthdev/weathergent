"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ObservationDetailPopupProps {
  exactTime: number | null;
  syncedAt: string | null;
  source: string;
  temp: number | null;
  preferredUnit: "C" | "F";
}

export default function ObservationDetailPopup({
  exactTime,
  syncedAt,
  source,
  temp,
  preferredUnit,
}: ObservationDetailPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!isPinned) setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) setIsOpen(false);
  };

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPinned(!isPinned);
    setIsOpen(true);
  };

  useEffect(() => {
    if (isOpen && triggerRef.current) {
// ... (rest of the positioning effect)
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
        setIsPinned(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!temp) return null;

  const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

  return (
    <div className="inline-block ml-2">
      <button
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={togglePin}
        className={`p-1 rounded-md transition-all flex items-center justify-center ${
          isPinned || isOpen 
            ? "bg-[#3d5516] text-[#c8ea8e] shadow-sm" 
            : "bg-[#3d5516]/5 text-[#3d5516]/40 hover:bg-[#3d5516]/10 hover:text-[#3d5516]"
        }`}
        title={isPinned ? "Click to Unpin" : "Hover to preview, Click to pin"}
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
            className="w-64 p-4 rounded-xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl animate-in fade-in zoom-in duration-200 origin-left"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#3d5516] opacity-60">
                {source} Metadata
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsPinned(false);
                }}
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
                <p className="text-[10px] font-black opacity-40 uppercase mb-2">Recorded Value</p>
                <p className="text-lg font-bold text-[#3d5516]">
                  {preferredUnit === "F" ? `${toF(temp)}°F` : `${temp}°C`}
                </p>
              </div>

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

                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase">Sync Timestamp</p>
                  <p className="text-[11px] font-bold text-[#3d5516]/80 leading-tight">
                    {syncedAt 
                      ? new Date(syncedAt).toLocaleString("en-US", {
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
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
