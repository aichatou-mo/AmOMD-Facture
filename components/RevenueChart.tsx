"use client";

import React, { useState, useMemo } from "react";
import { Invoice } from "@/lib/mock-data";
import { formatFCFA, formatShortFCFA } from "@/lib/money";
import { useTranslation } from "@/lib/i18n";

interface TrendPoint {
  label: string;
  billed: number;
  collected: number;
  isCurrent?: boolean;
}

interface RevenueChartProps {
  invoices?: Invoice[];
}

const MONTHLY_DATA: TrendPoint[] = [
  { label: "Jan", billed: 3200000, collected: 2800000 },
  { label: "Fév", billed: 4100000, collected: 3900000 },
  { label: "Mar", billed: 5800000, collected: 5100000 },
  { label: "Avr", billed: 6200000, collected: 5900000 },
  { label: "Mai", billed: 7900000, collected: 7200000 },
  { label: "Juin", billed: 8500000, collected: 8100000 },
  { label: "Juil", billed: 9200000, collected: 8700000 },
  { label: "Août", billed: 10400000, collected: 9800000 },
  { label: "Sept", billed: 11100000, collected: 10200000 },
  { label: "Oct", billed: 13500000, collected: 12450000, isCurrent: true },
  { label: "Nov", billed: 12000000, collected: 11300000 },
  { label: "Déc", billed: 14000000, collected: 13100000 },
];

const QUARTERLY_DATA: TrendPoint[] = [
  { label: "T1 (Jan-Mar)", billed: 13100000, collected: 11800000 },
  { label: "T2 (Avr-Juin)", billed: 22600000, collected: 21200000 },
  { label: "T3 (Juil-Sept)", billed: 30700000, collected: 28700000 },
  { label: "T4 (Oct-Déc)", billed: 39500000, collected: 36850000, isCurrent: true },
];

const YEARLY_DATA: TrendPoint[] = [
  { label: "2022", billed: 45000000, collected: 39000000 },
  { label: "2023", billed: 68000000, collected: 62000000 },
  { label: "2024", billed: 94000000, collected: 88500000 },
  { label: "2025", billed: 125000000, collected: 118000000 },
  { label: "2026", billed: 148000000, collected: 138500000, isCurrent: true },
];

