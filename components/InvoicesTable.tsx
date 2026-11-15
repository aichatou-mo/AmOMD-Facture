"use client";

import React, { useState } from "react";
import { Invoice, InvoiceStatus, PaymentMethodType } from "@/lib/mock-data";
import { formatFCFA, formatDateFR } from "@/lib/money";
import {
  IconSearch,
  IconEye,
  IconDownload,
  IconWhatsApp,
  IconPlus,
  IconCompress,
  IconExpand,
} from "./Icons";
import ShareInvoiceModal from "./ShareInvoiceModal";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

interface InvoicesTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onOpenNewInvoice: () => void;
  isCompactMode?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export default function InvoicesTable({
  invoices,
  onSelectInvoice,
  onOpenNewInvoice,
  isCompactMode = false,
  searchQuery = "",
  onClearSearch,
}: InvoicesTableProps) {
  const [isCompact, setIsCompact] = useState<boolean>(isCompactMode);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [shareModalInvoice, setShareModalInvoice] = useState<Invoice | null>(null);

  const effectiveSearch = (tableSearch || searchQuery || "").trim().toLowerCase();
  const searchClean = effectiveSearch.replace(/\s+/g, "");

  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter =
      selectedFilter === "all" || inv.status === selectedFilter;

    if (!effectiveSearch) return matchesFilter;

    const amountStr = String(inv.totalTTC);
    const amountFormatted = inv.totalTTC.toLocaleString("fr-FR").replace(/\s+/g, "");
    const matchesAmount =
      amountStr.includes(searchClean) ||
      amountFormatted.includes(searchClean) ||
      searchClean.includes(amountStr);

    const matchesClient = inv.clientName.toLowerCase().includes(effectiveSearch);
    const matchesCompany =
      (inv.companyName || "").toLowerCase().includes(effectiveSearch) ||
      (inv.company?.name || "").toLowerCase().includes(effectiveSearch) ||
      (inv.company?.shortName || "").toLowerCase().includes(effectiveSearch);
    const matchesNumber = inv.number.toLowerCase().includes(effectiveSearch);
    const matchesCity = (inv.clientCity || "").toLowerCase().includes(effectiveSearch);
    const matchesPayment = inv.paymentMethod.toLowerCase().includes(effectiveSearch);
    const matchesObject = (inv.object || "").toLowerCase().includes(effectiveSearch);

    return matchesFilter && (matchesClient || matchesCompany || matchesAmount || matchesNumber || matchesCity || matchesPayment || matchesObject);
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "payee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d9f0df] text-[#285b35] border border-[#b9dfc8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#337749]" />
            Payée
          </span>
        );
      case "envoyee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fff0a6] text-[#453700] border border-[#ffe36a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a18400]" />
            Envoyée
          </span>
        );
      case "en_retard":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            En retard
          </span>
        );
      case "brouillon":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edece6] text-[#5f6571] border border-[#e4e2d9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#808392]" />
            Brouillon
          </span>
        );
    }
  };

  const getInvoiceTypeBadge = (inv: Invoice) => {
    const type = inv.invoiceType || (inv.number.startsWith("AVOIR") || inv.number.startsWith("AV-") ? "avoir" : inv.number.startsWith("PRO-") ? "proforma" : "doit");
    if (type === "avoir") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#fff0a6] text-[#453700] border border-[#ffe36a]">
          <span>🔄</span> Avoir
        </span>
      );
    }
    if (type === "proforma") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#dce6ff] text-[#111522] border border-[#c6d1ff]">
          <span>📋</span> Proforma
        </span>
      );
    }
    return null;
  };

  // Les 3 types de paiement demandés
  const getPaymentBadge = (method: PaymentMethodType, detail?: string) => {
    switch (method) {
      case "Mobile Money":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#285b35] bg-[#d9f0df] border border-[#b9dfc8] w-fit">
              <span>📱</span> Mobile Money
            </span>
            {detail && <span className="text-[10px] text-[#697080] mt-0.5 truncate max-w-[120px]">{detail}</span>}
          </div>
        );
      case "Carte Bancaire":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#111522] bg-[#dce6ff] border border-[#c6d1ff] w-fit">
              <span>💳</span> Carte Bancaire
            </span>
            {detail && <span className="text-[10px] text-[#697080] mt-0.5 truncate max-w-[120px]">{detail}</span>}
          </div>
        );
      case "Carte de Crédit":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#453700] bg-[#ffedaa] border border-[#ffe36a] w-fit">
              <span>🏦</span> Carte de Crédit
            </span>
            {detail && <span className="text-[10px] text-[#697080] mt-0.5 truncate max-w-[120px]">{detail}</span>}
          </div>
        );
      default:
        return <span className="text-xs text-[#808392]">-</span>;
    }
  };

  const filterTabs = [
    { id: "all", label: "Toutes", count: invoices.length },
    { id: "payee", label: "Payées", count: invoices.filter((i) => i.status === "payee").length },
    { id: "envoyee", label: "Envoyées", count: invoices.filter((i) => i.status === "envoyee").length },
    { id: "en_retard", label: "En retard", count: invoices.filter((i) => i.status === "en_retard").length },
    { id: "brouillon", label: "Brouillons", count: invoices.filter((i) => i.status === "brouillon").length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e8e7e2] shadow-[0_8px_28px_-8px_rgba(17,21,34,0.06)] overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-[#e8e7e2] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base sm:text-lg font-medium text-[#111522] tracking-tight">
              Registre des Factures
            </h3>
            <span className="text-[11px] font-bold text-[#374151] hidden sm:inline">
              (Cliquez pour rouvrir une facture)
            </span>
          </div>
          <p className="text-xs text-[#374151] font-medium">
            Suivi des règlements Mobile Money, Carte Bancaire & Crédit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Tabs */}
          <div className="flex items-center bg-[#f2f0e8] border border-[#e8e7e2] p-0.5 rounded-xl text-xs font-semibold overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                  selectedFilter === tab.id
                    ? "bg-[#111522] text-white shadow-sm"
                    : "text-[#374151] font-bold hover:text-[#111522]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedFilter === tab.id
                      ? "bg-[#ffdc45] text-[#111522] font-black"
                      : "bg-[#e8e7e2] text-[#374151] font-bold"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick search */}
          <div className="relative min-w-[150px]">
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filtrer..."
              className="w-full pl-7 pr-3 py-1 text-xs bg-[#f8f7f3] border border-[#e4e2d9] text-[#111522] placeholder:text-[#4b5563] font-medium rounded-xl focus:bg-white focus:outline-none focus:border-[#111522]"
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-[#374151]">
              <IconSearch className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {effectiveSearch && (
        <div className="px-4 sm:px-5 py-2.5 bg-[#111522] text-white border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffdc45] animate-pulse" />
            <span className="text-[#c4c7d1]">
              Recherche : &ldquo;<strong className="text-[#ffdc45]">{effectiveSearch}</strong>&rdquo;
              {" "}&middot; <span className="font-semibold text-white">{filteredInvoices.length}</span> facture(s) trouvée(s)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setTableSearch("");
              if (onClearSearch) onClearSearch();
            }}
            className="text-[11px] font-bold text-[#ffdc45] hover:text-[#ffe879] underline cursor-pointer"
          >
            Effacer le filtre
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Table Body */}
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-[#1f2937] min-w-[760px] ${isCompact ? "text-xs" : "text-sm"}`}>
          <thead className={`uppercase font-black text-[#111522] bg-[#f0eee6] border-b border-[#e8e7e2] select-none tracking-wider ${isCompact ? "text-[9px]" : "text-[10px]"}`}>
            <tr>
              <th scope="col" className={isCompact ? "px-3 py-2" : "px-4 py-3"}>N° Facture</th>
              <th scope="col" className={isCompact ? "px-3 py-2" : "px-4 py-3"}>Client</th>
              <th scope="col" className={isCompact ? "px-3 py-2" : "px-4 py-3"}>Émission</th>
              <th scope="col" className={isCompact ? "px-3 py-2" : "px-4 py-3"}>Échéance</th>
              <th scope="col" className={`text-right ${isCompact ? "px-3 py-2" : "px-4 py-3"}`}>Montant TTC</th>
              <th scope="col" className={isCompact ? "px-3 py-2" : "px-4 py-3"}>Mode de Paiement</th>
              <th scope="col" className={`text-center ${isCompact ? "px-3 py-2" : "px-4 py-3"}`}>Statut</th>
              <th scope="col" className={`text-right ${isCompact ? "px-3 py-2" : "px-4 py-3"}`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edece6]">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#374151] font-medium">
                  <p className="text-sm">Aucune facture trouvée.</p>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="hover:bg-[#fff9db]/50 transition-colors cursor-pointer group"
                >
                  {/* Number */}
                  <td className={`whitespace-nowrap ${isCompact ? "px-3 py-2" : "px-4 py-3.5"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#111522] group-hover:text-[#0c111d] transition-colors">
                        {inv.number}
                      </span>
                      {getInvoiceTypeBadge(inv)}
                    </div>
                  </td>

                  {/* Client */}
                  <td className={isCompact ? "px-3 py-2" : "px-4 py-3.5"}>
                    <div className="font-bold text-[#111522] leading-snug truncate max-w-[180px]">
                      {inv.clientName}
                    </div>
                    <div className="text-[11px] text-[#374151] font-medium truncate max-w-[180px]">
                      {inv.clientCity} · {inv.clientPhone}
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className={`whitespace-nowrap text-[#374151] font-bold font-mono ${isCompact ? "px-3 py-2 text-[11px]" : "px-4 py-3.5 text-xs"}`}>
                    {formatDateFR(inv.issueDate)}
                  </td>

                  {/* Due Date */}
                  <td className={`whitespace-nowrap font-mono ${isCompact ? "px-3 py-2 text-[11px]" : "px-4 py-3.5 text-xs"}`}>
                    <span
                      className={
                        inv.status === "en_retard"
                          ? "text-rose-600 font-extrabold"
                          : "text-[#374151] font-bold"
                      }
                    >
                      {formatDateFR(inv.dueDate)}
                    </span>
                  </td>

                  {/* Total TTC */}
                  <td className={`whitespace-nowrap text-right ${isCompact ? "px-3 py-2" : "px-4 py-3.5"}`}>
                    <span className={`font-mono font-black text-[#111522] ${isCompact ? "text-xs" : "text-sm"}`}>
                      {formatFCFA(inv.totalTTC)}
                    </span>
                    <div className="text-[10px] text-[#374151] font-bold font-mono">
                      TVA 18%: {formatFCFA(inv.taxAmount)}
                    </div>
                  </td>

                  {/* Payment Method Badge */}
                  <td className={`whitespace-nowrap ${isCompact ? "px-3 py-2" : "px-4 py-3.5"}`}>
                    {getPaymentBadge(inv.paymentMethod, inv.paymentDetail)}
                  </td>

                  {/* Status Badge */}
                  <td className={`whitespace-nowrap text-center ${isCompact ? "px-3 py-2" : "px-4 py-3.5"}`}>
                    {getStatusBadge(inv.status)}
                  </td>

                  {/* Actions */}
                  <td
                    className={`whitespace-nowrap text-right ${isCompact ? "px-3 py-2" : "px-4 py-3.5"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        title="Rouvrir la facture"
                        className="p-1.5 rounded-lg text-[#1f2937] hover:text-[#111522] hover:bg-[#fff0a6] transition-colors active:scale-95 cursor-pointer"
                      >
                        <IconEye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => downloadInvoicePdf(inv)}
                        title="Télécharger la Facture PDF"
                        className="p-1.5 rounded-lg text-[#1f2937] hover:text-[#111522] hover:bg-[#edece6] transition-colors cursor-pointer active:scale-95"
                      >
                        <IconDownload className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setShareModalInvoice(inv)}
                        title="Partager la Facture PDF par WhatsApp"
                        className="p-1.5 rounded-lg text-[#1f2937] hover:text-[#285b35] hover:bg-[#d9f0df] transition-colors cursor-pointer active:scale-95"
                      >
                        <IconWhatsApp className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-4 py-3 bg-[#f8f7f3] border-t border-[#e8e7e2] flex items-center justify-between text-xs text-[#374151] font-medium">
        <div className="flex items-center gap-2">
          <span>
            Affichage de <strong className="text-[#111522] font-bold">{filteredInvoices.length}</strong> factures récentes
          </span>
          <span className="text-[#dcdbd4]">|</span>
          <span className="text-[11px] text-[#374151]">
            Faites défiler horizontalement pour voir toutes les colonnes
          </span>
        </div>
      </div>

      {/* Modale de partage PDF WhatsApp */}
      <ShareInvoiceModal
        isOpen={!!shareModalInvoice}
        invoice={shareModalInvoice}
        onClose={() => setShareModalInvoice(null)}
      />
    </div>
  );
}
