"use client";

import React from "react";
import { IconArrowUpRight } from "./Icons";
import { useTranslation } from "@/lib/i18n";

interface StatCardProps {
  title: string;
  amount: number;
  variation: string;
  isPositive: boolean;
  subtext: string;
  count?: number;
  type: "billed" | "paid" | "pending" | "overdue" | "clients";
  unit?: string;
  valueColor?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  amount,
  variation,
  isPositive,
  subtext,
  count,
  type,
  unit = "FCFA",
  valueColor,
  isSelected = false,
  onClick,
}: StatCardProps) {
  const { t } = useTranslation();
  const typeConfigs = {
    billed: {
      lightBg: "bg-blue-50 text-blue-600 border-blue-100/80",
      darkBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    paid: {
      lightBg: "bg-emerald-50 text-emerald-600 border-emerald-100/80",
      darkBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    pending: {
      lightBg: "bg-amber-50 text-amber-600 border-amber-100/80",
      darkBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    overdue: {
      lightBg: "bg-rose-50 text-rose-600 border-rose-100/80",
      darkBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    clients: {
      lightBg: "bg-slate-100 text-slate-700 border-slate-200",
      darkBg: "bg-slate-700/60 text-slate-200 border-slate-600",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  };

  const config = typeConfigs[type] || typeConfigs.billed;

  const resolvedValueColor = isSelected
    ? "text-white"
    : valueColor
    ? valueColor
    : type === "overdue"
    ? "text-rose-700 font-black"
    : "text-slate-900";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`group relative rounded-2xl p-3 sm:p-4 xl:p-5 border cursor-pointer select-none transition-all duration-200 active:scale-[0.96] ${
        isSelected
          ? "bg-slate-900 text-white border-slate-800 shadow-xl shadow-slate-900/20 ring-2 ring-emerald-500/30"
          : "bg-white text-slate-900 border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {/* Top Header: Title + Icon */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
        <div className="min-w-0">
          <span
            className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider block truncate ${
              isSelected ? "text-slate-400" : "text-slate-400"
            }`}
          >
            {title}
          </span>
          {count !== undefined && type !== "clients" && (
            <span
              className={`text-[9px] sm:text-[10px] font-semibold ${
                isSelected ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              {count} {t.invoicesCountSuffix || "factures"}
            </span>
          )}
        </div>

        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
            isSelected ? config.darkBg : config.lightBg
          }`}
        >
          {config.icon}
        </div>
      </div>

      {/* Main KPI Value */}
      <div className="my-1.5 sm:my-2 flex items-baseline gap-1 flex-nowrap overflow-hidden">
        <span
          className={`text-base sm:text-xl xl:text-2xl font-extrabold font-mono tracking-tight whitespace-nowrap ${resolvedValueColor}`}
        >
          {amount.toLocaleString("fr-FR")}
        </span>
        {unit && (
          <span
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
              isSelected ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Footer: Subtext */}
      <div
        className={`flex items-center justify-between pt-1.5 sm:pt-2 border-t gap-1 ${
          isSelected ? "border-slate-800" : "border-slate-100"
        }`}
      >
        <div className="flex items-center gap-1 min-w-0">
          {variation && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shrink-0 ${
                isPositive
                  ? isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : isSelected
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
              }`}
            >
              <span>{isPositive ? "↑" : "↓"}</span>
              <span>{variation}</span>
            </span>
          )}
          <span
            className={`text-[9px] sm:text-[10px] font-medium truncate ${
              isSelected ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {subtext}
          </span>
        </div>

        <div
          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? "bg-slate-800 text-emerald-400"
              : "bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600"
          }`}
        >
          <IconArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </div>
      </div>
    </div>
  );
}
