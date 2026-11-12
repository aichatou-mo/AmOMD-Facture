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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t.statusPaid || "Payée"}
          </span>
        );
      case "envoyee":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {t.statusDraft || "Brouillon"}
          </span>
        );
    }
  };

  const getInvoiceTypeBadge = (inv: Invoice) => {
    const type = inv.invoiceType || (inv.number.startsWith("AVOIR") || inv.number.startsWith("AV-") ? "avoir" : inv.number.startsWith("PRO-") ? "proforma" : "doit");
    if (type === "avoir") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300/70">
          <span>🔄</span> Avoir
        </span>
      );
    }
    if (type === "proforma") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-300/70">
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 w-fit">
              <span>📱</span> Mobile Money
            </span>
            {detail && (
              <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                {detail}
              </span>
            )}
          </div>
        );
      case "Carte Bancaire":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 w-fit">
              <span>💳</span> Carte Bancaire
            </span>
            {detail && (
              <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                {detail}
              </span>
            )}
          </div>
        );
      case "Carte de Crédit":
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 w-fit">
              <span>🏦</span> Carte de Crédit
            </span>
            {detail && (
              <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.invoices || "Factures"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos factures et suivez vos paiements.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start flex-wrap">
          {onOpenAIAssistant && (
            <button
              type="button"
              onClick={onOpenAIAssistant}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 active:scale-95 cursor-pointer"
              title="Générer automatiquement une facture en dictant ou écrivant à l'IA"
            >
              <span>✨</span>
              <span>Générer par IA</span>
            </button>
          )}
          <button
            onClick={onOpenNewInvoice}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/20 transition-all duration-150 active:scale-95"
          >
            <IconPlus className="w-4 h-4 text-emerald-400" />
            <span>{t.newInvoice || "Créer une facture"}</span>
          </button>
        </div>
      </div>

      {/* ── Barre recherche + filtres statut ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchInvoicesPlaceholder || "Rechercher par client ou n°..."}
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all duration-150 active:scale-95 ${isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                  }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold transition-colors ${isActive
                    ? "bg-slate-800 text-emerald-400"
                    : "bg-slate-100 text-slate-500"
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
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white shadow-xl shadow-slate-900/10 border border-slate-700/80 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ⚡ Rapprochement Intelligent de Montant
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  Montant recherché : <span className="text-emerald-400 text-sm font-extrabold">{formatFCFA(parsedTargetAmount)}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {matchingCombinations.length} combinaison(s) de 2 ou 3 factures correspondent exactement à ce versement cumulé :
              </p>
            </div>
            {activeCombinationInvoiceIds && (
              <button
                type="button"
                onClick={() => setActiveCombinationInvoiceIds(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition active:scale-95 shrink-0 self-start sm:self-auto border border-slate-700"
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
                      ? "bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500"
                      : "bg-slate-800/60 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span>Proposition {idx + 1}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-700/80 text-slate-300">
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
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/60 border border-slate-750 font-mono text-[11px]"
                      >
                        <span className="text-slate-300 font-semibold truncate max-w-[130px]" title={inv.clientName}>
                          {inv.number} <span className="text-slate-400">({inv.clientName})</span>
                        </span>
                        <span className="font-bold text-emerald-300">
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
                        ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                        : "bg-slate-700 hover:bg-slate-650 text-white border border-slate-600"
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
        <div className="px-4 py-2.5 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-between text-xs font-bold shadow-md shadow-emerald-500/10">
          <div className="flex items-center gap-2">
            <span>⚡ Rapprochement actif :</span>
            <span className="font-mono text-slate-900 font-extrabold">
              {filteredInvoices.length} factures cumulées = {formatFCFA(parsedTargetAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveCombinationInvoiceIds(null)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            ✕ Voir toutes les factures
          </button>
        </div>
      )}

      {effectiveSearch && !activeCombinationInvoiceIds && (
        <div className="px-4 py-2.5 bg-emerald-50/80 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-800">
            {t.searchFilterNotice || "Filtre"} : &ldquo;
            <strong className="text-emerald-800">{effectiveSearch}</strong>&rdquo; &middot;{" "}
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
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline"
          >
            {t.clearFilterBtn || "Effacer le filtre"}
          </button>
        </div>
      )}

      {/* ── Tableau ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-slate-500 font-semibold border-b border-slate-200 text-[11px] bg-slate-50/50 uppercase tracking-wider">
                <th className="py-4 pl-6 pr-3">N° Facture</th>
                <th className="py-4 px-3">Client</th>
                <th className="py-4 px-3">Date d&apos;émission</th>
                <th className="py-4 px-3">Échéance</th>
                <th className="py-4 px-3">Statut</th>
                <th className="py-4 px-3 text-right">Montant</th>
                <th className="py-4 pl-2 pr-6 text-right w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-4 pl-6 pr-3 font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{inv.number}</span>
                      {getInvoiceTypeBadge(inv)}
                      {activeCombinationInvoiceIds?.includes(inv.id) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ⚡ Rapprochée
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-3 font-semibold text-slate-800">{inv.clientName}</td>
                  <td className="py-4 px-3 text-slate-500 font-mono whitespace-nowrap">
                    {formatDateFR(inv.issueDate)}
                  </td>
                  <td className="py-4 px-3 text-slate-500 font-mono whitespace-nowrap">
                    {formatDateFR(inv.dueDate)}
                  </td>
                  <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelector
                      currentStatus={inv.status}
                      onUpdateStatus={(s) => onUpdateStatus?.(inv.id, s)}
                      variant="badge"
                    />
                  </td>
                  <td className="py-4 px-3 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                    {formatFCFA(inv.netToPay || inv.totalTTC)}
                  </td>
                  <td className="py-4 pl-2 pr-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleToggleMenu(e, inv)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center gap-0.5 shrink-0 transition-all duration-150 active:scale-95 ${menuAnchor?.inv.id === inv.id ? "bg-slate-900" : "hover:bg-slate-100"
                          }`}
                        title="Actions"
                        aria-label="Actions"
                      >
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className={`w-1 h-1 rounded-full ${menuAnchor?.inv.id === inv.id ? "bg-white" : "bg-slate-500"}`}
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
        <div className="block md:hidden divide-y divide-slate-100">
          {pagedInvoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => onSelectInvoice(inv)}
              className="p-4 space-y-2 active:bg-slate-50 transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-xs truncate">
                      {inv.number}
                    </span>
                    {getInvoiceTypeBadge(inv)}
                    {activeCombinationInvoiceIds?.includes(inv.id) && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ⚡ Rapprochée
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-slate-800 text-sm block truncate mt-0.5">
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center gap-0.5 shrink-0 transition-all duration-150 active:scale-95 ${menuAnchor?.inv.id === inv.id ? "bg-slate-900" : "hover:bg-slate-100"
                      }`}
                    title="Actions"
                    aria-label="Actions"
                  >
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className={`w-1 h-1 rounded-full ${menuAnchor?.inv.id === inv.id ? "bg-white" : "bg-slate-500"}`}
                      />
                    ))}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Éch. {formatDateFR(inv.dueDate)}</span>
                <span className="font-extrabold text-slate-900 text-sm">
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-xl">
                  📄
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Aucune facture enregistrée pour le moment
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Créez votre première facture en quelques secondes. Elle apparaîtra automatiquement ici et sera synchronisée sur votre compte.
                </p>
                <button
                  onClick={onOpenNewInvoice}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  <IconPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Créer une facture</span>
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                  {parsedTargetAmount > 0 && matchingCombinations.length > 0 ? "⚡" : "🔍"}
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {parsedTargetAmount > 0 && matchingCombinations.length > 0
                    ? `Aucune facture individuelle de ${formatFCFA(parsedTargetAmount)}`
                    : "Aucune facture ne correspond à ces critères"}
                </h4>
                {parsedTargetAmount > 0 && matchingCombinations.length > 0 && (
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Réinitialiser les filtres
                </button>
              </>
            )}
          </div>
        )}

        {/* Pagination inspirée d'Image 2 (Items per page: 10 | 1 - 10 of N | < >) */}
        {filteredInvoices.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            {/* Lignes par page */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-500">Lignes par page :</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-sm cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Plage affichée & Flèches de navigation */}
            <div className="flex items-center gap-4 self-end sm:self-auto">
              <div className="font-medium text-slate-600">
                <span className="font-mono font-bold text-slate-900">
                  {(safePage - 1) * pageSize + 1} – {Math.min(safePage * pageSize, filteredInvoices.length)}
                </span>
                {" "}sur{" "}
                <span className="font-mono font-bold text-slate-900">{filteredInvoices.length}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Bouton Précédent */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="w-8 h-8 rounded-xl border border-slate-200/90 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 active:scale-90 shadow-sm cursor-pointer"
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
                  className="w-8 h-8 rounded-xl border border-slate-200/90 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 active:scale-90 shadow-sm cursor-pointer"
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
          className="min-w-[170px] bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-4px_rgba(15,23,42,0.18)] overflow-hidden animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              onSelectInvoice(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left"
          >
            <IconEye className="w-4 h-4 text-slate-400" />
            Voir le détail
          </button>
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              onEditInvoice(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
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
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50/70 transition text-left cursor-pointer"
          >
            <IconWhatsApp className="w-4 h-4 text-emerald-600" />
            Partager PDF WhatsApp
          </button>
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              downloadInvoicePdf(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
          >
            <IconDownload className="w-4 h-4 text-slate-500" />
            Télécharger PDF
          </button>
          <div className="h-px bg-slate-100 mx-3" />
          <button
            onClick={() => {
              const inv = menuAnchor.inv;
              setMenuAnchor(null);
              setInvoiceToDelete(inv);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
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
