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
      <div className="rounded-2xl p-3 bg-slate-50 border border-slate-200/80 text-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">
            {method === "Mobile Money" ? "📱" : method === "Carte Bancaire" ? "💳" : "🏦"}
          </span>
          <span className="text-slate-500 font-semibold">Mode de règlement :</span>
          <strong className="text-slate-900 font-bold">{method}</strong>
        </div>
        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
          {invoice.number}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-scrollbar">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity no-print"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-3xl border border-slate-200 animate-fade-in print-container print:shadow-none print:border-none print:max-w-none print:w-full print:m-0 print:p-0">
          {/* Top Bar: Carousel Navigation ("décaler et rouvrir") + Actions */}
          <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200 gap-3 no-print">
            {/* Décaler entre factures (Précédente / Suivante) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => prevInvoice && onSelectInvoice(prevInvoice)}
                disabled={!prevInvoice}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 shadow-sm"
                title="Facture précédente"
              >
                <span>←</span>
                <span className="hidden sm:inline">Précédente</span>
              </button>

              <div className="flex items-center gap-2 px-2">
                <span className="font-mono font-extrabold text-slate-900 text-sm">
                  {invoice.number}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({currentIndex + 1}/{allInvoices.length})
                </span>
              </div>

              <button
                onClick={() => nextInvoice && onSelectInvoice(nextInvoice)}
                disabled={!nextInvoice}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 shadow-sm"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                title="Télécharger la Facture PDF officielle"
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Télécharger PDF</span>
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                title="Partager le fichier PDF de la facture sur WhatsApp"
              >
                <IconWhatsApp className="w-3.5 h-3.5" />
                <span>Partager PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                title="Fermer"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Document Body */}
          <div className="p-6 sm:p-8 space-y-6 bg-white max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
            {/* Header: Issuer and Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  Émetteur (Votre Entreprise)
                </span>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {CURRENT_USER.company}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{CURRENT_USER.nif}</p>
                <p className="text-xs text-slate-500">{CURRENT_USER.city}</p>
                <p className="text-xs text-slate-500">{CURRENT_USER.phone}</p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Client Destinataire
                </span>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {invoice.clientName}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{invoice.clientCity}</p>
                <p className="text-xs text-slate-500">{invoice.clientPhone}</p>
                <p className="text-xs text-slate-500">{invoice.clientEmail}</p>
              </div>
            </div>

            {/* Dates & Reference Meta */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Émission
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatDateFR(invoice.issueDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Échéance
                </span>
                <span className="font-semibold text-slate-800 font-mono">
                  {formatDateFR(invoice.dueDate)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Type de Paiement
                </span>
                <span className="font-bold text-slate-900">
                  {invoice.paymentMethod}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-center">Qté</th>
                    <th className="py-2.5 text-right">Prix Unitaire</th>
                    <th className="py-2.5 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-2.5 text-center text-slate-600 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 text-right text-slate-600 font-mono">
                        {formatFCFA(item.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                        {formatFCFA(item.totalHT)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
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
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Avance déduite :</span>
                    <span className="font-mono font-medium">- {formatFCFA(invoice.advanceAmount!)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>TVA ({invoice.taxRate}%) :</span>
                  <span className="font-mono font-medium">{formatFCFA(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>Total TTC :</span>
                  <span className="font-mono">{formatFCFA(invoice.totalTTC)}</span>
                </div>
                {Boolean(invoice.consignationAmount && invoice.consignationAmount > 0) && (
                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
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
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>
                    {invoice.invoiceType === "avoir"
                      ? "Net à déduire :"
                      : invoice.invoiceType === "proforma"
                      ? "Total estimé net :"
                      : "Net à payer :"}
                  </span>
                  <span className="font-mono text-emerald-700">
                    {formatFCFA(invoice.netToPay || invoice.totalTTC)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Notice Box */}
            {getPaymentNotice(invoice.paymentMethod)}
          </div>

          {/* Quick Status Transition Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold mr-1">Statut :</span>
              {(["payee", "envoyee", "en_retard", "brouillon"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(invoice.id, st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    invoice.status === st
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
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
