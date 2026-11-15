"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Invoice, InvoiceStatus, PaymentMethodType } from "@/lib/mock-data";
import { formatFCFA, formatDateFR } from "@/lib/money";
import {
  IconSearch,
  IconEye,
  IconPlus,
  IconTrash,
  IconDownload,
  IconWhatsApp,
  IconListView,
  IconGalleryView,
} from "./Icons";
import StatusSelector from "./StatusSelector";
import ConfirmDialog from "./ConfirmDialog";
import ShareInvoiceModal from "./ShareInvoiceModal";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { useTranslation } from "@/lib/i18n";

interface InvoicesListPageProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onOpenNewInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus?: (id: string, newStatus: InvoiceStatus) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onOpenAIAssistant?: () => void;
}

export default function InvoicesListPage({
  invoices,
  onSelectInvoice,
  onOpenNewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onUpdateStatus,
  searchQuery = "",
  onClearSearch,
  onOpenAIAssistant,
}: InvoicesListPageProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [shareModalInvoice, setShareModalInvoice] = useState<Invoice | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ inv: Invoice; top: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fermer le menu au clic extérieur, scroll ou resize
  useEffect(() => {
    if (!menuAnchor) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAnchor(null);
      }
    };
    const handleClose = () => setMenuAnchor(null);
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [menuAnchor]);

  const effectiveSearch = (tableSearch || searchQuery || "").trim().toLowerCase();
  const searchClean = effectiveSearch.replace(/\s+/g, "");

  // Rapprochement intelligent : Détection d'un montant saisi (ex: 700 000 ou 1 200 000 FCFA)
  const [activeCombinationInvoiceIds, setActiveCombinationInvoiceIds] = useState<string[] | null>(null);

  const numericOnly = effectiveSearch.replace(/[^0-9]/g, "");
  const parsedTargetAmount = numericOnly.length >= 4 ? parseInt(numericOnly, 10) : 0;

  // Calcul dynamique des combinaisons de 2 ou 3 factures dont la somme égale exactement ce montant
  const matchingCombinations = useMemo(() => {
    if (!parsedTargetAmount || parsedTargetAmount <= 0) return [];

    const pool = invoices
      .map((inv) => ({
        inv,
        amount: inv.netToPay || inv.totalTTC || 0,
      }))
      .filter((x) => x.amount > 0);

    const results: { invoices: Invoice[]; total: number }[] = [];
    const n = pool.length;

    // 1. Paires (2 factures qui totalisent exactement le montant)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (pool[i].amount + pool[j].amount === parsedTargetAmount) {
          results.push({
            invoices: [pool[i].inv, pool[j].inv],
            total: parsedTargetAmount,
          });
          if (results.length >= 4) return results;
        }
      }
    }

    // 2. Triplets (3 factures qui totalisent exactement le montant)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          if (pool[i].amount + pool[j].amount + pool[k].amount === parsedTargetAmount) {
            results.push({
              invoices: [pool[i].inv, pool[j].inv, pool[k].inv],
              total: parsedTargetAmount,
            });
            if (results.length >= 4) return results;
          }
        }
      }
    }

    return results;
  }, [invoices, parsedTargetAmount]);

  const filteredInvoices = useMemo(() => {
    // Si un rapprochement par combinaison spécifique est actif
    if (activeCombinationInvoiceIds && activeCombinationInvoiceIds.length > 0) {
      return invoices.filter((inv) => activeCombinationInvoiceIds.includes(inv.id));
    }

    return invoices.filter((inv) => {
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
  }, [invoices, selectedFilter, effectiveSearch, searchClean, activeCombinationInvoiceIds]);

  // Pagination dynamique par page (défaut 10)
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedInvoices = filteredInvoices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "payee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d9f0df] text-[#285b35] border border-[#b9dfc8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#337749]" />
            {t.statusPaid || "Payée"}
          </span>
        );
      case "envoyee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fff0a6] text-[#453700] border border-[#ffe36a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a18400]" />
            {t.statusSent || "Envoyée"}
          </span>
        );
      case "en_retard":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {t.statusOverdue || "En retard"}
          </span>
        );
      case "brouillon":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#edece6] text-[#5f6571] border border-[#e4e2d9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#808392]" />
            {t.statusDraft || "Brouillon"}
          </span>
        );
    }
  };

  const getInvoiceTypeBadge = (inv: Invoice) => {
    const type = inv.invoiceType || (inv.number.startsWith("AVOIR") || inv.number.startsWith("AV-") ? "avoir" : inv.number.startsWith("PRO-") ? "proforma" : "doit");
    if (type === "avoir") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff0a6] text-[#453700] border border-[#ffe36a]">
          <span>🔄</span> Avoir
        </span>
      );
    }
    if (type === "proforma") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dce6ff] text-[#111522] border border-[#c6d1ff]">
          <span>📋</span> Proforma
        </span>
      );
    }
    return null;
  };

  const getPaymentBadge = (method: PaymentMethodType, detail?: string) => {
    switch (method) {
      case "Mobile Money":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#285b35] bg-[#d9f0df] border border-[#b9dfc8] w-fit">
              <span>📱</span> Mobile Money
            </span>
            {detail && (
              <span className="text-[10px] text-[#697080] mt-0.5 truncate max-w-[130px]">
                {detail}
              </span>
            )}
          </div>
        );
      case "Carte Bancaire":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#111522] bg-[#dce6ff] border border-[#c6d1ff] w-fit">
              <span>💳</span> Carte Bancaire
            </span>
            {detail && (
              <span className="text-[10px] text-[#697080] mt-0.5 truncate max-w-[130px]">
                {detail}
              </span>
            )}
          </div>
        );
      case "Carte de Crédit":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-[#453700] bg-[#ffedaa] border border-[#ffe36a] w-fit">
              <span>🏦</span> Carte de Crédit
            </span>
            {detail && (
              <span className="text-[10px] text-[#697080] mt-0.5 truncate max-w-[130px]">
                {detail}
              </span>
            )}
          </div>
        );
    }
  };

  const statusFilters = [
    { id: "all", label: t.allTab || "Toutes" },
    { id: "brouillon", label: t.draftsTab || "Brouillons" },
    { id: "envoyee", label: t.sentTab || "Envoyées" },
    { id: "payee", label: t.paidTab || "Payées" },
    { id: "en_retard", label: t.overdueTab || "En retard" },
  ];

  const getFilterCount = (filterId: string) => {
    if (filterId === "all") return invoices.length;
    return invoices.filter((inv) => inv.status === filterId).length;
  };

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>, inv: Invoice) => {
    e.stopPropagation();
    if (menuAnchor?.inv.id === inv.id) {
      setMenuAnchor(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuHeight = 125;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = pagedInvoices.length > 2 && spaceBelow < 120 && rect.top > 140;
      const calculatedTop = openUp ? rect.top - menuHeight - 6 : rect.bottom + 6;
      const safeTop = Math.max(10, Math.min(calculatedTop, window.innerHeight - menuHeight - 10));
      const safeRight = Math.max(10, window.innerWidth - rect.right);

      setMenuAnchor({ inv, top: safeTop, right: safeRight });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* ── En-tête : titre + bouton Créer une facture ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#111522] tracking-tight">
            {t.invoices || "Factures"}
          </h1>
          <p className="text-xs text-[#374151] font-medium mt-1">
            Gérez vos factures et suivez vos paiements.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          {onOpenAIAssistant && (
            <button
              type="button"
              onClick={onOpenAIAssistant}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] border border-[#111522] text-xs sm:text-sm font-bold shadow-md shadow-[#111522]/15 transition-all duration-150 active:scale-95 cursor-pointer"
              title="Générer automatiquement une facture en dictant ou écrivant à l'IA"
            >
              <span>✨</span>
              <span>Générer par IA</span>
            </button>
          )}
          <button
            onClick={onOpenNewInvoice}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs sm:text-sm font-bold shadow-md shadow-[#ffdc45]/20 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <IconPlus className="w-4 h-4 text-[#111522]" />
            <span>{t.newInvoice || "Créer une facture"}</span>
          </button>
        </div>
      </div>

      {/* ── Barre recherche + filtres statut ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#374151]" />
          <input
            type="text"
            placeholder={t.searchInvoicesPlaceholder || "Rechercher par client ou n°..."}
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#dcdbd4] rounded-xl text-xs font-medium text-[#111522] placeholder-[#4b5563] focus:outline-none focus:border-[#111522] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {statusFilters.map((f) => {
            const isActive = selectedFilter === f.id;
            const count = getFilterCount(f.id);
            return (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFilter(f.id);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${isActive
                  ? "bg-[#111522] text-white border-[#111522] shadow-md shadow-[#111522]/15"
                  : "bg-white text-[#374151] font-bold border-[#e8e7e2] hover:border-[#111522]/30 hover:text-[#111522]"
                  }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold transition-colors ${isActive
                    ? "bg-[#ffdc45] text-[#111522]"
                    : "bg-[#edece6] text-[#374151]"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BANNIÈRE DE RAPPROCHEMENT INTELLIGENT DE MONTANT CUMULÉ ── */}
      {parsedTargetAmount > 0 && matchingCombinations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#111522] text-white shadow-xl shadow-[#111522]/15 border border-white/10 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#ffdc45]/15 text-[#ffdc45] border border-[#ffdc45]/30">
                  ⚡ Rapprochement Intelligent de Montant
                </span>
                <span className="text-xs font-mono font-bold text-[#c4c7d1]">
                  Montant recherché : <span className="text-[#ffdc45] text-sm font-extrabold">{formatFCFA(parsedTargetAmount)}</span>
                </span>
              </div>
              <p className="text-xs text-[#b9bdc9] mt-1 leading-relaxed">
                {matchingCombinations.length} combinaison(s) de 2 ou 3 factures correspondent exactement à ce versement cumulé :
              </p>
            </div>
            {activeCombinationInvoiceIds && (
              <button
                type="button"
                onClick={() => setActiveCombinationInvoiceIds(null)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#ffdc45] text-xs font-bold transition active:scale-95 shrink-0 self-start sm:self-auto border border-white/15 cursor-pointer"
              >
                ✕ Afficher toutes les factures
              </button>
            )}
          </div>

          {/* Grille des combinaisons proposées */}
          <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchingCombinations.map((combo, idx) => {
              const isSelected =
                activeCombinationInvoiceIds &&
                activeCombinationInvoiceIds.length === combo.invoices.length &&
                combo.invoices.every((i) => activeCombinationInvoiceIds.includes(i.id));

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition ${
                    isSelected
                      ? "bg-[#141a2b] border-[#ffdc45] shadow-md ring-1 ring-[#ffdc45]"
                      : "bg-[#141a2b]/75 border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-[#ffdc45] font-bold flex items-center gap-1.5">
                      <span>Proposition {idx + 1}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-[#c4c7d1]">
                        {combo.invoices.length} factures
                      </span>
                    </span>
                    <span className="font-mono text-xs font-extrabold text-white">
                      = {formatFCFA(combo.total)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {combo.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#0c111d] border border-white/10 font-mono text-[11px]"
                      >
                        <span className="text-[#c4c7d1] font-semibold truncate max-w-[130px]" title={inv.clientName}>
                          {inv.number} <span className="text-[#858b9a]">({inv.clientName})</span>
                        </span>
                        <span className="font-bold text-[#ffdc45]">
                          {formatFCFA(inv.netToPay || inv.totalTTC)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setActiveCombinationInvoiceIds(null);
                      } else {
                        setActiveCombinationInvoiceIds(combo.invoices.map((i) => i.id));
                        setCurrentPage(1);
                      }
                    }}
                    className={`w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-extrabold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#ffdc45] text-[#111522] font-black shadow-xs"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                    }`}
                  >
                    <span>{isSelected ? "✓ Rapprochement affiché ci-dessous" : `🔍 Filtrer sur ces ${combo.invoices.length} factures`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pillule quand un rapprochement est actif */}
      {activeCombinationInvoiceIds && (
        <div className="px-4 py-2.5 bg-[#ffdc45] text-[#111522] rounded-xl flex items-center justify-between text-xs font-bold shadow-md shadow-[#111522]/10">
          <div className="flex items-center gap-2">
            <span>⚡ Rapprochement actif :</span>
            <span className="font-mono text-[#111522] font-extrabold">
              {filteredInvoices.length} factures cumulées = {formatFCFA(parsedTargetAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveCombinationInvoiceIds(null)}
            className="px-2.5 py-1 rounded-lg bg-[#111522] text-[#ffdc45] text-[11px] font-bold hover:bg-[#191f30] transition cursor-pointer"
          >
            ✕ Voir toutes les factures
          </button>
        </div>
      )}

      {effectiveSearch && !activeCombinationInvoiceIds && (
        <div className="px-4 py-2.5 bg-[#fff9db] border border-[#ffe36a] rounded-xl flex items-center justify-between text-xs">
          <span className="text-[#111522]">
            {t.searchFilterNotice || "Filtre"} : &ldquo;
            <strong className="text-[#111522] font-bold">{effectiveSearch}</strong>&rdquo; &middot;{" "}
            <span className="font-semibold">{filteredInvoices.length}</span> facture(s)
          </span>
          <button
            type="button"
            onClick={() => {
              setTableSearch("");
              setActiveCombinationInvoiceIds(null);
              setCurrentPage(1);
              if (onClearSearch) onClearSearch();
            }}
            className="text-[11px] font-bold text-[#111522] hover:opacity-75 underline cursor-pointer"
          >
            {t.clearFilterBtn || "Effacer le filtre"}
          </button>
        </div>
      )}

      {/* ── Tableau ── */}
      <div className="bg-white rounded-2xl border border-[#e8e7e2] shadow-[0_8px_28px_-8px_rgba(17,21,34,0.06)]">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-[#111522] font-black border-b border-[#e8e7e2] text-[11px] bg-[#f0eee6] uppercase tracking-wider">
                <th className="py-4 pl-6 pr-3">N° Facture</th>
                <th className="py-4 px-3">Client</th>
                <th className="py-4 px-3">Date d&apos;émission</th>
                <th className="py-4 px-3">Échéance</th>
                <th className="py-4 px-3">Statut</th>
                <th className="py-4 px-3 text-right">Montant</th>
                <th className="py-4 pl-2 pr-6 text-right w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edece6]">
              {pagedInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="hover:bg-[#fff9db]/45 transition cursor-pointer group"
                >
                  <td className="py-4 pl-6 pr-3 font-mono font-bold text-[#111522] group-hover:text-[#0c111d] transition whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{inv.number}</span>
                      {getInvoiceTypeBadge(inv)}
                      {activeCombinationInvoiceIds?.includes(inv.id) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fff0a6] text-[#453700] border border-[#ffe36a]">
                          ⚡ Rapprochée
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-3 font-bold text-[#111522]">{inv.clientName}</td>
                  <td className="py-4 px-3 text-[#374151] font-bold font-mono whitespace-nowrap">
                    {formatDateFR(inv.issueDate)}
                  </td>
                  <td className="py-4 px-3 text-[#374151] font-bold font-mono whitespace-nowrap">
                    {formatDateFR(inv.dueDate)}
                  </td>
                  <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelector
                      currentStatus={inv.status}
                      onUpdateStatus={(s) => onUpdateStatus?.(inv.id, s)}
                      variant="badge"
                    />
                  </td>
                  <td className="py-4 px-3 text-right font-mono font-extrabold text-[#111522] whitespace-nowrap">
                    {formatFCFA(inv.netToPay || inv.totalTTC)}
                  </td>
                  <td className="py-4 pl-2 pr-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleToggleMenu(e, inv)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center gap-0.5 shrink-0 transition-all duration-150 active:scale-95 ${menuAnchor?.inv.id === inv.id ? "bg-[#111522]" : "hover:bg-[#f2f0e8]"
                          }`}
                        title="Actions"
                        aria-label="Actions"
                      >
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className={`w-1 h-1 rounded-full ${menuAnchor?.inv.id === inv.id ? "bg-[#ffdc45]" : "bg-[#5f6571]"}`}
                          />
                        ))}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile 360px */}
        <div className="block md:hidden divide-y divide-[#edece6]">
          {pagedInvoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => onSelectInvoice(inv)}
              className="p-4 space-y-2 active:bg-[#f8f7f3] transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-[#111522] text-xs truncate">
                      {inv.number}
                    </span>
                    {getInvoiceTypeBadge(inv)}
                    {activeCombinationInvoiceIds?.includes(inv.id) && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fff0a6] text-[#453700] border border-[#ffe36a]">
                        ⚡ Rapprochée
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-[#111522] text-sm block truncate mt-0.5">
                    {inv.clientName}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <StatusSelector
                    currentStatus={inv.status}
                    onUpdateStatus={(s) => onUpdateStatus?.(inv.id, s)}
                    variant="badge"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleToggleMenu(e, inv)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center gap-0.5 shrink-0 transition-all duration-150 active:scale-95 ${menuAnchor?.inv.id === inv.id ? "bg-[#111522]" : "hover:bg-[#f2f0e8]"
                      }`}
                    title="Actions"
                    aria-label="Actions"
                  >
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className={`w-1 h-1 rounded-full ${menuAnchor?.inv.id === inv.id ? "bg-[#ffdc45]" : "bg-[#5f6571]"}`}
                      />
                    ))}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#374151] font-bold font-mono">
                <span>Éch. {formatDateFR(inv.dueDate)}</span>
                <span className="font-black text-[#111522] text-sm">
                  {formatFCFA(inv.netToPay || inv.totalTTC)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center space-y-3">
            {invoices.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#fff0a6] text-[#111522] border border-[#ffe36a] flex items-center justify-center mx-auto text-xl">
                  📄
                </div>
                <h4 className="font-serif font-medium text-[#111522] text-base">
                  Aucune facture enregistrée pour le moment
                </h4>
                <p className="text-xs text-[#374151] font-medium max-w-sm mx-auto">
                  Créez votre première facture en quelques secondes. Elle apparaîtra automatiquement ici et sera synchronisée sur votre compte.
                </p>
                <button
                  onClick={onOpenNewInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <IconPlus className="w-3.5 h-3.5 text-[#111522]" />
                  <span>Créer une facture</span>
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-[#f2f0e8] text-[#374151] flex items-center justify-center mx-auto text-xl">
                  {parsedTargetAmount > 0 && matchingCombinations.length > 0 ? "⚡" : "🔍"}
                </div>
                <h4 className="font-bold text-[#111522] text-sm">
                  {parsedTargetAmount > 0 && matchingCombinations.length > 0
                    ? `Aucune facture individuelle de ${formatFCFA(parsedTargetAmount)}`
                    : "Aucune facture ne correspond à ces critères"}
                </h4>
                {parsedTargetAmount > 0 && matchingCombinations.length > 0 && (
                  <p className="text-xs text-[#374151] font-medium max-w-sm mx-auto">
                    Consultez les combinaisons de 2 ou 3 factures proposées dans la bannière ci-dessus pour rapprocher ce montant cumulé.
                  </p>
                )}
                <button
                  onClick={() => {
                    setSelectedFilter("all");
                    setTableSearch("");
                    setActiveCombinationInvoiceIds(null);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              </>
            )}
          </div>
        )}

        {/* Pagination inspirée d'Image 2 (Items per page: 10 | 1 - 10 of N | < >) */}
        {filteredInvoices.length > 0 && (
          <div className="px-5 py-3.5 border-t border-[#e8e7e2] bg-[#f8f7f3]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#374151] font-medium">
            {/* Lignes par page */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#111522]">Lignes par page :</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#dcdbd4] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#111522] focus:outline-none focus:border-[#111522] transition shadow-sm cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Plage affichée & Flèches de navigation */}
            <div className="flex items-center gap-4 self-end sm:self-auto">
              <div className="font-medium text-[#5f6571]">
                <span className="font-mono font-bold text-[#111522]">
                  {(safePage - 1) * pageSize + 1} – {Math.min(safePage * pageSize, filteredInvoices.length)}
                </span>
                {" "}sur{" "}
                <span className="font-mono font-bold text-[#111522]">{filteredInvoices.length}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Bouton Précédent */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="w-8 h-8 rounded-xl border border-[#e4e2d9] bg-white flex items-center justify-center text-[#111522] hover:bg-[#111522] hover:text-[#ffdc45] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 active:scale-90 shadow-sm cursor-pointer"
                  aria-label="Précédent"
                  title="Précédent"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Bouton Suivant */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  className="w-8 h-8 rounded-xl border border-[#e4e2d9] bg-white flex items-center justify-center text-[#111522] hover:bg-[#111522] hover:text-[#ffdc45] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 active:scale-90 shadow-sm cursor-pointer"
                  aria-label="Suivant"
                  title="Suivant"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation de suppression */}
      <ConfirmDialog
        isOpen={!!invoiceToDelete}
        title="Supprimer la facture ?"
        message="Voulez-vous vraiment supprimer cette facture ?"
        confirmLabel="Oui, supprimer"
        cancelLabel="Conserver"
        isDestructive={true}
        onConfirm={() => {
          if (invoiceToDelete) {
            onDeleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }
        }}
        onCancel={() => setInvoiceToDelete(null)}
      />

      {/* Menu dropdown flottant via Portal (garantit qu'il ne sera JAMAIS coupé par le tableau ou un overflow) */}
      {mounted && menuAnchor && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: `${menuAnchor.top}px`,
            right: `${menuAnchor.right}px`,
            zIndex: 99999,
          }}
          className="min-w-[180px] bg-white rounded-2xl border border-[#e8e7e2] shadow-[0_14px_40px_-4px_rgba(17,21,34,0.22)] overflow-hidden animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              onSelectInvoice(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#111522] hover:bg-[#f8f7f3] transition text-left cursor-pointer"
          >
            <IconEye className="w-4 h-4 text-[#697080]" />
            Voir le détail
          </button>
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              onEditInvoice(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#111522] hover:bg-[#f8f7f3] transition text-left cursor-pointer"
          >
            <span className="text-base leading-none">✏️</span>
            Modifier
          </button>
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              setShareModalInvoice(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#285b35] hover:bg-[#d9f0df]/50 transition text-left cursor-pointer"
          >
            <IconWhatsApp className="w-4 h-4 text-[#337749]" />
            Partager PDF WhatsApp
          </button>
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              downloadInvoicePdf(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-[#111522] hover:bg-[#f8f7f3] transition text-left cursor-pointer"
          >
            <IconDownload className="w-4 h-4 text-[#697080]" />
            Télécharger PDF
          </button>
          <div className="h-px bg-[#edece6] mx-3" />
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              setInvoiceToDelete(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
          >
            <IconTrash className="w-4 h-4" />
            Supprimer
          </button>
        </div>,
        document.body
      )}

      {/* Modale de partage PDF WhatsApp */}
      <ShareInvoiceModal
        isOpen={!!shareModalInvoice}
        invoice={shareModalInvoice}
        onClose={() => setShareModalInvoice(null)}
      />
    </div>
  );
}
