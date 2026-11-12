"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Invoice } from "@/lib/mock-data";

export interface DateRangePickerProps {
  startDate: string; // Format YYYY-MM-DD
  endDate: string;   // Format YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  onClear: () => void;
  invoices?: Invoice[];
  className?: string;
}

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const DAYS_SHORT_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${padZero(m + 1)}-${padZero(d)}`;
}

function formatFR(iso: string, short = false): string {
  if (!iso) return "";
  const parts = iso.slice(0, 10).split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return iso;
  const mName = MONTHS_FR[m - 1] || "";
  if (short) {
    const shortM = mName.slice(0, 4);
    return `${padZero(d)} ${shortM}`;
  }
  return `${padZero(d)} ${mName.toLowerCase()} ${y}`;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  onClear,
  invoices = [],
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Valeurs temporaires dans le sélecteur avant validation
  const [tempStart, setTempStart] = useState<string>(startDate || "");
  const [tempEnd, setTempEnd] = useState<string>(endDate || "");
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Mois et Année affichés dans le calendrier (navigation libre)
  const initialDate = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; right: number; isMobile: boolean }>({
    top: 0,
    right: 0,
    isMobile: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronisation avec les props
  useEffect(() => {
    setTempStart(startDate || "");
    setTempEnd(endDate || "");
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getFullYear())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [startDate, endDate]);

  // Recalcul de la position du Popover
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const right = Math.max(12, window.innerWidth - rect.right);
    const top = rect.bottom + 8;
    setPopoverPos({ top, right, isMobile });
  };

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setTempStart(startDate || "");
      setTempEnd(endDate || "");
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Fermeture lors du clic extérieur ou redimensionnement
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (window.innerWidth < 640) return; // Sur mobile, c'est une modale centrée
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Carte des jours avec factures dans la base de données
  const invoiceDateCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of invoices) {
      if (inv.issueDate) {
        const key = inv.issueDate.slice(0, 10);
        map[key] = (map[key] || 0) + 1;
      }
    }
    return map;
  }, [invoices]);

  // Calcul du nombre de factures correspondant à la sélection temporaire
  const matchingInvoiceCount = useMemo(() => {
    if (!tempStart && !tempEnd) return invoices.length;
    return invoices.filter((inv) => {
      const d = inv.issueDate?.slice(0, 10) || "";
      if (!d) return true;
      if (tempStart && tempEnd) return d >= tempStart && d <= tempEnd;
      if (tempStart) return d >= tempStart;
      if (tempEnd) return d <= tempEnd;
      return true;
    }).length;
  }, [invoices, tempStart, tempEnd]);

  // Navigation dans le calendrier
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Clic sur un jour du calendrier
  const handleDayClick = (dayStr: string) => {
    // Si aucune date ou si les deux sont déjà choisies -> redémarrer une sélection
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(dayStr);
      setTempEnd("");
    } else if (tempStart && !tempEnd) {
      // Deuxième clic : fin de plage
      if (dayStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(dayStr);
      } else {
        setTempEnd(dayStr);
      }
    }
  };

  // Raccourcis de périodes (Presets)
  const applyPreset = (preset: "all" | "today" | "yesterday" | "7days" | "month" | "prev_month" | "year") => {
    const now = new Date();
    const todayStr = toISODate(now.getFullYear(), now.getMonth(), now.getDate());

    if (preset === "all") {
      setTempStart("");
      setTempEnd("");
      onChange("", "");
      setIsOpen(false);
      return;
    }

    if (preset === "today") {
      setTempStart(todayStr);
      setTempEnd(todayStr);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      onChange(todayStr, todayStr);
      setIsOpen(false);
      return;
    }

    if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toISODate(y.getFullYear(), y.getMonth(), y.getDate());
      setTempStart(yStr);
      setTempEnd(yStr);
      setViewYear(y.getFullYear());
      setViewMonth(y.getMonth());
      onChange(yStr, yStr);
      setIsOpen(false);
      return;
    }

    if (preset === "7days") {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      const pastStr = toISODate(past.getFullYear(), past.getMonth(), past.getDate());
      setTempStart(pastStr);
      setTempEnd(todayStr);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      onChange(pastStr, todayStr);
      setIsOpen(false);
      return;
    }

    if (preset === "month") {
      const startOfMonth = toISODate(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const endOfMonth = toISODate(now.getFullYear(), now.getMonth(), lastDay);
      setTempStart(startOfMonth);
      setTempEnd(endOfMonth);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      onChange(startOfMonth, endOfMonth);
      setIsOpen(false);
      return;
    }

    if (preset === "prev_month") {
      const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const startOfPrev = toISODate(prevY, prevM, 1);
      const lastDayPrev = new Date(prevY, prevM + 1, 0).getDate();
      const endOfPrev = toISODate(prevY, prevM, lastDayPrev);
      setTempStart(startOfPrev);
      setTempEnd(endOfPrev);
      setViewYear(prevY);
      setViewMonth(prevM);
      onChange(startOfPrev, endOfPrev);
      setIsOpen(false);
      return;
    }

    if (preset === "year") {
      const startOfYear = `${now.getFullYear()}-01-01`;
      const endOfYear = `${now.getFullYear()}-12-31`;
      setTempStart(startOfYear);
      setTempEnd(endOfYear);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
      onChange(startOfYear, endOfYear);
      setIsOpen(false);
      return;
    }
  };

  const handleApply = () => {
    // Si l'utilisateur n'a cliqué qu'un jour, c'est ce jour précis
    const finalStart = tempStart;
    const finalEnd = tempEnd || tempStart;
    onChange(finalStart, finalEnd);
    setIsOpen(false);
  };

  const handleClearAndClose = () => {
    setTempStart("");
    setTempEnd("");
    onClear();
    setIsOpen(false);
  };

  // Construction de la grille du mois
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Lun=0..Dim=6
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayStr = toISODate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Labels pour le déclencheur
  const isFilterActive = Boolean(startDate || endDate);
  const isSingleDay = startDate && endDate && startDate === endDate;

  const renderTriggerLabel = () => {
    if (!isFilterActive) {
      return (
        <span className="text-slate-600 font-semibold truncate">
          Filtrer par date <span className="text-slate-400 font-normal hidden sm:inline">(Toutes)</span>
        </span>
      );
    }
    if (isSingleDay) {
      return (
        <span className="font-mono font-bold text-white tracking-tight truncate">
          {formatFR(startDate)}
        </span>
      );
    }
    if (startDate && endDate) {
      return (
        <span className="font-mono font-bold text-white tracking-tight truncate">
          {formatFR(startDate, true)} → {formatFR(endDate, true)}
        </span>
      );
    }
    if (startDate) {
      return (
        <span className="font-mono font-bold text-white tracking-tight truncate">
          Depuis {formatFR(startDate, true)}
        </span>
      );
    }
    return (
      <span className="font-mono font-bold text-white tracking-tight truncate">
        Jusqu&apos;au {formatFR(endDate, true)}
      </span>
    );
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Bouton déclencheur avec Inversion Noir Obsidienne quand actif */}
      <div
        className={`flex items-center rounded-2xl border transition-all duration-150 shadow-2xs ${
          isFilterActive
            ? "bg-slate-900 border-slate-800 text-white shadow-md shadow-slate-900/10 ring-1 ring-emerald-500/40"
            : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
        }`}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold select-none cursor-pointer active:scale-98 transition"
          title="Ouvrir le calendrier et filtrer les factures par date"
        >
          <span className="text-sm select-none">📅</span>
          {renderTriggerLabel()}
          <span
            className={`text-[10px] select-none transition-transform duration-200 ${
              isFilterActive ? "text-emerald-400" : "text-slate-400"
            } ${isOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>

        {isFilterActive && (
          <>
            <div className="h-4 w-px bg-slate-750 shrink-0" />
            <button
              type="button"
              onClick={handleClearAndClose}
              className="px-2 py-1.5 text-xs text-slate-400 hover:text-rose-400 active:scale-90 transition font-bold cursor-pointer"
              title="Réinitialiser et afficher toutes les dates"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Popover / Calendrier Interactif Déplaçable */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className={
              popoverPos.isMobile
                ? "fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
                : "fixed z-[99999] animate-in fade-in zoom-in-95 duration-150"
            }
            style={
              popoverPos.isMobile
                ? undefined
                : {
                    top: `${popoverPos.top}px`,
                    right: `${popoverPos.right}px`,
                  }
            }
          >
            <div
              ref={popoverRef}
              className={`bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col text-slate-800 ${
                popoverPos.isMobile ? "w-full max-h-[90vh] overflow-y-auto" : "w-[340px] sm:w-[360px]"
              }`}
            >
              {/* En-tête du Popover */}
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/30">
                    📅
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-white">Sélecteur de Période</h3>
                    <p className="text-[10px] text-slate-400">
                      Cliquez un jour pour filtrer ou déplacez le mois
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                  title="Fermer"
                >
                  ✕
                </button>
              </div>

              {/* Raccourcis Rapides (Presets) */}
              <div className="p-3 bg-slate-50 border-b border-slate-150">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 px-0.5">
                  Raccourcis rapides
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset("all")}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer active:scale-95 ${
                      !tempStart && !tempEnd
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("today")}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer active:scale-95 ${
                      tempStart === todayStr && tempEnd === todayStr
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Aujourd&apos;hui
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("yesterday")}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                  >
                    Hier
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("7days")}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                  >
                    7 jours
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("month")}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                  >
                    Ce mois
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("prev_month")}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                  >
                    Mois dernier
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("year")}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition cursor-pointer active:scale-95"
                  >
                    Année
                  </button>
                </div>
              </div>

              {/* Barre de navigation dans les mois ("pour le déplacer comme ça") */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                  title="Mois précédent"
                >
                  ‹
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                    {MONTHS_FR[viewMonth]} {viewYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleGoToday}
                    className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
                    title="Revenir à aujourd'hui"
                  >
                    Aujourd&apos;hui
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                  title="Mois suivant"
                >
                  ›
                </button>
              </div>

              {/* Calendrier visuel interactif */}
              <div className="p-3.5 space-y-2">
                {/* En-tête des jours de la semaine */}
                <div className="grid grid-cols-7 text-center">
                  {DAYS_SHORT_FR.map((d, i) => (
                    <span
                      key={d}
                      className={`text-[10px] font-extrabold uppercase py-1 ${
                        i >= 5 ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                {/* Grille des jours */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
                  {/* Jours du mois précédent */}
                  {Array.from({ length: firstDayWeekIndex }).map((_, idx) => {
                    const prevDay = daysInPrevMonth - firstDayWeekIndex + idx + 1;
                    return (
                      <div
                        key={`prev-${idx}`}
                        className="h-8 flex items-center justify-center text-xs text-slate-300 font-medium select-none"
                      >
                        {prevDay}
                      </div>
                    );
                  })}

                  {/* Jours du mois courant */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const dateStr = toISODate(viewYear, viewMonth, day);
                    const isToday = dateStr === todayStr;
                    const hasInvoices = (invoiceDateCounts[dateStr] || 0) > 0;

                    // État de sélection
                    const isStart = tempStart === dateStr;
                    const isEnd = tempEnd === dateStr;
                    const isSelected = isStart || isEnd;

                    // Dans la plage sélectionnée
                    const isInRange =
                      tempStart &&
                      tempEnd &&
                      dateStr >= tempStart &&
                      dateStr <= tempEnd;

                    // Au survol lors d'une sélection de début
                    const isHoverInRange =
                      Boolean(tempStart &&
                      !tempEnd &&
                      hoverDate &&
                      ((tempStart <= hoverDate && dateStr >= tempStart && dateStr <= hoverDate) ||
                        (tempStart > hoverDate && dateStr <= tempStart && dateStr >= hoverDate)));

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleDayClick(dateStr)}
                        onMouseEnter={() => setHoverDate(dateStr)}
                        onMouseLeave={() => setHoverDate(null)}
                        className={`h-8 w-full rounded-lg text-xs font-semibold flex flex-col items-center justify-center relative transition-all duration-100 cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-slate-900 text-white font-extrabold shadow-sm z-10"
                            : isInRange
                            ? "bg-emerald-100 text-emerald-900 font-bold rounded-none"
                            : isHoverInRange
                            ? "bg-emerald-50 text-emerald-700"
                            : isToday
                            ? "border border-emerald-500 font-bold text-emerald-700 hover:bg-slate-100"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                        title={`${formatFR(dateStr)}${
                          hasInvoices ? ` (${invoiceDateCounts[dateStr]} facture(s))` : ""
                        }`}
                      >
                        <span className="leading-none">{day}</span>
                        {/* Indicateur d'activité si factures émises ce jour */}
                        {hasInvoices && (
                          <span
                            className={`w-1 h-1 rounded-full mt-0.5 ${
                              isSelected ? "bg-emerald-400" : "bg-emerald-500"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Résumé de la période & Champs de date personnalisés */}
              <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-slate-800">
                    {tempStart ? formatFR(tempStart, true) : "Début"}
                  </div>
                  <span className="text-slate-400 font-bold">→</span>
                  <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-mono font-bold text-slate-800">
                    {tempEnd ? formatFR(tempEnd, true) : tempStart ? formatFR(tempStart, true) : "Fin"}
                  </div>
                </div>

                {/* Bouton pour filtrer ce jour seulement si un jour est sélectionné */}
                {tempStart && !tempEnd && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempEnd(tempStart);
                    }}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 active:scale-95 transition cursor-pointer"
                  >
                    Ce jour seul
                  </button>
                )}
              </div>

              {/* Pied d'action : Annuler / Appliquer */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleClearAndClose}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
                >
                  Tout afficher
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Appliquer</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                    {matchingInvoiceCount} facture{matchingInvoiceCount > 1 ? "s" : ""}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
