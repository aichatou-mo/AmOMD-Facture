"use client";

import React, { useState } from "react";
import { Invoice, CURRENT_USER, PaymentMethodType } from "@/lib/mock-data";
import { formatFCFA, formatDateFR } from "@/lib/money";
import { IconClose, IconDownload, IconWhatsApp } from "./Icons";
import ShareInvoiceModal from "./ShareInvoiceModal";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  allInvoices: Invoice[];
  onSelectInvoice: (inv: Invoice) => void;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: Invoice["status"]) => void;
}

export default function InvoiceDetailModal({
  invoice,
  allInvoices,
  onSelectInvoice,
  onClose,
  onUpdateStatus,
}: InvoiceDetailModalProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  React.useEffect(() => {
    if (invoice) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [invoice]);

  if (!invoice) return null;

  const currentIndex = allInvoices.findIndex((inv) => inv.id === invoice.id);
  const prevInvoice = currentIndex > 0 ? allInvoices[currentIndex - 1] : null;
  const nextInvoice = currentIndex < allInvoices.length - 1 ? allInvoices[currentIndex + 1] : null;

  const getPaymentNotice = (method: PaymentMethodType) => {
    return (
      <div className="rounded-2xl p-3 bg-[#f2f0e8] border border-[#e4e2d9] text-[#111522] text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">
            {method === "Mobile Money" ? "📱" : method === "Carte Bancaire" ? "💳" : "🏦"}
          </span>
          <span className="text-[#697080] font-semibold">Mode de règlement :</span>
          <strong className="text-[#111522] font-bold">{method}</strong>
        </div>
        <span className="text-[11px] font-mono text-[#111522] bg-[#fff0a6] px-2.5 py-0.5 rounded-full border border-[#ffe36a] font-bold">
          {invoice.number}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0c111d]/70 backdrop-blur-sm transition-opacity no-print"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-[#f8f7f3] text-left shadow-2xl transition-all sm:my-8 w-full max-w-3xl border border-[#e8e7e2] animate-fade-in print-container print:shadow-none print:border-none print:max-w-none print:w-full print:m-0 print:p-0">
          {/* Top Bar: Carousel Navigation ("décaler et rouvrir") + Actions */}
          <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-[#111522] text-white border-b border-white/10 gap-3 no-print">
            {/* Décaler entre factures (Précédente / Suivante) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => prevInvoice && onSelectInvoice(prevInvoice)}
                disabled={!prevInvoice}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 shadow-sm active:scale-95"
                title="Facture précédente"
              >
                <span>←</span>
                <span className="hidden sm:inline">Précédente</span>
              </button>

              <div className="flex items-center gap-2 px-2">
                <span className="font-mono font-extrabold text-[#ffdc45] text-sm">
                  {invoice.number}
                </span>
                <span className="text-[11px] text-[#858b9a] font-mono">
                  ({currentIndex + 1}/{allInvoices.length})
                </span>
              </div>

              <button
                onClick={() => nextInvoice && onSelectInvoice(nextInvoice)}
                disabled={!nextInvoice}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 shadow-sm active:scale-95"
                title="Facture suivante"
              >
                <span className="hidden sm:inline">Suivante</span>
                <span>→</span>
              </button>
            </div>

            {/* Quick Actions (PDF, WhatsApp, Close) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadInvoicePdf(invoice)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                title="Télécharger la Facture PDF officielle"
              >
                <IconDownload className="w-3.5 h-3.5 text-[#ffdc45]" />
                <span className="hidden sm:inline">Télécharger PDF</span>
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                title="Partager le fichier PDF de la facture sur WhatsApp"
              >
                <IconWhatsApp className="w-3.5 h-3.5" />
                <span>Partager PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#858b9a] hover:text-white hover:bg-white/10 transition"
                title="Fermer"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Document Body */}
          <div className="p-6 sm:p-8 space-y-6 bg-white max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
            {/* Header: Issuer and Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#edece6] pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a18400] block mb-1">
                  Émetteur (Votre Entreprise)
                </span>
                <h4 className="font-serif font-medium text-[#111522] text-lg">
                  {CURRENT_USER.company}
                </h4>
                <p className="text-xs text-[#5f6571] mt-0.5">{CURRENT_USER.nif}</p>
                <p className="text-xs text-[#5f6571]">{CURRENT_USER.city}</p>
                <p className="text-xs text-[#5f6571]">{CURRENT_USER.phone}</p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#808392] block mb-1">
                  Client Destinataire
                </span>
                <h4 className="font-serif font-medium text-[#111522] text-lg">
                  {invoice.clientName}
                </h4>
                <p className="text-xs text-[#5f6571] mt-0.5">{invoice.clientCity}</p>
                <p className="text-xs text-[#5f6571]">{invoice.clientPhone}</p>
                <p className="text-xs text-[#5f6571]">{invoice.clientEmail}</p>
              </div>
            </div>

            {/* Dates & Reference Meta */}
            <div className="grid grid-cols-3 gap-3 bg-[#f8f7f3] p-3.5 rounded-2xl border border-[#e8e7e2] text-xs">
              <div>
                <span className="text-[10px] text-[#697080] block uppercase font-bold">
                  Émission
                </span>
                <span className="font-semibold text-[#111522] font-mono">
                  {formatDateFR(invoice.issueDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#697080] block uppercase font-bold">
                  Échéance
                </span>
                <span className="font-semibold text-[#111522] font-mono">
                  {formatDateFR(invoice.dueDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#697080] block uppercase font-bold">
                  Type de Paiement
                </span>
                <span className="font-bold text-[#111522]">
                  {invoice.paymentMethod}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-[10px] uppercase font-bold text-[#697080] border-b border-[#e8e7e2]">
                  <tr>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-center">Qté</th>
                    <th className="py-2.5 text-right">Prix Unitaire</th>
                    <th className="py-2.5 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edece6]">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium text-[#111522]">
                        {item.description}
                      </td>
                      <td className="py-2.5 text-center text-[#5f6571] font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 text-right text-[#5f6571] font-mono">
                        {formatFCFA(item.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-bold text-[#111522] font-mono">
                        {formatFCFA(item.totalHT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-3 border-t border-[#e8e7e2]">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-xs text-[#5f6571]">
                  <span>Sous-total HT :</span>
                  <span className="font-mono font-medium">{formatFCFA(invoice.subtotalHT)}</span>
                </div>
                {Boolean(invoice.discountAmount && invoice.discountAmount > 0) && (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span>Remise ({invoice.discountPercent}%) :</span>
                    <span className="font-mono font-medium">- {formatFCFA(invoice.discountAmount!)}</span>
                  </div>
                )}
                {Boolean(invoice.escompteAmount && invoice.escompteAmount > 0) && (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span>Escompte ({invoice.escomptePercent}%) :</span>
                    <span className="font-mono font-medium">- {formatFCFA(invoice.escompteAmount!)}</span>
                  </div>
                )}
                {Boolean(invoice.advanceAmount && invoice.advanceAmount > 0) && (
                  <div className="flex justify-between text-xs text-amber-700">
                    <span>Avance déduite :</span>
                    <span className="font-mono font-medium">- {formatFCFA(invoice.advanceAmount!)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-[#5f6571]">
                  <span>TVA ({invoice.taxRate}%) :</span>
                  <span className="font-mono font-medium">{formatFCFA(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#111522]">
                  <span>Total TTC :</span>
                  <span className="font-mono">{formatFCFA(invoice.totalTTC)}</span>
                </div>
                {Boolean(invoice.consignationAmount && invoice.consignationAmount > 0) && (
                  <div className="flex justify-between text-xs text-[#285b35] font-semibold">
                    <span>Consignation d&apos;emballages :</span>
                    <span className="font-mono">+ {formatFCFA(invoice.consignationAmount!)}</span>
                  </div>
                )}
                {Boolean(invoice.precompteAmount && invoice.precompteAmount > 0) && (
                  <div className="flex justify-between text-xs text-rose-600">
                    <span>Précompte fiscal :</span>
                    <span className="font-mono font-medium">- {formatFCFA(invoice.precompteAmount!)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-[#111522] pt-2.5 mt-1 border-t border-[#e8e7e2] bg-[#111522] text-white px-3 py-2 rounded-xl">
                  <span>
                    {invoice.invoiceType === "avoir"
                      ? "Net à déduire :"
                      : invoice.invoiceType === "proforma"
                      ? "Total estimé net :"
                      : "Net à payer :"}
                  </span>
                  <span className="font-mono text-[#ffdc45]">
                    {formatFCFA(invoice.netToPay || invoice.totalTTC)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Notice Box */}
            {getPaymentNotice(invoice.paymentMethod)}
          </div>

          {/* Quick Status Transition Actions */}
          <div className="p-4 bg-[#f2f0e8] border-t border-[#e8e7e2] flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-[#5f6571] font-semibold mr-1">Statut :</span>
              {(["payee", "envoyee", "en_retard", "brouillon"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(invoice.id, st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition active:scale-95 ${
                    invoice.status === st
                      ? "bg-[#111522] text-[#ffdc45] shadow-sm"
                      : "bg-white border border-[#e4e2d9] text-[#5f6571] hover:text-[#111522] hover:bg-[#f8f7f3]"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#111522]/10 hover:bg-[#111522] hover:text-white text-[#111522] text-xs font-bold transition active:scale-95"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Modale de partage PDF WhatsApp */}
      <ShareInvoiceModal
        isOpen={isShareModalOpen}
        invoice={invoice}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
