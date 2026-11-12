"use client";

import React from "react";
import { STATUS_DISTRIBUTION } from "@/lib/mock-data";

export default function StatusDonutChart() {
  const total = STATUS_DISTRIBUTION.reduce((acc, curr) => acc + curr.count, 0);

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Répartition par Statut
          </h3>
          <p className="text-xs text-slate-400">
            État de recouvrement du portefeuille
          </p>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
            <circle cx="5" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* SVG Donut Circle (FreshCart style) */}
      <div className="flex items-center justify-center my-4 relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {STATUS_DISTRIBUTION.map((item) => {
            const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
            accumulatedPercent += item.percentage;

            return (
              <circle
                key={item.status}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 hover:opacity-80"
              />
            );
          })}
        </svg>

        {/* Center Total Count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-900 font-mono-numbers">
            {total}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Factures
          </span>
        </div>
      </div>

      {/* Status Badges List */}
      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
        {STATUS_DISTRIBUTION.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs font-semibold text-slate-700">
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 font-mono">
                {item.count}
              </span>
              <span className="text-[10px] text-slate-400">
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
