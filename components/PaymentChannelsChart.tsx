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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e8e7e2] shadow-[0_12px_32px_rgba(17,21,34,0.05)] flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-serif text-base sm:text-lg font-medium text-[#111522]">
            Modes d'Encaissement
          </h3>
          <p className="text-[11px] text-[#697080]">
            Les 3 types de paiement autorisés
          </p>
        </div>
        <span className="text-[10px] font-bold text-[#332900] bg-[#fff0a6] px-2.5 py-0.5 rounded-full border border-[#ffe36a]">
          Actifs
        </span>
      </div>

      {/* Vertical Frequency Pillars */}
      <div className="grid grid-cols-4 gap-2 py-2 items-end h-32 border-b border-[#edece6] mb-3">
        {frequencies.map((item) => (
          <div key={item.label} className="flex flex-col items-center h-full justify-end group">
            <span className="text-[10px] font-bold text-[#111522] mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.value}
            </span>
            <div className="w-full max-w-[42px] bg-[#f8f7f3] rounded-t-xl overflow-hidden flex flex-col justify-end h-24 relative">
              <div
                style={{ height: `${item.heightPct}%` }}
                className={`w-full rounded-t-xl transition-all duration-500 ${
                  item.active
                    ? "bg-gradient-to-t from-[#111522] to-[#ffdc45] shadow-sm"
                    : "bg-gradient-to-t from-[#c6d1ff] to-[#dce6ff] group-hover:from-[#ffdc45] group-hover:to-[#ffe879]"
                }`}
              />
            </div>
            <span className="text-[10px] font-semibold text-[#697080] mt-1 truncate max-w-full">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Les 3 Types de Paiement */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#697080]">
            3 Canaux de Paiement
          </h4>
          <span className="text-[10px] text-[#697080] font-mono">Total: 9.85M FCFA</span>
        </div>

        {PAYMENT_CHANNELS.map((ch) => (
          <div
            key={ch.name}
            className="p-2.5 rounded-xl bg-[#f8f7f3] border border-[#e8e7e2] hover:bg-[#f2f0e8] transition"
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
