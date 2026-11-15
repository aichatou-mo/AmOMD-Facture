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
        className="fixed inset-0 bg-[#0c111d]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-3xl bg-[#f8f7f3] text-left shadow-2xl transition-all w-full max-w-lg border border-[#e8e7e2] animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#111522] text-white border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdc45]/15 text-[#ffdc45] flex items-center justify-center border border-[#ffdc45]/30">
                <IconWhatsApp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-medium text-white text-base sm:text-lg leading-tight">
                  Partager la Facture PDF
                </h3>
                <p className="text-[11px] font-mono text-[#b9bdc9] mt-0.5">
                  {invoice.number} &middot; {invoice.clientName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#b9bdc9] hover:text-white hover:bg-white/10 transition active:scale-95"
              title="Fermer"
              aria-label="Fermer"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Carte Document PDF généré */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#e8e7e2] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[9px] font-black tracking-wider uppercase">PDF</span>
                  <span className="text-base">📄</span>
                </div>
                <div className="min-w-0">
                  <p className="font-mono font-bold text-xs text-[#111522] truncate" title={fileName}>
                    {fileName}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#697080] mt-0.5">
                    <span>1 page &middot; A4 OHADA</span>
                    <span>&middot;</span>
                    <span className="font-mono font-bold text-[#111522]">{amountStr}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-2.5 py-1.5 rounded-xl bg-[#f8f7f3] hover:bg-[#edece6] text-[#111522] border border-[#e4e2d9] text-xs font-semibold shrink-0 shadow-sm transition active:scale-95 flex items-center gap-1.5"
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
                    ? "bg-[#d9f0df] text-[#285b35] border border-[#c5e4cb]"
                    : feedback.type === "info"
                    ? "bg-[#fff0a6] text-[#332900] border border-[#ffe36a]"
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
                className="cta-hero-btn w-full py-3.5 px-4 rounded-full bg-[#ffdc45] hover:bg-[#ffe879] active:scale-[0.98] text-[#111522] font-bold text-sm shadow-[0_8px_22px_rgba(255,220,69,0.28)] transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <IconWhatsApp className="w-5 h-5 text-[#111522]" />
                <span>
                  {isSharing ? "Génération & Partage en cours..." : "Envoyer directement sur WhatsApp"}
                </span>
                <span className="text-[10px] bg-[#111522] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[#ffdc45]">
                  PDF Joint
                </span>
              </button>
              <p className="text-[11px] text-[#697080] text-center">
                Transfère la facture au format PDF directement au client sur WhatsApp.
              </p>
            </div>

            {/* Aperçu du Message WhatsApp */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#697080]">
                  Message d&apos;accompagnement
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] font-semibold text-[#111522] underline decoration-[#ffdc45] decoration-2 underline-offset-2 hover:text-[#a18400] transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{copied ? "✓ Copié !" : "Copier le texte"}</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-[#e8e7e2] text-xs text-[#5f6571] text-left relative space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#111522] text-[#ffdc45] flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    💬
                  </div>
                  <p className="leading-relaxed text-[#111522]">
                    {messageText}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-[#edece6] text-[11px] text-[#111522] font-mono">
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
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#f2f0e8] text-[#111522] text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 border border-[#e4e2d9]"
              >
                <IconDownload className="w-4 h-4 text-[#111522]" />
                <span>Télécharger PDF</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                className="py-2.5 px-3 rounded-xl bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 border border-[#111522]"
              >
                <IconWhatsApp className="w-4 h-4 text-[#ffdc45]" />
                <span>WhatsApp Web</span>
              </button>
            </div>
          </div>

          {/* Pied de modale */}
          <div className="px-5 py-3 bg-[#f2f0e8] border-t border-[#e8e7e2] flex items-center justify-between text-xs text-[#697080]">
            <span className="text-[11px]">Format certifié A4 OHADA / UEMOA</span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg hover:bg-[#e8e7e2] text-[#111522] font-bold transition active:scale-95"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
