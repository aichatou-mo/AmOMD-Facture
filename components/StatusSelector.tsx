"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { InvoiceStatus } from "@/lib/mock-data";
import { useTranslation } from "@/lib/i18n";

interface StatusSelectorProps {
  currentStatus: InvoiceStatus;
  onUpdateStatus: (newStatus: InvoiceStatus) => void;
  variant?: "button" | "compact" | "badge";
  className?: string;
}

export default function StatusSelector({
  currentStatus,
  onUpdateStatus,
  variant = "button",
  className = "",
}: StatusSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statuses: Array<{
    id: InvoiceStatus;
    label: string;
    icon: string;
    colorBg: string;
    colorText: string;
    dotColor: string;
  }> = [
    {
      id: "payee",
      label: t.statusPaid || "Payée",
      icon: "✅",
      colorBg: "bg-emerald-50 hover:bg-emerald-100",
      colorText: "text-emerald-800",
      dotColor: "bg-emerald-500",
    },
    {
      id: "envoyee",
      label: t.statusSent || "Envoyée",
      icon: "📬",
      colorBg: "bg-amber-50 hover:bg-amber-100",
      colorText: "text-amber-800",
      dotColor: "bg-amber-500",
    },
    {
      id: "en_retard",
      label: t.statusOverdue || "En retard",
      icon: "⚠️",
      colorBg: "bg-rose-50 hover:bg-rose-100",
      colorText: "text-rose-800",
      dotColor: "bg-rose-500",
    },
    {
      id: "brouillon",
      label: t.statusDraft || "Brouillon",
      icon: "📝",
      colorBg: "bg-slate-100 hover:bg-slate-200",
      colorText: "text-slate-700",
      dotColor: "bg-slate-400",
    },
  ];

  const currentInfo = statuses.find((s) => s.id === currentStatus) || statuses[0];

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // Si le bouton n'est plus visible dans la fenêtre (défilement complet), fermer
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const popoverEl = popoverRef.current;
    const popoverHeight = popoverEl ? popoverEl.offsetHeight : 210;
    const popoverWidth = popoverEl ? popoverEl.offsetWidth : 210;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Logique d'inversion : si pas assez de place en bas (< 220px) et plus d'espace au-dessus, ouvrir vers le haut
    let top = 0;
    if (spaceBelow < popoverHeight + 12 && spaceAbove > popoverHeight) {
      top = rect.top - popoverHeight - 6;
    } else {
      top = rect.bottom + 6;
    }

    // Sécurité : s'assurer que le popover reste toujours visible dans la hauteur du viewport
    top = Math.max(8, Math.min(top, window.innerHeight - popoverHeight - 8));

    // Alignement horizontal : caler par défaut avec la gauche du bouton ou centrer, tout en empêchant tout débordement d'écran
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 10) {
      left = rect.right - popoverWidth;
    }
    // Garantie de ne jamais dépasser l'écran sur mobile (360px) ni sur grand écran
    left = Math.max(10, Math.min(left, window.innerWidth - popoverWidth - 10));

    setCoords({ top, left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const raf = requestAnimationFrame(() => {
      updatePosition();
    });

    function handleScrollOrResize() {
      updatePosition();
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  return (
    <div className={`relative inline-block text-left ${className}`}>
      {variant === "button" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all duration-150 active:scale-95 border border-slate-700 cursor-pointer"
          title={t.changeStatusAction || "Changer de statut"}
        >
          <span className={`w-2 h-2 rounded-full ${currentInfo.dotColor} shadow-sm animate-pulse`} />
          <span className="truncate">{t.changeStatusAction || "Changer de statut"}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : variant === "compact" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition active:scale-95 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
          title="Changer statut"
        >
          <span className={`w-2 h-2 rounded-full ${currentInfo.dotColor}`} />
          <span className="hidden sm:inline">Statut</span>
          <svg className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        /* Badge interactif qui s'ouvre au clic */
        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-150 active:scale-95 border cursor-pointer select-none ${
            currentStatus === "payee"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80"
              : currentStatus === "envoyee"
              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/80"
              : currentStatus === "en_retard"
              ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/80"
              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80"
          }`}
          title="Cliquer pour changer de statut"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentInfo.dotColor}`} />
          <span>{currentInfo.label}</span>
          <svg className={`w-2.5 h-2.5 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Menu déroulant Portal : flotte au-dessus de TOUT le document, ne peut JAMAIS être tronqué */}
      {mounted && isOpen && coords && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999,
          }}
          className="w-52 rounded-2xl bg-white shadow-[0_12px_40px_-4px_rgba(15,23,42,0.22)] border border-slate-200/90 py-1.5 focus:outline-none animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{t.changeStatusAction || "Changer le statut"}</span>
            <span className="text-[10px] lowercase font-semibold text-slate-400">4 statuts</span>
          </div>
          <div className="p-1.5 space-y-1">
            {statuses.map((item) => {
              const isSelected = item.id === currentStatus;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-800"
                      : `${item.colorBg} ${item.colorText}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <span>✓</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </span>
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${item.dotColor} opacity-70`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
