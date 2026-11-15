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
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e8e7e2] shadow-[0_12px_32px_rgba(17,21,34,0.05)] h-full flex flex-col justify-between">
      {/* Header épuré */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-[#edece6]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base sm:text-lg font-medium text-[#111522] tracking-tight">
              {t.topClients || "Principaux clients"}
            </h3>
          </div>
          <p className="text-xs text-[#374151] font-medium mt-0.5">
            {t.topClientsSubtitle || "Volume de facturation cumulé en FCFA"}
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-[#332900] bg-[#fff0a6] px-2.5 py-1 rounded-full border border-[#ffe36a] shrink-0">
          {clients.length} {t.clients || "Clients"}
        </span>
      </div>

      {/* Liste des clients ou état vide lumineux */}
      {top3.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-3 space-y-2.5">
          <div className="w-11 h-11 rounded-2xl bg-[#fff0a6] border border-[#ffe36a] flex items-center justify-center text-[#332900] text-lg">
            👥
          </div>
          <p className="text-xs font-bold text-[#111522]">
            {t.noResultsFound ? "Aucun client pour le moment" : "Aucun client enregistré"}
          </p>
          <p className="text-[11px] text-[#374151] font-medium max-w-[210px] leading-relaxed">
            Ajoutez vos clients ou créez une facture pour suivre votre portefeuille réel.
          </p>
          {onAddClient && (
            <button
              type="button"
              onClick={onAddClient}
              className="mt-1 px-4 py-2 rounded-full bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs font-bold shadow-[0_6px_16px_rgba(255,220,69,0.28)] transition active:scale-95 cursor-pointer"
            >
              + {t.newClient || "Ajouter un client"}
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-[#edece6] flex-1">
          {top3.map((client, idx) => (
            <div
              key={client.id}
              className="py-2.5 sm:py-3 flex items-center justify-between gap-3 hover:bg-[#f8f7f3] px-2 rounded-xl transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="text-lg shrink-0">{medals[idx]}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#111522] truncate group-hover:underline decoration-[#ffdc45] decoration-2 transition-colors">
                    {client.name}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-[#374151] font-bold truncate">
                    {client.city ? `${client.city} · ` : ""}
                    {client.invoicesCount} {t.invoicesCountSuffix || "factures"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-[#111522] font-mono block">
                  {formatFCFA(client.totalBilled)}
                </span>
                <span className="text-[10px] font-semibold text-[#285b35] flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#285b35]" />
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
