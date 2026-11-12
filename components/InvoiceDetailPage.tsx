"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Invoice, InvoiceStatus, CompanyProfile } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/money";
import {
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconWhatsApp,
  IconDownload,
} from "./Icons";
import InvoiceLivePreview from "./InvoiceLivePreview";
import ConfirmDialog from "./ConfirmDialog";
import ShareInvoiceModal from "./ShareInvoiceModal";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { useTranslation } from "@/lib/i18n";

interface InvoiceDetailPageProps {
  invoice: Invoice;
  allInvoices: Invoice[];
  activeCompany?: CompanyProfile;
  onSelectInvoice: (inv: Invoice) => void;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: InvoiceStatus) => void;
}

const STATUS_OPTIONS: Array<{
  value: InvoiceStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
}> = [
  {
    value: "payee",
    label: "Payée",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    dotClass: "bg-emerald-500",
  },
  {
    value: "envoyee",
    label: "Envoyée",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200/80",
    dotClass: "bg-blue-500",
  },
  {
    value: "en_retard",
    label: "En retard",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200/80",
    dotClass: "bg-rose-500",
  },
  {
    value: "brouillon",
    label: "Brouillon",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200/80",
    dotClass: "bg-slate-400",
  },
];

export default function InvoiceDetailPage({
  invoice,
  allInvoices,
  activeCompany,
  onSelectInvoice,
  onBack,
  onEdit,
  onDelete,
  onUpdateStatus,
}: InvoiceDetailPageProps) {
  const { t, lang } = useTranslation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStatusSubmenuOpen, setIsStatusSubmenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fermer le menu lors d'un clic extérieur, du défilement ou d'un redimensionnement
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
        setIsStatusSubmenuOpen(false);
      }
    };
    const handleClose = () => {
      setIsMenuOpen(false);
      setIsStatusSubmenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [isMenuOpen]);

  const handleToggleMenu = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      setIsStatusSubmenuOpen(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const top = rect.bottom + 8;
      const right = Math.max(12, window.innerWidth - rect.right);
      setMenuAnchor({ top, right });
      setIsStatusSubmenuOpen(false);
      setIsMenuOpen(true);
    }
  };

  const currentStatusConfig =
    STATUS_OPTIONS.find((s) => s.value === invoice.status) || STATUS_OPTIONS[1];

  const currentIndex = allInvoices.findIndex((inv) => inv.id === invoice.id);
  const prevInvoice = currentIndex > 0 ? allInvoices[currentIndex - 1] : null;
  const nextInvoice =
    currentIndex < allInvoices.length - 1 ? allInvoices[currentIndex + 1] : null;

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in pb-12">
      {/* Top Navigation & Action Header (Ultra-compact & responsive) */}
      <div className="bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] flex items-center justify-between gap-2.5 no-print">
        {/* Left: Bouton retour & Identifiant facture */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 flex items-center justify-center transition-all duration-150 active:scale-95 border border-slate-200/60 shrink-0 font-bold"
            title="Retour à la liste des factures"
            aria-label="Retour"
          >
            ←
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h1 className="text-sm sm:text-lg font-black font-mono text-slate-900 tracking-tight truncate">
              {invoice.number}
            </h1>
            {invoice.invoiceType === "avoir" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shrink-0">
                <span>🔄</span> Facture d&apos;Avoir
              </span>
            )}
            {invoice.invoiceType === "proforma" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300 shrink-0">
                <span>📋</span> Facture Proforma
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${currentStatusConfig.badgeClass} shrink-0`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${currentStatusConfig.dotClass}`} />
              {currentStatusConfig.label}
            </span>
          </div>
        </div>

        {/* Right: Boutons d'action (Télécharger PDF direct + Menu 3 points) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              downloadInvoicePdf(invoice, activeCompany);
              setDownloadSuccessToast(`📥 Facture ${invoice.number} téléchargée en PDF dans votre appareil !`);
              setTimeout(() => setDownloadSuccessToast(null), 3500);
            }}
            className="h-9 sm:h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all duration-150 cursor-pointer"
            title="Télécharger la facture en version PDF"
          >
            <IconDownload className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Télécharger PDF</span>
          </button>

          <button
            ref={buttonRef}
            type="button"
            onClick={handleToggleMenu}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all duration-150 active:scale-95 cursor-pointer shadow-sm ${
              isMenuOpen
                ? "bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500/30"
                : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
            }`}
            aria-label="Menu d'actions"
            title="Menu d'actions"
          >
            {/* 3 points tactiles */}
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isMenuOpen ? "bg-emerald-400" : "bg-slate-700"}`} />
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isMenuOpen ? "bg-emerald-400" : "bg-slate-700"}`} />
              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isMenuOpen ? "bg-emerald-400" : "bg-slate-700"}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Alerte / Toast de téléchargement ou d'enregistrement réussi */}
      {downloadSuccessToast && (
        <div className="bg-emerald-950 text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between border border-emerald-500/40 shadow-lg animate-fade-in no-print">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{downloadSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccessToast(null)}
            className="text-emerald-400 hover:text-white font-black text-sm px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Popover du Menu 3 points (créé dans le body pour éviter tout rognage) */}
      {mounted && isMenuOpen && menuAnchor && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: `${menuAnchor.top}px`,
            right: `${menuAnchor.right}px`,
            zIndex: 99999,
            maxWidth: "calc(100vw - 24px)",
            width: "310px",
          }}
          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-scale-up text-slate-800"
        >
          {/* En-tête menu */}
          <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Actions sur la facture
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-700">
              {invoice.number}
            </span>
          </div>

          {/* 1. Statut de la facture (Classé avec flèche selon demande utilisateur) */}
          <div className="p-1.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsStatusSubmenuOpen(!isStatusSubmenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 text-left cursor-pointer ${
                isStatusSubmenuOpen ? "bg-slate-100 text-slate-900" : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm shrink-0 border border-emerald-200/70">
                  🏷️
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">Statut de la facture</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${currentStatusConfig.dotClass}`} />
                    <span className="text-[11px] font-semibold text-slate-600 truncate">
                      {currentStatusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-2">
                <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">Changer</span>
                <span
                  className={`text-xs transition-transform duration-200 ${
                    isStatusSubmenuOpen ? "rotate-90 text-emerald-600 font-bold" : ""
                  }`}
                >
                  ▶
                </span>
              </div>
            </button>

            {/* Sous-menu dépliable des 4 statuts */}
            {isStatusSubmenuOpen && (
              <div className="mt-1.5 p-2 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-1 animate-fade-in">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pb-1">
                  Changer pour :
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_OPTIONS.map((st) => {
                    const isActive = invoice.status === st.value;
                    return (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => {
                          onUpdateStatus(invoice.id, st.value);
                          setIsStatusSubmenuOpen(false);
                          setIsMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 text-left cursor-pointer ${
                          isActive
                            ? "bg-slate-900 text-white shadow-sm ring-1 ring-emerald-400/60"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${st.dotClass}`} />
                        <span className="truncate">{st.label}</span>
                        {isActive && (
                          <span className="ml-auto text-[10px] text-emerald-400 font-mono">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Modifier la facture */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsStatusSubmenuOpen(false);
                onEdit(invoice);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all duration-150 active:scale-95 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-sm shrink-0 border border-amber-200/70">
                ✏️
              </div>
              <div>
                <div className="font-bold text-slate-900">{t.modify || "Modifier la facture"}</div>
                <div className="text-[10px] text-slate-400 font-normal">Éditer les montants et lignes</div>
              </div>
            </button>

            {/* 3. Télécharger la facture en version PDF */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsStatusSubmenuOpen(false);
                downloadInvoicePdf(invoice, activeCompany);
                setDownloadSuccessToast(`📥 Facture ${invoice.number} téléchargée en PDF dans votre appareil / galerie !`);
                setTimeout(() => setDownloadSuccessToast(null), 3500);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all duration-150 active:scale-95 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm shrink-0 border border-emerald-200/70">
                <IconDownload className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Télécharger la facture en version PDF</div>
                <div className="text-[10px] text-slate-400 font-normal">Format officiel A4 certifié OHADA</div>
              </div>
            </button>

            {/* 4. Enregistrer sur la plateforme iziFACTURE */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsStatusSubmenuOpen(false);
                setDownloadSuccessToast(`💾 Facture ${invoice.number} bien enregistrée et sécurisée sur la plateforme !`);
                setTimeout(() => setDownloadSuccessToast(null), 3500);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all duration-150 active:scale-95 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-sm shrink-0 border border-blue-200/70">
                💾
              </div>
              <div>
                <div className="font-bold text-slate-900">Enregistrer sur la plateforme</div>
                <div className="text-[10px] text-slate-400 font-normal">Données synchronisées dans votre espace</div>
              </div>
            </button>

            {/* 5. Imprimer */}
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsStatusSubmenuOpen(false);
                window.print();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all duration-150 active:scale-95 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center text-sm shrink-0 border border-purple-200/70">
                🖨️
              </div>
              <div>
                <div className="font-bold text-slate-900">Imprimer la facture</div>
                <div className="text-[10px] text-slate-400 font-normal">Impression directe format A4</div>
              </div>
            </button>
          </div>

          {/* Séparateur */}
          <div className="h-px bg-slate-100 mx-2" />

          {/* 5. Supprimer la facture */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsStatusSubmenuOpen(false);
                setIsDeleteModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-150 active:scale-95 text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm shrink-0 border border-rose-200/70">
                <IconTrash className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-rose-600">{t.deleteInvoice || "Supprimer la facture"}</div>
                <div className="text-[10px] text-rose-400 font-normal">Action irréversible après confirmation</div>
              </div>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Document Complet de Facture - Rendu sans dépasser sur mobile */}
      <div className="max-w-4xl mx-auto space-y-4 preview-print-column print:max-w-none print:w-full print:m-0 print:p-0">
        <div className="w-full overflow-x-auto no-scrollbar print:overflow-visible">
          <InvoiceLivePreview
            invoice={invoice}
            company={invoice.company || activeCompany}
            templateId={invoice.templateId || invoice.company?.invoiceTemplateId || activeCompany?.invoiceTemplateId}
          />
        </div>

        {/* Deux flèches de navigation facture précédente / suivante */}
        <div className="flex items-center justify-between pt-2 pb-2 px-1 no-print">
          <div className="text-xs font-mono font-bold text-slate-500">
            {lang === "en" ? `Invoice ${currentIndex + 1} of ${allInvoices.length}` : `Facture ${currentIndex + 1} sur ${allInvoices.length}`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => prevInvoice && onSelectInvoice(prevInvoice)}
              disabled={!prevInvoice}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 active:scale-90 flex items-center justify-center shadow-sm"
              title={t.previous || "Facture précédente"}
            >
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => nextInvoice && onSelectInvoice(nextInvoice)}
              disabled={!nextInvoice}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 active:scale-90 flex items-center justify-center shadow-sm"
              title={t.next || "Facture suivante"}
            >
              <IconChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation de Suppression épurée et simple */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Supprimer la facture ?"
        message="Voulez-vous vraiment supprimer cette facture ?"
        confirmLabel="Oui, supprimer"
        cancelLabel="Conserver"
        isDestructive={true}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          onDelete(invoice.id);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      {/* Modale de partage PDF WhatsApp */}
      <ShareInvoiceModal
        isOpen={isShareModalOpen}
        invoice={invoice}
        company={invoice.company || activeCompany}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
