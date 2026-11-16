"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { IconMenu, IconSearch, IconBell, IconPlus, IconClose } from "./Icons";
import { Invoice, Client } from "@/lib/mock-data";
import { formatFCFA, parseSearchAmount, findInvoiceCombinations, InvoiceAmountCombination } from "@/lib/money";
import { useTranslation } from "@/lib/i18n";
import GlobeLanguageSelector from "./GlobeLanguageSelector";

interface HeaderProps {
  onToggleMobile: () => void;
  onOpenNewInvoice: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  title?: string;
  subtitle?: string;
  invoices?: Invoice[];
  clients?: Client[];
  onSelectInvoice?: (inv: Invoice) => void;
  onSelectClient?: (client: Client) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: "warning" | "success" | "info" | "alert";
  invoiceId?: string;
}

export default function Header({
  onToggleMobile,
  onOpenNewInvoice,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  title = "Tableau de bord",
  subtitle,
  invoices = [],
  clients = [],
  onSelectInvoice,
  onSelectClient,
}: HeaderProps) {
  const { t } = useTranslation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Notifications générées dynamiquement depuis les vraies factures de l'utilisateur
  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    for (const inv of invoices.slice(0, 12)) {
      if (dismissedIds.includes(inv.id)) continue;
      const amt = formatFCFA(inv.netToPay || inv.totalTTC || 0);
      if (inv.status === "en_retard") {
        list.push({
          id: inv.id,
          title: "Facture en retard",
          desc: `${inv.number} · ${inv.clientName} (${amt})`,
          time: inv.dueDate,
          type: "alert",
          invoiceId: inv.id,
        });
      } else if (inv.status === "envoyee") {
        list.push({
          id: inv.id,
          title: "Facture en attente",
          desc: `${inv.number} · ${inv.clientName} (${amt})`,
          time: inv.dueDate,
          type: "warning",
          invoiceId: inv.id,
        });
      } else if (inv.status === "payee") {
        list.push({
          id: inv.id,
          title: "Facture réglée",
          desc: `${inv.number} · ${inv.clientName} (${amt})`,
          time: inv.issueDate,
          type: "success",
          invoiceId: inv.id,
        });
      }
    }
    return list.slice(0, 6);
  }, [invoices, dismissedIds]);

  const alertCount = notifications.filter((n) => n.type === "alert" || n.type === "warning").length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const queryClean = searchQuery.trim().toLowerCase();
  const queryNoSpace = queryClean.replace(/\s+/g, "");

  const parsedTargetAmount = useMemo(() => {
    return parseSearchAmount(searchQuery);
  }, [searchQuery]);

  const matchingCombinations = useMemo<InvoiceAmountCombination[]>(() => {
    if (!parsedTargetAmount) return [];
    return findInvoiceCombinations(invoices, parsedTargetAmount, 4);
  }, [invoices, parsedTargetAmount]);

  const matchingInvoices = queryClean
    ? invoices
      .filter((inv) => {
        const amounts = [
          inv.netToPay,
          inv.paidAmount,
          inv.totalTTC,
          inv.taxableHT,
          inv.subtotalHT,
        ].filter((x) => x !== undefined && x !== null && !isNaN(Number(x)) && Number(x) > 0) as number[];

        const matchesAmount = amounts.some((amt) => {
          const amtRound = Math.round(Number(amt));
          if (parsedTargetAmount && Math.abs(amtRound - parsedTargetAmount) <= 2) {
            return true;
          }
          const amtStr = String(amtRound);
          const amtFormatted = amtRound.toLocaleString("fr-FR").replace(/\s+/g, "");
          return (
            amtStr.includes(queryNoSpace) ||
            amtFormatted.includes(queryNoSpace) ||
            queryNoSpace.includes(amtStr)
          );
        });

        const matchesClient = inv.clientName.toLowerCase().includes(queryClean);
        const matchesNumber = inv.number.toLowerCase().includes(queryClean);
        const matchesCity = (inv.clientCity || "").toLowerCase().includes(queryClean);
        const matchesObject = Boolean(inv.object && inv.object.toLowerCase().includes(queryClean));
        return matchesClient || matchesAmount || matchesNumber || matchesCity || matchesObject;
      })
      .slice(0, 5)
    : [];

  const matchingClients = queryClean
    ? clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(queryClean) ||
          (c.city || "").toLowerCase().includes(queryClean) ||
          (c.contactPerson || "").toLowerCase().includes(queryClean)
      )
      .slice(0, 3)
    : [];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSearchSubmit) onSearchSubmit(searchQuery);
    setIsSearchFocused(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-[#f8f7f3]/95 backdrop-blur-md border-b border-[#e8e7e2] px-3 sm:px-6 lg:px-8 py-3 select-none w-full max-w-full">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto w-full">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl text-[#111522] hover:bg-[#edece6] transition-colors shrink-0"
            aria-label="Ouvrir le menu"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-lg sm:text-xl font-medium text-[#111522] tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[#374151] font-medium hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center: Search bar */}
        <div ref={searchRef} className="flex-1 max-w-md hidden md:block relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#374151]">
              <IconSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              placeholder={t.searchPlaceholder || "Rechercher une facture ou un client..."}
              className="w-full pl-9 pr-10 py-2 text-xs bg-white hover:bg-[#f2f0e8]/70 focus:bg-white text-[#111522] placeholder-[#4b5563] font-medium rounded-full border border-[#dcdbd4] focus:border-[#111522] focus:outline-none focus:ring-2 focus:ring-[#ffdc45]/45 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  if (onSearchSubmit) onSearchSubmit("");
                }}
                className="absolute right-2.5 p-1 rounded-full text-[#374151] hover:text-[#111522] hover:bg-[#edece6] transition"
                title="Effacer"
              >
                <IconClose className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {isSearchFocused && queryClean && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#e8e7e2] overflow-hidden z-50 animate-fade-in max-h-96 overflow-y-auto">
              <div className="p-3 bg-[#f8f7f3] border-b border-[#edece6] flex items-center justify-between text-xs">
                <span className="font-bold text-[#111522]">
                  {t.resultsFor || "Résultats pour"} &ldquo;<strong className="text-[#a18400]">{searchQuery}</strong>&rdquo;
                </span>
                <span className="text-[11px] text-[#697080] font-mono">
                  {matchingInvoices.length + matchingClients.length + (matchingCombinations.length > 0 ? 1 : 0)}
                </span>
              </div>

              {matchingInvoices.length === 0 && matchingClients.length === 0 && matchingCombinations.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#697080] space-y-1">
                  <p>{t.noResultsFound || "Aucun résultat trouvé."}</p>
                  {parsedTargetAmount && (
                    <p className="text-[11px] text-[#697080]">
                      Montant recherché : {formatFCFA(parsedTargetAmount)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Combinaisons regroupées de factures (Rapprochement intelligent) */}
                  {matchingCombinations.length > 0 && parsedTargetAmount && (
                    <div className="p-3 rounded-2xl bg-[#111522] text-white shadow-xl space-y-2.5 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#ffdc45] text-sm">⚡</span>
                          <span className="text-xs font-black text-white">
                            Regroupement de factures trouvé
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#ffdc45]/20 text-[#ffdc45] border border-[#ffdc45]/30">
                          = {formatFCFA(parsedTargetAmount)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#c4c7d1] leading-snug">
                        {matchingInvoices.length === 0
                          ? `Aucune facture unique ne fait ce montant, mais ces ${matchingCombinations[0].invoices.length} factures cumulées totalisent exactement ${formatFCFA(parsedTargetAmount)} :`
                          : `Ces factures combinées totalisent également la somme de ${formatFCFA(parsedTargetAmount)} :`}
                      </p>

                      <div className="space-y-2">
                        {matchingCombinations.map((combo, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-[#191f30] border border-white/10 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-[#c4c7d1] font-bold px-1">
                              <span className="text-[#ffdc45]">Combinaison {idx + 1} ({combo.invoices.length} factures)</span>
                              <span className="font-mono text-white font-extrabold">{formatFCFA(combo.total)}</span>
                            </div>
                            <div className="space-y-1">
                              {combo.invoices.map((inv) => (
                                <button
                                  key={inv.id}
                                  type="button"
                                  onClick={() => {
                                    onSelectInvoice?.(inv);
                                    setIsSearchFocused(false);
                                  }}
                                  className="w-full flex items-center justify-between p-2 rounded-lg bg-[#0c111d] hover:bg-[#1b253d] border border-white/10 hover:border-[#ffdc45]/50 text-left transition cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                                    <span className="font-mono font-bold text-[#ffdc45] text-xs shrink-0 group-hover:underline">
                                      {inv.number}
                                    </span>
                                    <span className="text-[#d0d3dc] truncate text-[11px]">
                                      {inv.clientName}
                                    </span>
                                  </div>
                                  <span className="font-mono font-extrabold text-white text-xs shrink-0 ml-1">
                                    {formatFCFA(inv.paidAmount || inv.netToPay || inv.totalTTC)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingInvoices.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1f2937]">
                        {t.invoicesFoundGroup || "Factures"}
                      </p>
                      <div className="space-y-1">
                        {matchingInvoices.map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            onClick={() => {
                              onSelectInvoice?.(inv);
                              setIsSearchFocused(false);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-[#f8f7f3] flex items-center justify-between text-left transition group cursor-pointer"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-[#111522] group-hover:underline decoration-[#ffdc45] decoration-2">
                                  {inv.number}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eceae3] text-[#1f2937]">
                                  {inv.clientName}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-xs text-[#111522]">
                              {formatFCFA(inv.netToPay || inv.totalTTC)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingClients.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1f2937]">
                        {t.clientsFoundGroup || "Clients"}
                      </p>
                      <div className="space-y-1">
                        {matchingClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              onSelectClient?.(c);
                              setIsSearchFocused(false);
                            }}
                            className="w-full p-2.5 rounded-xl hover:bg-[#f8f7f3] flex items-center justify-between text-left transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#fff0a6] text-[#332900] font-bold text-xs flex items-center justify-center border border-[#ffe36a]">
                                {c.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-[#111522]">{c.name}</p>
                                {c.city && <p className="text-[10px] text-[#374151] font-semibold">{c.city}</p>}
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#111522]">
                              {formatFCFA(c.totalBilled)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Langue + Notifications */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <GlobeLanguageSelector />

          <div ref={notifRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative p-2 rounded-xl transition-all duration-150 active:scale-95 ${
                isNotificationsOpen
                  ? "bg-[#111522] text-[#ffdc45] shadow-sm"
                  : "text-[#1f2937] hover:text-[#111522] hover:bg-[#edece6]"
              }`}
              title={t.notifications || "Notifications"}
            >
              <IconBell className="w-4 h-4 sm:w-5 sm:h-5" />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ffdc45] rounded-full ring-2 ring-[#111522]" />
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 bg-white rounded-3xl shadow-2xl border border-[#e8e7e2] overflow-hidden z-50 animate-scale-up">
                <div className="p-3.5 bg-[#f8f7f3] border-b border-[#edece6] flex items-center justify-between">
                  <h3 className="font-extrabold text-xs text-[#111522]">
                    {t.notifications || "Notifications"}
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDismissedIds(invoices.map((i) => i.id))}
                      className="text-[11px] text-[#374151] hover:text-[#111522] font-bold cursor-pointer"
                    >
                      {t.clearAll || "Effacer"}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#edece6] p-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#374151] font-medium">
                      {t.noNotifications || "Aucune notification."}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => {
                          const target = invoices.find((i) => i.id === notif.invoiceId);
                          if (target && onSelectInvoice) onSelectInvoice(target);
                          setIsNotificationsOpen(false);
                        }}
                        className="w-full text-left p-2.5 rounded-2xl hover:bg-[#f8f7f3] transition flex items-start gap-2.5 cursor-pointer"
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === "alert"
                            ? "bg-rose-500"
                            : notif.type === "warning"
                              ? "bg-[#ffdc45]"
                              : "bg-[#285b35]"
                            }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#111522] truncate">{notif.title}</p>
                            <span className="text-[10px] font-mono text-[#374151] font-bold shrink-0">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-[#374151] font-medium truncate mt-0.5">{notif.desc}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
