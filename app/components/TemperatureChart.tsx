"use client";

import { useState } from "react";

interface TemperatureChartProps {
  data: any[]; // Now receiving hourlyReport
  minTemp: number | null;
  maxTemp: number | null;
  timezone: string;
  preferredUnit: string;
}

export default function TemperatureChart({
  data,
  minTemp,
  maxTemp,
  timezone,
  preferredUnit,
}: TemperatureChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  if (!data || data.length === 0 || minTemp === null || maxTemp === null) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-[#3d5516]/40 italic">
        No data available for chart
      </div>
    );
  }

  // Calculate chart boundaries
  const chartMin = Math.floor(minTemp) - 1;
  const chartMax = Math.ceil(maxTemp) + 1;
  const range = chartMax - chartMin || 1;

  const toF = (c: number) => parseFloat(((c * 9) / 5 + 32).toFixed(1));
  const formatTemp = (c: number) => {
    const val = preferredUnit === "F" ? toF(c) : parseFloat(c.toFixed(1));
    return `${val}${preferredUnit === "F" ? "°F" : "°C"}`;
  };

  // Generate Y-axis ticks
  const yTicks = [0, 1, 2, 3].map((i) => {
    const val = chartMax - (i * range) / 3;
    return {
      label: formatTemp(val),
      y: (i / 3) * 160 + 20,
    };
  });

  // Data points with valid history
  const validPoints = data
    .map((item, i) => {
      if (!item.wuHistory) return null;
      return {
        item: item.wuHistory,
        timestamp: item.timestamp,
        index: i,
        x: (i / (data.length - 1)) * 1000,
        y: 180 - ((item.wuHistory.temp - chartMin) / range) * 160,
      };
    })
    .filter((p): p is any => p !== null);

  // X-axis ticks (always 24 hours)
  const xTicks = [0, 6, 12, 18, 23].map((hour) => {
    // 48 slots in total, 2 slots per hour
    const slotIdx = hour * 2;
    return {
      label: `${hour.toString().padStart(2, "0")}:00`,
      x: (slotIdx / (data.length - 1)) * 1000,
    };
  });

  return (
    <div className="relative w-full group">
      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-10 p-2 rounded-lg bg-[#3d5516] text-[#c8ea8e] text-[10px] font-bold shadow-xl pointer-events-none transition-all duration-200"
          style={{
            left: `${(hoveredPoint.index / (data.length - 1)) * 100}%`,
            top: `${hoveredPoint.y - 40}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="whitespace-nowrap">
            {new Date(hoveredPoint.timestamp * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: timezone,
              hour12: false,
            })}
          </div>
          <div className="text-sm">{formatTemp(hoveredPoint.item.temp)}</div>
        </div>
      )}

      <div className="flex gap-2">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between h-64 pb-8 pt-2 text-[9px] font-black text-[#3d5516]/40 text-right w-10">
          {yTicks.map((tick, i) => (
            <span key={i}>{tick.label}</span>
          ))}
        </div>

        <div className="flex-1">
          <div className="h-64 w-full relative">
            <svg
              viewBox="0 0 1000 200"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3d5516" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3d5516" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {yTicks.map((tick, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={tick.y}
                  x2="1000"
                  y2={tick.y}
                  stroke="#3d5516"
                  strokeOpacity="0.05"
                />
              ))}

              {/* Data Area & Line */}
              {validPoints.length > 0 && (
                <>
                  <path
                    d={`M ${validPoints.map((p) => `${p.x},${p.y}`).join(" L ")} L ${validPoints[validPoints.length - 1].x},200 L ${validPoints[0].x},200 Z`}
                    fill="url(#chartGradient)"
                  />
                  <path
                    d={`M ${validPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`}
                    fill="none"
                    stroke="#3d5516"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Vertical Indicator on Hover */}
              {hoveredPoint && (
                <line
                  x1={(hoveredPoint.index / (data.length - 1)) * 1000}
                  y1="0"
                  x2={(hoveredPoint.index / (data.length - 1)) * 1000}
                  y2="200"
                  stroke="#3d5516"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  className="opacity-20"
                />
              )}

              {/* Invisible Hover Hotspots (Only for points with data) */}
              {validPoints.map((p, i) => (
                <rect
                  key={i}
                  x={p.x - 1000 / data.length / 2}
                  y="0"
                  width={1000 / data.length}
                  height="200"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer"
                />
              ))}
            </svg>
          </div>

          {/* X-Axis Labels */}
          <div className="flex justify-between mt-2 px-0 text-[9px] font-black text-[#3d5516]/40 uppercase tracking-tighter">
            {xTicks.map((tick, i) => (
              <span key={i}>{tick.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
