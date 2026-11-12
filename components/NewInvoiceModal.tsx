"use client";

import React, { useState } from "react";
import { TOP_CLIENTS, Invoice, InvoiceItem, PaymentMethodType } from "@/lib/mock-data";
import { formatFCFA, calculateTotals } from "@/lib/money";
import { IconClose, IconPlus, IconTrash } from "./Icons";

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (newInvoice: Invoice) => void;
}

export default function NewInvoiceModal({
  isOpen,
  onClose,
  onSaveInvoice,
}: NewInvoiceModalProps) {
  const [selectedClientId, setSelectedClientId] = useState(TOP_CLIENTS[0].id);
  const [issueDate, setIssueDate] = useState("2026-10-12");
  const [dueDate, setDueDate] = useState("2026-10-27");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("Mobile Money");
  const [paymentDetail, setPaymentDetail] = useState("Airtel Money (+227 96 41 22 10)");

  const [items, setItems] = useState<Array<{ id: string; description: string; quantity: number; unitPrice: number }>>([
    { id: "1", description: "Prestation de services & développement logiciel", quantity: 1, unitPrice: 500000 },
    { id: "2", description: "Maintenance réseau & assistance technique Sahel", quantity: 1, unitPrice: 250000 },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: String(Date.now()),
        description: "",
        quantity: 1,
        unitPrice: 100000,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: "description" | "quantity" | "unitPrice", value: any) => {
    setItems(
      items.map((i) => {
        if (i.id !== id) return i;
        return {
          ...i,
          [field]: field === "description" ? value : Math.max(0, Number(value) || 0),
        };
      })
    );
  };

  const totals = calculateTotals(items);
  const selectedClient = TOP_CLIENTS.find((c) => c.id === selectedClientId) || TOP_CLIENTS[0];

  const handleSubmit = (status: "brouillon" | "envoyee") => {
    const nextNumber = `FAC-2026-00${Math.floor(Math.random() * 900 + 100)}`;
    const invoiceItems: InvoiceItem[] = items.map((i) => ({
      id: `it-${Date.now()}-${i.id}`,
      description: i.description || "Prestation",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalHT: i.quantity * i.unitPrice,
    }));

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: nextNumber,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      clientPhone: selectedClient.phone,
      clientCity: selectedClient.city,
      issueDate,
      dueDate,
      status,
      subtotalHT: totals.subtotalHT,
      taxRate: 18,
      taxAmount: totals.taxAmount,
      totalTTC: totals.totalTTC,
      paidAmount: 0,
      paymentMethod,
      paymentDetail,
      items: invoiceItems,
    };

    onSaveInvoice(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-3xl border border-slate-200 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Créer une nouvelle facture
              </h3>
              <p className="text-xs text-slate-500">
                Numérotation automatique · TVA 18% · Montants en FCFA
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Client & Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Client destinataire
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
                >
                  {TOP_CLIENTS.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.city})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Contact : {selectedClient.contactPerson} · {selectedClient.phone}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Type de Paiement (3 options)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const val = e.target.value as PaymentMethodType;
                    setPaymentMethod(val);
                    if (val === "Mobile Money") setPaymentDetail("Airtel Money / Moov Money (+227 90 24 55 12)");
                    if (val === "Carte Bancaire") setPaymentDetail("Visa / Mastercard GIM-UEMOA");
                    if (val === "Carte de Crédit") setPaymentDetail("Carte Crédit Entreprise");
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Mobile Money">📱 Mobile Money (Airtel, Moov, MyNita, Amanata)</option>
                  <option value="Carte Bancaire">💳 Carte Bancaire (Visa, Mastercard, GIM-UEMOA)</option>
                  <option value="Carte de Crédit">🏦 Carte de Crédit (Affaires / Différé)</option>
                </select>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Canal sélectionné : {paymentMethod}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Date d'émission
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Lignes de la Facture
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                  <span>Ajouter une ligne</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80"
                    >
                      <input
                        type="text"
                        placeholder="Description..."
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                        className="w-full sm:flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qté"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                          className="w-16 px-2 py-1.5 text-center bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                        />

                        <input
                          type="number"
                          step="1000"
                          placeholder="Prix unitaire"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, "unitPrice", e.target.value)}
                          className="w-28 px-2.5 py-1.5 text-right bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                        />

                        <div className="w-28 text-right font-mono font-bold text-slate-900 text-xs">
                          {formatFCFA(lineTotal)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length <= 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3">
              <div className="text-xs text-slate-600">
                TVA : 18% (Réglementation DGI Niger / UEMOA)
              </div>
              <div className="text-right space-y-1">
                <div className="text-xs text-slate-500">
                  Sous-total HT : <span className="font-mono font-bold text-slate-800">{formatFCFA(totals.subtotalHT)}</span>
                </div>
                <div className="text-xs text-slate-500">
                  TVA 18% : <span className="font-mono font-bold text-slate-800">{formatFCFA(totals.taxAmount)}</span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 pt-1 border-t border-emerald-200">
                  Total TTC : <span className="font-mono text-emerald-700">{formatFCFA(totals.totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
            >
              Annuler
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit("brouillon")}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm"
              >
                Enregistrer brouillon
              </button>
              <button
                type="button"
                onClick={() => handleSubmit("envoyee")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition hover:shadow-lg active:scale-95"
              >
                Émettre & Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
