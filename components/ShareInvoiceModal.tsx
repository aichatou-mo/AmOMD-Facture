"use client";

import React, { useState } from "react";
import { Invoice, CompanyProfile } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/money";
import {
  IconClose,
  IconDownload,
  IconWhatsApp,
} from "./Icons";
import {
  shareInvoiceViaWhatsApp,
  buildInvoiceWhatsAppMessage,
  buildWhatsAppWebUrl,
} from "@/lib/whatsapp-share";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

interface ShareInvoiceModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  company?: CompanyProfile;
  onClose: () => void;
}

export default function ShareInvoiceModal({
  isOpen,
  invoice,
  company,
  onClose,
}: ShareInvoiceModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "info" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  const fileName = `Facture_${invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  const messageText = buildInvoiceWhatsAppMessage(invoice);
  const amountStr = formatFCFA(invoice.netToPay || invoice.totalTTC);

  const handleShareWithPdf = async () => {
    setIsSharing(true);
    setFeedback(null);
    try {
      const res = await shareInvoiceViaWhatsApp(invoice, company);
      if (res.mode === "native_share_with_pdf") {
        setFeedback({
          type: "success",
          text: "Facture PDF envoyée via le partage système avec WhatsApp !",
        });
      } else if (res.mode === "desktop_download_and_whatsapp") {
        setFeedback({
          type: "info",
          text: "PDF téléchargé ! Glissez-le dans la discussion WhatsApp qui vient de s'ouvrir.",
        });
      } else if (res.mode === "aborted") {
        // Annulé par l'utilisateur
      } else {
        setFeedback({
          type: "info",
          text: res.message,
        });
      }
    } catch (e) {
      console.error(e);
      setFeedback({
        type: "error",
        text: "Une erreur est survenue lors de l'envoi du document.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPdf = () => {
    downloadInvoicePdf(invoice, company);
    setFeedback({
      type: "success",
      text: `Fichier ${fileName} téléchargé avec succès !`,
    });
  };

  const handleOpenWhatsAppWeb = () => {
    const url = buildWhatsAppWebUrl(invoice, messageText);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto no-print">
      {/* Arrière-plan flouté */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-slate-200 animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                <IconWhatsApp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  Partager la Facture PDF
                </h3>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {invoice.number} &middot; {invoice.clientName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition active:scale-95"
              title="Fermer"
              aria-label="Fermer"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Carte Document PDF généré */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[9px] font-black tracking-wider uppercase">PDF</span>
                  <span className="text-base">📄</span>
                </div>
                <div className="min-w-0">
                  <p className="font-mono font-bold text-xs text-slate-900 truncate" title={fileName}>
                    {fileName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>1 page &middot; A4 OHADA</span>
                    <span>&middot;</span>
                    <span className="font-mono font-bold text-emerald-700">{amountStr}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 shadow-sm transition active:scale-95 flex items-center gap-1.5"
                title="Télécharger sur l'appareil"
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Télécharger</span>
              </button>
            </div>

            {/* Notification de feedback utilisateur */}
            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2.5 animate-fade-in ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : feedback.type === "info"
                    ? "bg-blue-50 text-blue-900 border border-blue-200"
                    : "bg-rose-50 text-rose-900 border border-rose-200"
                }`}
              >
                <span className="text-base shrink-0">
                  {feedback.type === "success" ? "✅" : feedback.type === "info" ? "ℹ️" : "⚠️"}
                </span>
                <span className="leading-relaxed">{feedback.text}</span>
              </div>
            )}

            {/* Action Principale : Envoi Direct WhatsApp avec le fichier PDF joint */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleShareWithPdf}
                disabled={isSharing}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <IconWhatsApp className="w-5 h-5 text-white" />
                <span>
                  {isSharing ? "Génération & Partage en cours..." : "Envoyer directement sur WhatsApp"}
                </span>
                <span className="text-[10px] bg-emerald-500/80 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white">
                  PDF Joint
                </span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Transfère la facture au format PDF directement au client sur WhatsApp.
              </p>
            </div>

            {/* Aperçu du Message WhatsApp */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Message d&apos;accompagnement
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{copied ? "✓ Copié !" : "Copier le texte"}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700 text-left relative space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    💬
                  </div>
                  <p className="leading-relaxed text-slate-800">
                    {messageText}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-emerald-100/80 text-[11px] text-emerald-800 font-mono">
                  <span>📎 Fichier joint :</span>
                  <span className="font-bold underline">{fileName}</span>
                </div>
              </div>
            </div>

            {/* Actions secondaires */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 border border-slate-200/80"
              >
                <IconDownload className="w-4 h-4 text-slate-600" />
                <span>Télécharger PDF</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 border border-emerald-200"
              >
                <IconWhatsApp className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Web</span>
              </button>
            </div>
          </div>

          {/* Pied de modale */}
          <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px]">Format certifié A4 OHADA / UEMOA</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg hover:bg-slate-200 text-slate-600 font-bold transition active:scale-95"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
