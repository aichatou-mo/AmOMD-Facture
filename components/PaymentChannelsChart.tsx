"use client";

import React from "react";
import { PAYMENT_CHANNELS } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/money";

export default function PaymentChannelsChart() {
  const frequencies = [
    { label: "Journalier", heightPct: 40, value: "1.8M" },
    { label: "Hebdo", heightPct: 90, value: "4.5M", active: true },
    { label: "Bi-mensuel", heightPct: 65, value: "2.3M" },
    { label: "Mensuel", heightPct: 35, value: "1.2M" },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Modes d'Encaissement
          </h3>
          <p className="text-[11px] text-slate-400">
            Les 3 types de paiement autorisés
          </p>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          Actifs
        </span>
      </div>

      {/* Vertical Frequency Pillars */}
      <div className="grid grid-cols-4 gap-2 py-2 items-end h-32 border-b border-slate-100 mb-3">
        {frequencies.map((item) => (
          <div key={item.label} className="flex flex-col items-center h-full justify-end group">
            <span className="text-[10px] font-bold text-slate-700 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.value}
            </span>
            <div className="w-full max-w-[42px] bg-slate-50 rounded-t-xl overflow-hidden flex flex-col justify-end h-24 relative">
              <div
                style={{ height: `${item.heightPct}%` }}
                className={`w-full rounded-t-xl transition-all duration-500 ${
                  item.active
                    ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm"
                    : "bg-gradient-to-t from-emerald-200 to-emerald-100 group-hover:from-emerald-300"
                }`}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1 truncate max-w-full">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Les 3 Types de Paiement Exigés par l'Utilisateur */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            3 Canaux de Paiement
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">Total: 9.85M FCFA</span>
        </div>

        {PAYMENT_CHANNELS.map((ch) => (
          <div
            key={ch.name}
            className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ch.color }}
                />
                <div>
                  <span className="font-bold text-slate-900 block leading-tight">
                    {ch.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {ch.sublabel}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block text-xs">
                  {formatFCFA(ch.amount)}
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.2 rounded-full"
                  style={{
                    backgroundColor: `${ch.color}15`,
                    color: ch.color,
                  }}
                >
                  {ch.percentage}% des flux
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${ch.percentage}%`,
                  backgroundColor: ch.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
