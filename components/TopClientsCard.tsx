"use client";

import React from "react";
import { Client } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/money";
import { useTranslation } from "@/lib/i18n";

interface TopClientsCardProps {
  clients?: Client[];
  onAddClient?: () => void;
}

export default function TopClientsCard({ clients = [], onAddClient }: TopClientsCardProps) {
  const { t } = useTranslation();

  const top3 = [...clients]
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 3);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/70 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.04)] h-full flex flex-col justify-between">
      {/* Header épuré */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              {t.topClients || "Principaux clients"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.topClientsSubtitle || "Volume de facturation cumulé en FCFA"}
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 shrink-0">
          {clients.length} {t.clients || "Clients"}
        </span>
      </div>

      {/* Liste des clients ou état vide lumineux */}
      {top3.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-3 space-y-2.5">
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-400 text-lg">
            👥
          </div>
          <p className="text-xs font-bold text-slate-700">
            {t.noResultsFound ? "Aucun client pour le moment" : "Aucun client enregistré"}
          </p>
          <p className="text-[11px] text-slate-400 max-w-[210px] leading-relaxed">
            Ajoutez vos clients ou créez une facture pour suivre votre portefeuille réel.
          </p>
          {onAddClient && (
            <button
              type="button"
              onClick={onAddClient}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95"
            >
              + {t.newClient || "Ajouter un client"}
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 flex-1">
          {top3.map((client, idx) => (
            <div
              key={client.id}
              className="py-2.5 sm:py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="text-lg shrink-0">{medals[idx]}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                    {client.name}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                    {client.city ? `${client.city} · ` : ""}
                    {client.invoicesCount} {t.invoicesCountSuffix || "factures"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-slate-900 font-mono block">
                  {formatFCFA(client.totalBilled)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t.inGoodStanding || "Actif"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
