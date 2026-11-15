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
      lightBg: "bg-[#dce6ff] text-[#273c75] border-[#c6d1ff]",
      darkBg: "bg-[#ffdc45]/20 text-[#ffdc45] border-[#ffdc45]/30",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    paid: {
      lightBg: "bg-[#d9f0df] text-[#285b35] border-[#c5e4cb]",
      darkBg: "bg-[#ffdc45]/20 text-[#ffdc45] border-[#ffdc45]/30",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    pending: {
      lightBg: "bg-[#ffedaa] text-[#3b3210] border-[#ffe36a]",
      darkBg: "bg-[#ffdc45]/20 text-[#ffdc45] border-[#ffdc45]/30",
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
      lightBg: "bg-rose-50 text-rose-600 border-rose-200/70",
      darkBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      icon: (
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    clients: {
      lightBg: "bg-[#f0d9ed] text-[#704266] border-[#e6cbe1]",
      darkBg: "bg-[#ffdc45]/20 text-[#ffdc45] border-[#ffdc45]/30",
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
    ? "text-[#ffdc45]"
    : valueColor
    ? valueColor
    : type === "overdue"
    ? "text-rose-700 font-black"
    : "text-[#111522]";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`group relative rounded-2xl p-3 sm:p-4 xl:p-5 border cursor-pointer select-none transition-all duration-200 active:scale-[0.96] ${
        isSelected
          ? "bg-[#111522] text-white border-[#111522] shadow-xl shadow-[#111522]/25 ring-2 ring-[#ffdc45]/60"
          : "bg-white text-[#111522] border-[#e8e7e2] shadow-[0_6px_22px_-4px_rgba(17,21,34,0.05)] hover:border-[#ffdc45] hover:shadow-md"
      }`}
    >
      {/* Top Header: Title + Icon */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5 sm:mb-2">
        <div className="min-w-0">
          <span
            className={`text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider block truncate ${
              isSelected ? "text-[#e5e6ea]" : "text-[#1f2937]"
            }`}
          >
            {title}
          </span>
          {count !== undefined && type !== "clients" && (
            <span
              className={`text-[9px] sm:text-[10px] font-bold ${
                isSelected ? "text-[#ffdc45]" : "text-[#374151]"
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
          className={`text-base sm:text-xl xl:text-2xl font-black font-mono tracking-tight whitespace-nowrap ${resolvedValueColor}`}
        >
          {amount.toLocaleString("fr-FR")}
        </span>
        {unit && (
          <span
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
              isSelected ? "text-[#ffdc45]" : "text-[#374151]"
            }`}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Footer: Subtext */}
      <div
        className={`flex items-center justify-between pt-1.5 sm:pt-2 border-t gap-1 ${
          isSelected ? "border-white/10" : "border-[#edece6]"
        }`}
      >
        <div className="flex items-center gap-1 min-w-0">
          {variation && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shrink-0 ${
                isPositive
                  ? isSelected
                    ? "bg-[#ffdc45]/20 text-[#ffdc45] border border-[#ffdc45]/30"
                    : "bg-[#fff0a6] text-[#453700] border border-[#ffe36a]"
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
            className={`text-[9px] sm:text-[10px] font-semibold truncate ${
              isSelected ? "text-[#d0d3dc]" : "text-[#374151]"
            }`}
          >
            {subtext}
          </span>
        </div>

        <div
          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? "bg-[#191f30] text-[#ffdc45]"
              : "bg-[#f8f7f3] text-[#374151] group-hover:bg-[#111522] group-hover:text-[#ffdc45]"
          }`}
        >
          <IconArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </div>
      </div>
    </div>
  );
}