export default function RevenueChart({ invoices }: RevenueChartProps) {
  const { t, lang } = useTranslation();
  const [activeRange, setActiveRange] = useState<"mois" | "trim" | "annee">("mois");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const monthsLabels = lang === "en"
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    : ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

  const quartersLabels = lang === "en"
    ? ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"]
    : ["T1 (Jan-Mar)", "T2 (Avr-Juin)", "T3 (Juil-Sept)", "T4 (Oct-Déc)"];

  const rawData: TrendPoint[] = useMemo(() => {
    if (!invoices) {
      return activeRange === "mois"
        ? MONTHLY_DATA.map((d, i) => ({ ...d, label: monthsLabels[i] || d.label }))
        : activeRange === "trim"
          ? QUARTERLY_DATA.map((d, i) => ({ ...d, label: quartersLabels[i] || d.label }))
          : YEARLY_DATA;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (activeRange === "mois") {
      const buckets: TrendPoint[] = monthsLabels.map((lbl) => ({
        label: lbl,
        billed: 0,
        collected: 0,
      }));
      for (const inv of invoices) {
        const dt = new Date(inv.issueDate);
        const yr = Number.isNaN(dt.getTime()) ? currentYear : dt.getFullYear();
        const m = Number.isNaN(dt.getTime()) ? currentMonth : dt.getMonth();
        if (yr === currentYear && buckets[m]) {
          const amt = inv.netToPay || inv.totalTTC || 0;
          buckets[m].billed += amt;
          if (inv.status === "payee") {
            buckets[m].collected += inv.paidAmount || amt;
          }
        }
      }
      let activeIdx = currentMonth;
      if (buckets[currentMonth]?.billed === 0) {
        for (let i = 11; i >= 0; i--) {
          if (buckets[i].billed > 0) {
            activeIdx = i;
            break;
          }
        }
      }
      if (buckets[activeIdx]) buckets[activeIdx].isCurrent = true;
      return buckets;
    }

    if (activeRange === "trim") {
      const buckets: TrendPoint[] = quartersLabels.map((lbl) => ({
        label: lbl,
        billed: 0,
        collected: 0,
      }));
      for (const inv of invoices) {
        const dt = new Date(inv.issueDate);
        const yr = Number.isNaN(dt.getTime()) ? currentYear : dt.getFullYear();
        const m = Number.isNaN(dt.getTime()) ? currentMonth : dt.getMonth();
        const q = Math.floor(m / 3);
        if (yr === currentYear && buckets[q]) {
          const amt = inv.netToPay || inv.totalTTC || 0;
          buckets[q].billed += amt;
          if (inv.status === "payee") {
            buckets[q].collected += inv.paidAmount || amt;
          }
        }
      }
      const currentQ = Math.floor(currentMonth / 3);
      let activeIdx = currentQ;
      if (buckets[currentQ]?.billed === 0) {
        for (let i = 3; i >= 0; i--) {
          if (buckets[i].billed > 0) {
            activeIdx = i;
            break;
          }
        }
      }
      if (buckets[activeIdx]) buckets[activeIdx].isCurrent = true;
      return buckets;
    }

    const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
    const buckets: TrendPoint[] = years.map((yr) => ({
      label: String(yr),
      billed: 0,
      collected: 0,
      isCurrent: yr === currentYear,
    }));
    for (const inv of invoices) {
      const dt = new Date(inv.issueDate);
      const yr = Number.isNaN(dt.getTime()) ? currentYear : dt.getFullYear();
      const idx = years.indexOf(yr);
      if (idx !== -1) {
        const amt = inv.netToPay || inv.totalTTC || 0;
        buckets[idx].billed += amt;
        if (inv.status === "payee") {
          buckets[idx].collected += inv.paidAmount || amt;
        }
      }
    }
    return buckets;
  }, [invoices, activeRange, monthsLabels, quartersLabels]);

  // Maximum value calculation with 15% headroom
  const maxDataVal = Math.max(0, ...rawData.map((d) => Math.max(d.billed, d.collected)));
  const maxVal = Math.max(1000000, Math.ceil((maxDataVal * 1.15) / 1000000) * 1000000);

  const width = 640;
  const height = 230;
  const paddingX = 46;
  const paddingY = 28;

  // Calculate points for the curves
  const points = rawData.map((item, index) => {
    const x =
      rawData.length === 1
        ? width / 2
        : paddingX + (index / (rawData.length - 1)) * (width - 2 * paddingX);
    const yBilled = height - paddingY - (item.billed / maxVal) * (height - 2 * paddingY);
    const yCollected = height - paddingY - (item.collected / maxVal) * (height - 2 * paddingY);
    return { ...item, x, yBilled, yCollected };
  });

  const createSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const collectedPoints = points.map((p) => ({ x: p.x, y: p.yCollected }));
  const billedPoints = points.map((p) => ({ x: p.x, y: p.yBilled }));

  const collectedPath = createSmoothPath(collectedPoints);
  const billedPath = createSmoothPath(billedPoints);
  const areaPath = `${collectedPath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const activeHover =
    hoveredIndex !== null && points[hoveredIndex]
      ? points[hoveredIndex]
      : points.find((p) => p.isCurrent) || points[points.length - 1];

  const gridSteps = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e7e2] shadow-[0_12px_32px_rgba(17,21,34,0.05)] overflow-hidden">
      {/* Header Row: Titre & Sélecteur Responsive (Mois / Trimestre / Année) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base sm:text-lg font-medium text-[#111522] truncate">
            {t.revenueEvolution || "Évolution du Chiffre d'Affaires"}
          </h3>
          <span className="inline-flex text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff0a6] text-[#332900] border border-[#ffe36a]">
            {t.realTime || "Temps réel"}
          </span>
        </div>

        {/* Sélecteur de Plage Temporelle : Pleine visibilité mobile avec contraste Bleu Nuit */}
        <div className="inline-flex bg-[#edece6] p-1 rounded-xl text-xs font-bold text-[#1f2937] self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
          {[
            { id: "mois", label: t.month || "Mois" },
            { id: "trim", label: t.quarter || "Trimestre" },
            { id: "annee", label: t.year || "Année" },
          ].map((r) => {
            const isSelected = activeRange === r.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setActiveRange(r.id as any);
                  setHoveredIndex(null);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-150 active:scale-95 cursor-pointer ${isSelected
                  ? "bg-[#111522] text-[#ffdc45] shadow-sm ring-1 ring-[#ffdc45]/40"
                  : "text-[#1f2937] hover:text-[#111522] hover:bg-white/70"
                  }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount Display & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-[#edece6]">
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-[#111522] font-mono tracking-tight whitespace-nowrap">
            {formatFCFA(activeHover.collected)}
          </span>
          <span className="inline-flex items-center text-[11px] font-bold text-[#285b35] bg-[#d9f0df] px-2 py-0.5 rounded-full">
            ↗ +18.4%
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-[#111522]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffdc45] border border-[#a18400] shadow-sm" />
            {t.collected || "Encaissé"}
          </span>
          <span className="flex items-center gap-1.5 text-[#374151]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#111522]/60" />
            {t.billed || "Facturé"}
          </span>
        </div>
      </div>

      {/* SVG Line / Wave Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="revenueGoldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffdc45" stopOpacity="0.38" />
              <stop offset="95%" stopColor="#ffdc45" stopOpacity="0.0" />
            </linearGradient>
            <filter id="revenueSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#111522" floodOpacity="0.20" />
            </filter>
          </defs>

          {/* Horizontal Grid lines */}
          {gridSteps.map((val) => {
            const y = height - paddingY - (val / maxVal) * (height - 2 * paddingY);
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#edece6"
                  strokeWidth="1"
                  strokeDasharray={val === 0 ? "none" : "3 3"}
                />
                <text
                  x={paddingX - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#697080"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                >
                  {formatShortFCFA(val)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#revenueGoldGradient)" />

          {/* Billed line */}
          <path
            d={billedPath}
            fill="none"
            stroke="#c6d1ff"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* Collected line */}
          <path
            d={collectedPath}
            fill="none"
            stroke="#111522"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#revenueSoftGlow)"
          />

          {/* Vertical indicator line on hover */}
          {activeHover && (
            <line
              x1={activeHover.x}
              y1={paddingY}
              x2={activeHover.x}
              y2={height - paddingY}
              stroke="#a18400"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.65"
            />
          )}

          {/* Interactive points */}
          {points.map((p, idx) => {
            const isHovered = activeHover.x === p.x;
            return (
              <g
                key={p.label}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => setHoveredIndex(idx)}
              >
                <circle
                  cx={p.x}
                  cy={p.yCollected}
                  r={isHovered ? "6" : "3.8"}
                  fill={isHovered ? "#ffdc45" : "#FFFFFF"}
                  stroke="#111522"
                  strokeWidth={isHovered ? "2.5" : "1.8"}
                />
                <rect
                  x={p.x - 20}
                  y={paddingY}
                  width={40}
                  height={height - 2 * paddingY}
                  fill="transparent"
                />
              </g>
            );
          })}

          {/* Tooltip Node */}
          {activeHover && (
            <g transform={`translate(${activeHover.x}, ${Math.max(paddingY + 8, activeHover.yCollected - 26)})`}>
              <rect
                x="-64"
                y="-12"
                width="128"
                height="24"
                rx="12"
                fill="#111522"
                filter="drop-shadow(0 4px 8px rgba(17,21,34,0.35))"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="#ffdc45"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono"
              >
                {formatFCFA(activeHover.collected)}
              </text>
            </g>
          )}

          {/* Period Labels along the bottom */}
          {points.map((p) => {
            const isSelected = activeHover.x === p.x;
            return (
              <text
                key={p.label}
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                fill={isSelected ? "#111522" : "#697080"}
                fontWeight={isSelected ? "800" : "500"}
                fontSize={activeRange === "trim" ? "9" : "10"}
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
