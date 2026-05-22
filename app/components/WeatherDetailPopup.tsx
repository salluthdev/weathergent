"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface WeatherDetail {
  feelsLike?: number | null;
  precipChance?: number | null;
  qpf?: number | null;
  precip?: number | null;
  cloudCover?: number | string | null;
  dewPoint?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  windDirection?: string | null;
  pressure?: number | null;
}

interface HistoryEntry {
  detail?: WeatherDetail | null;
  temp?: number | null;
  condition?: string | null;
  updated_at?: string | null;
  syncedAt?: string | null;
  exactTime?: number | null;
}

interface WeatherDetailPopupProps {
  detail: WeatherDetail | null | undefined;
  history?: HistoryEntry[];
  variant: "forecast" | "history";
  preferredUnit: "C" | "F";
}

const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));

const fmtTemp = (v: number | null | undefined, unit: "C" | "F") => {
  if (v === null || v === undefined) return "-";
  return unit === "F" ? `${toF(v)}°F` : `${v}°C`;
};

const fmtPct = (v: number | null | undefined) =>
  v === null || v === undefined ? "-" : `${v}%`;
const fmtMm = (v: number | null | undefined) =>
  v === null || v === undefined ? "-" : `${v} mm`;
const fmtCloud = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "number") return `${v}%`;
  return String(v);
};
const fmtWind = (
  speed: number | null | undefined,
  dir: string | null | undefined,
) => {
  if (speed === null || speed === undefined) return dir || "-";
  return `${speed} km/h${dir ? ` ${dir}` : ""}`;
};
const fmtPressure = (v: number | null | undefined) =>
  v === null || v === undefined ? "-" : `${v} mb`;

export default function WeatherDetailPopup({
  detail,
  history,
  variant,
  preferredUnit,
}: WeatherDetailPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 288;

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

  const filteredHistory = (history || []).filter((h) => h && h.detail);

  if (!detail && filteredHistory.length === 0) return null;

  const renderRows = (d: WeatherDetail) => (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
      <Row label="Feels Like" value={fmtTemp(d.feelsLike, preferredUnit)} />
      {variant === "forecast" ? (
        <>
          <Row label="Precip Chance" value={fmtPct(d.precipChance)} />
          <Row label="Amount" value={fmtMm(d.qpf)} />
        </>
      ) : (
        <Row label="Precip" value={fmtMm(d.precip)} />
      )}
      <Row label="Cloud Cover" value={fmtCloud(d.cloudCover)} />
      <Row label="Dew Point" value={fmtTemp(d.dewPoint, preferredUnit)} />
      <Row label="Humidity" value={fmtPct(d.humidity)} />
      <Row label="Wind" value={fmtWind(d.windSpeed, d.windDirection)} />
      <Row label="Pressure" value={fmtPressure(d.pressure)} />
    </div>
  );

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
        title={
          variant === "forecast"
            ? "View Forecast Detail"
            : "View Observation Detail"
        }
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
            className="w-72 p-4 rounded-xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl animate-in fade-in zoom-in duration-200 origin-left"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#3d5516] opacity-60">
                {variant === "forecast"
                  ? "Forecast Detail"
                  : "Observation Detail"}
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
              <div className="p-3 rounded-lg bg-[#c8ea8e]/30 border border-[#3d5516]/10">
                <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase mb-2">
                  Current
                </p>
                {detail ? (
                  renderRows(detail)
                ) : (
                  <p className="text-[11px] text-[#3d5516]/40 italic">
                    No detail recorded
                  </p>
                )}
              </div>

              {filteredHistory.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] font-bold text-[#3d5516]/40 uppercase px-1">
                    Previous Versions
                  </p>
                  <div className="flex flex-col gap-2 divide-y divide-[#3d5516]/5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredHistory
                      .slice()
                      .reverse()
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="pt-2 px-1 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#3d5516]/60">
                              {item.condition || "-"}
                            </span>
                            <span className="text-[10px] font-bold text-[#3d5516]/40">
                              {item.updated_at
                                ? new Date(item.updated_at).toLocaleString(
                                    "en-US",
                                    {
                                      timeZone: "Asia/Jakarta",
                                      month: "short",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    },
                                  )
                                : item.syncedAt
                                ? new Date(item.syncedAt).toLocaleString(
                                    "en-US",
                                    {
                                      timeZone: "Asia/Jakarta",
                                      month: "short",
                                      day: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: false,
                                    },
                                  )
                                : ""}
                            </span>
                          </div>
                          {item.detail && renderRows(item.detail)}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-bold text-[#3d5516]/40 uppercase">
        {label}
      </span>
      <span className="font-bold text-[#3d5516]/80">{value}</span>
    </div>
  );
}
