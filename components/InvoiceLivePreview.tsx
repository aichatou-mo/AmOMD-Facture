"use client";

import React, { useRef } from "react";
import { Invoice, CompanyProfile, DEFAULT_COMPANY, InvoiceType, PaymentMethodType } from "@/lib/mock-data";
import { formatFCFA, formatDateFR, numberToFrenchWords } from "@/lib/money";

interface InvoiceLivePreviewProps {
  invoice: Partial<Invoice>;
  company?: CompanyProfile;
  companyName?: string;
  isCompact?: boolean;
  onUploadStamp?: (dataUrl: string) => void;
  onSelectPaymentMethod?: (method: PaymentMethodType) => void;
  templateId?: string; // "tpl-1" | "tpl-2" | "tpl-3" | "tpl-4" | "custom"
  accentColor?: string; // hex color e.g. "#059669"
  showStamp?: boolean;
  showBankDetails?: boolean;
  showLegalMentions?: boolean;
  customFile?: { name: string; size: string; previewUrl?: string; mime?: string } | null;
}

export default function InvoiceLivePreview({
  invoice,
  company: propCompany,
  companyName,
  isCompact = false,
  onUploadStamp,
  onSelectPaymentMethod,
  templateId,
  accentColor,
  showStamp,
  showBankDetails,
  showLegalMentions,
  customFile,
}: InvoiceLivePreviewProps) {
  const stampInputRef = useRef<HTMLInputElement>(null);

  // Active Company Profile
  const activeCompany: CompanyProfile = propCompany || invoice.company || {
    ...DEFAULT_COMPANY,
    name: companyName || DEFAULT_COMPANY.name,
  };

  // Dynamic template and styling resolution
  const currentTemplate =
    templateId || activeCompany.invoiceTemplateId || "tpl-1";
  const currentAccent =
    accentColor || activeCompany.invoiceAccentColor || "#059669";
  const displayStamp =
    showStamp !== undefined
      ? showStamp
      : activeCompany.showStampOnInvoice !== undefined
      ? activeCompany.showStampOnInvoice
      : activeCompany.showStamp !== false;
  const displayBankDetails =
    showBankDetails !== undefined
      ? showBankDetails
      : activeCompany.showBankDetailsOnInvoice !== undefined
      ? activeCompany.showBankDetailsOnInvoice
      : true;
  const displayLegalMentions =
    showLegalMentions !== undefined
      ? showLegalMentions
      : activeCompany.showLegalMentionsOnInvoice !== undefined
      ? activeCompany.showLegalMentionsOnInvoice
      : true;

  // Invoice Type : doit | avoir | proforma
  const invoiceType: InvoiceType = invoice.invoiceType || "doit";

  const number = invoice.number || "FAC-2026-0001";
  const clientName = invoice.clientName || "CLIENT DESTINATAIRE";
  const clientContactPerson = (invoice as any).clientContactPerson || "";
  const clientNif = (invoice as any).clientNif || "";
  const clientPhone = invoice.clientPhone || "";
  const clientEmail = invoice.clientEmail || "";
  const clientCity = invoice.clientCity || "";
  const clientAddress = invoice.clientAddress || "";
  const issueDate = invoice.issueDate || new Date().toISOString().split("T")[0];
  const dueDate = invoice.dueDate || "";
  const object = invoice.object || "";

  // Résolution du mode de paiement choisi et de ses détails
  const selectedPaymentMethod: PaymentMethodType =
    (invoice.paymentMethod as PaymentMethodType) ||
    activeCompany.defaultPaymentMethod ||
    "Mobile Money";

  const resolvedPaymentDetail =
    invoice.paymentDetail ||
    invoice.bankAccountRef ||
    activeCompany.defaultPaymentDetail ||
    (selectedPaymentMethod === "Mobile Money"
      ? (activeCompany.phone ? `Mobile Money (${activeCompany.phone})` : "Airtel Money / Moov Money / MyNita")
      : selectedPaymentMethod === "Carte Bancaire"
      ? "Visa / Mastercard / GIM-UEMOA"
      : (activeCompany.bankAccount || "Carte de Crédit / Compte Entreprise"));

  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            id: "demo-1",
            description: "Prestation d'ingénierie & Déploiement infrastructure réseau",
            quantity: 1,
            unitPrice: 7500000,
            totalHT: 7500000,
          },
          {
            id: "demo-2",
            description: "Fourniture d'équipements certifiés UEMOA et licences pro",
            quantity: 2,
            unitPrice: 1500000,
            totalHT: 3000000,
          },
        ];

  // Financial calculations according to OHADA standard
  const rawSubtotalHT =
    invoice.subtotalHT ??
    items.reduce(
      (acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
      0
    );

  const discountPercent = invoice.discountPercent || 0;
  const discountAmount =
    invoice.discountAmount ??
    (discountPercent > 0 ? Math.round((rawSubtotalHT * discountPercent) / 100) : 0);
  const netCommercial =
    invoice.netCommercial ?? Math.max(0, rawSubtotalHT - discountAmount);

  const escomptePercent = invoice.escomptePercent || 0;
  const escompteAmount =
    invoice.escompteAmount ??
    (escomptePercent > 0 ? Math.round((netCommercial * escomptePercent) / 100) : 0);
  const netFinancier =
    invoice.netFinancier ?? Math.max(0, netCommercial - escompteAmount);

  const advanceAmount = invoice.advanceAmount || 0;
  const taxableHT =
    invoice.taxableHT ?? Math.max(0, netFinancier - advanceAmount);

  const taxRate = invoice.taxRate ?? 19;
  const taxAmount =
    invoice.taxAmount ?? Math.round((taxableHT * taxRate) / 100);

  const totalTTC = invoice.totalTTC ?? taxableHT + taxAmount;

  const consignationAmount = invoice.consignationAmount || 0;

  const secondDiscountPercent = invoice.secondDiscountPercent || 0;
  const secondDiscountAmount = invoice.secondDiscountAmount || 0;

  const precompteRate = invoice.precompteRate || invoice.isbRate || 0;
  const precompteAmount =
    invoice.precompteAmount ??
    invoice.isbAmount ??
    (precompteRate > 0 ? Math.round((totalTTC * precompteRate) / 100) : 0);

  const netToPay =
    invoice.netToPay ??
    Math.max(0, totalTTC - precompteAmount + consignationAmount);

  const wordsAmount = numberToFrenchWords(netToPay || totalTTC);

  // Monogram / Initials
  const companyInitials =
    activeCompany.shortName ||
    activeCompany.name
      .split(" ")
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  const handleStampFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadStamp) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onUploadStamp(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper for stamp rendering
  const renderStamp = () => {
    if (!displayStamp) return null;
    return (
      <div className="text-right sm:pr-2 w-full sm:w-auto flex flex-col items-end">
        <p className={`${isCompact ? "text-[10px] mb-0.5" : "text-xs mb-1"} font-extrabold text-slate-900 underline underline-offset-2`}>
          {activeCompany.signatory || "Pour la Direction Générale"}
        </p>
        <input
          type="file"
          ref={stampInputRef}
          onChange={handleStampFile}
          accept="image/*"
          className="hidden"
        />
        {activeCompany.stampUrl ? (
          <div className="relative group mt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeCompany.stampUrl}
              alt="Cachet Officiel"
              className={`${isCompact ? "max-h-11 max-w-[110px]" : "max-h-24 max-w-[170px]"} object-contain rotate-[-2deg] filter drop-shadow-sm select-none`}
            />
            {onUploadStamp && (
              <button
                type="button"
                onClick={() => stampInputRef.current?.click()}
                className="no-print print:hidden absolute -bottom-2 right-0 text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition active:scale-95"
              >
                Changer cachet
              </button>
            )}
          </div>
        ) : (
          <div className="mt-0.5 flex flex-col items-end">
            <div
              className={`inline-flex items-center justify-center relative ${isCompact ? "w-28 h-11 p-1" : "w-40 h-20 p-2"} border-2 border-dashed rounded-xl text-center rotate-[-2deg]`}
              style={{
                borderColor: `${currentAccent}80`,
                backgroundColor: `${currentAccent}10`,
              }}
            >
              <div
                className={`${isCompact ? "w-8 h-8 text-[5.5px]" : "w-14 h-14 text-[7px]"} rounded-full border flex flex-col items-center justify-center font-bold uppercase tracking-tighter shrink-0`}
                style={{ borderColor: currentAccent, color: currentAccent }}
              >
                <span className="truncate max-w-[32px]">{companyInitials}</span>
                <span className="font-mono text-[4.5px]">CERTIFIÉ</span>
                <span className="text-[4.5px]">{activeCompany.city || "SAHEL"}</span>
              </div>
              <div className="ml-1.5 text-left">
                <span
                  className={`${isCompact ? "text-[6.5px]" : "text-[8px]"} font-mono font-bold block leading-tight truncate max-w-[60px]`}
                  style={{ color: currentAccent }}
                >
                  {activeCompany.shortName || "DIRECTION"}
                </span>
                <span className={`${isCompact ? "text-[5.5px]" : "text-[7px]"} text-slate-500 block`}>Signé numériquement</span>
              </div>
            </div>
            {onUploadStamp && (
              <button
                type="button"
                onClick={() => stampInputRef.current?.click()}
                className="no-print print:hidden mt-0.5 text-[9px] font-bold hover:underline underline-offset-2 flex items-center gap-1 active:scale-95"
                style={{ color: currentAccent }}
              >
                <span>📷 Importer mon cachet officiel</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper for bank details & selected payment mode (sans affichage forcé des 3 boîtes)
  const renderBankAndPayment = () => {
    if (!displayBankDetails) return null;
    const paymentIcon =
      selectedPaymentMethod === "Mobile Money"
        ? "📱"
        : selectedPaymentMethod === "Carte Bancaire"
        ? "💳"
        : "🏦";

    return (
      <div className={`${isCompact ? "p-2 mb-1.5 text-[9.5px] space-y-1" : "p-3.5 mb-4 text-[11px] space-y-2"} bg-slate-50/90 rounded-xl border border-slate-200/90`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] uppercase font-black tracking-wider text-slate-600">
              MODE DE PAIEMENT :
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200/90 shadow-2xs">
              <span>{paymentIcon}</span>
              <span>{selectedPaymentMethod}</span>
            </span>
            {onSelectPaymentMethod && (
              <div className="flex items-center gap-1 no-print">
                {(["Mobile Money", "Carte Bancaire", "Carte de Crédit"] as PaymentMethodType[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onSelectPaymentMethod(mode)}
                    className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold transition active:scale-95 cursor-pointer ${
                      selectedPaymentMethod === mode
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {mode === "Mobile Money" ? "Mobile Money" : mode === "Carte Bancaire" ? "Carte Bancaire" : "Carte de Crédit"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 w-fit shrink-0">
            Règlement UEMOA / CEMAC
          </span>
        </div>

        {resolvedPaymentDetail && (
          <div className="pt-1 border-t border-slate-200/70 flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-bold text-slate-500 shrink-0">Coordonnées :</span>
            <span className={`font-mono font-bold text-slate-900 ${isCompact ? "text-[9.5px]" : "text-xs"}`}>
              {resolvedPaymentDetail}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Helper for Arrêté de compte
  const renderLegalMentions = () => {
    if (!displayLegalMentions) return null;
    return (
      <div className={`${isCompact ? "p-1.5 mb-1.5 text-[10px]" : "p-3 mb-4 text-xs"} bg-slate-50 rounded-xl border border-slate-200`}>
        <p className="text-slate-800 leading-snug">
          <span className="font-extrabold underline">
            {invoiceType === "avoir"
              ? "Arrêtée la présente facture d'avoir à la somme de :"
              : invoiceType === "proforma"
              ? "Arrêtée la présente facture proforma à la somme estimative de :"
              : "Arrêtée la présente facture à la somme de :"}
          </span>{" "}
          <span className="font-semibold text-slate-900 capitalize">
            {wordsAmount}
          </span>{" "}
          <strong className="font-mono text-slate-950 font-bold whitespace-nowrap">
            ({netToPay.toLocaleString("fr-FR")}) FCFA
          </strong>
        </p>
      </div>
    );
  };

  // =========================================================
  // GABARIT PERSONNALISÉ IMPORTÉ ("custom")
  // Reproduction fidèle et intégrale de la facture importée (Norme PAM / Marché Institutionnel)
  // =========================================================
  if (currentTemplate === "custom") {
    return (
      <div
        id="printable-invoice"
        className={`${
          isCompact ? "p-3 sm:p-5 space-y-3.5 text-xs" : "p-4 sm:p-8 md:p-10 space-y-5 sm:space-y-6"
        } bg-white text-slate-900 border border-slate-300 shadow-xl rounded-2xl select-none w-full max-w-full overflow-hidden font-sans box-border`}
      >
        {/* En-tête officiel : Société & Mode de paiement à gauche, Métadonnées PAM/Contrat à droite */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 sm:pb-4 border-b border-slate-300">
          <div className="min-w-0 max-w-md">
            <h1 className={`${isCompact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"} font-black text-slate-950 uppercase tracking-tight leading-tight`}>
              {activeCompany.name || "MAINE SOROA"}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1.5 flex flex-wrap items-baseline gap-1.5">
              <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">Mode de paiement :</span>
              <span className="font-mono font-bold text-slate-950">
                {invoice.paymentDetail || invoice.bankAccountRef || (invoice.paymentMethod ? `${invoice.paymentMethod}` : "") || activeCompany.bankAccount || "Mobile Money / Virement"}
              </span>
            </p>
            <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
              {activeCompany.address && (
                <p>{activeCompany.address} — {activeCompany.city || "Diffa / Maine Soroa"}</p>
              )}
              {(activeCompany.rccm || activeCompany.nif) && (
                <p className="font-mono">
                  {activeCompany.rccm ? `RCCM : ${activeCompany.rccm}` : ""}
                  {activeCompany.nif ? ` · NIF : ${activeCompany.nif}` : ""}
                </p>
              )}
              {activeCompany.phone && (
                <p>Tél : <span className="font-mono">{activeCompany.phone}</span></p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1 font-mono shrink-0">
            <div className="flex items-center sm:justify-end gap-2 text-slate-800">
              <span className="font-bold text-slate-500 uppercase text-[10px]">DATE :</span>
              <span className="font-bold">{formatDateFR(issueDate)}</span>
            </div>
            <div className="flex items-center sm:justify-end gap-2 text-slate-950">
              <span className="font-bold text-slate-500 uppercase text-[10px]">FACT NO :</span>
              <span className="font-extrabold text-sm text-slate-950">{number}</span>
            </div>
            <div className="flex items-center sm:justify-end gap-2 text-slate-800">
              <span className="font-bold text-slate-500 uppercase text-[10px]">PO NO. :</span>
              <span className="font-bold text-slate-900">{invoice.poNumber || "4700795005"}</span>
            </div>
            <div className="flex items-center sm:justify-end gap-2 text-slate-800">
              <span className="font-bold text-slate-500 uppercase text-[10px]">WFP VENDOR NO. :</span>
              <span className="font-bold text-slate-900">{invoice.vendorNumber || "50045826"}</span>
            </div>
            <div className="flex items-center sm:justify-end gap-2 text-slate-800 text-[11px]">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Contrat NR :</span>
              <span className="font-bold text-slate-900">{invoice.contractNumber || "DA/LOG/149-15A...MO"}</span>
            </div>
            {(invoice.ltiNumber || "7700776450/7700784099/7700780024") && (
              <div className="flex items-center sm:justify-end gap-2 text-slate-700 text-[10px]">
                <span className="font-bold text-slate-500 uppercase text-[9px]">LTI N° :</span>
                <span className="font-semibold">{invoice.ltiNumber || "7700776450/7700784099/7700780024"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Doit & Objet */}
        <div className="border-t-2 border-b-2 border-slate-900 py-2.5 sm:py-3 space-y-1.5 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-black text-slate-950 uppercase tracking-wide">Doit :</span>
            <span className="font-bold text-slate-900">{clientName || "Programme Alimentaire Mondiale"}</span>
            {clientCity && <span className="text-slate-500 text-xs">({clientCity})</span>}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
            <span className="font-black text-slate-950 uppercase tracking-wide shrink-0">Objet :</span>
            <span className="font-medium text-slate-800 italic">{object || "Transport des vivres de Diffa to Maine Soroa"}</span>
          </div>
        </div>

        {/* Grille Institutionnelle Excel / PAM */}
        <div className="w-full overflow-x-auto no-scrollbar border border-slate-900 rounded-sm">
          <table className="w-full text-left text-xs border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-900 divide-x divide-slate-900">
                <th className="py-2.5 px-2 text-center w-12 font-black">
                  NO
                  <span className="block text-[8px] font-normal text-slate-600">(line num)</span>
                </th>
                <th className="py-2.5 px-3 font-black">
                  DESCRIPTION
                  <span className="block text-[8px] font-normal text-slate-600">(goods / services to be paid)</span>
                </th>
                <th className="py-2.5 px-2 text-center w-24 font-black">
                  UNITE
                  <span className="block text-[8px] font-normal text-slate-600">(MT, KG, ITEM, ETC)</span>
                </th>
                <th className="py-2.5 px-2 text-center w-28 font-black">
                  QUANTITE/TONNAGE
                  <span className="block text-[8px] font-normal text-slate-600">(number of units)</span>
                </th>
                <th className="py-2.5 px-3 text-right w-28 font-black whitespace-nowrap">
                  PRIX UNITAIRE
                  <span className="block text-[8px] font-normal text-slate-600">(unit price)</span>
                </th>
                <th className="py-2.5 px-3 text-right w-32 font-black whitespace-nowrap">
                  TOTAL
                  <span className="block text-[8px] font-normal text-slate-600">(amount per line)</span>
                </th>
                <th className="py-2.5 px-2 text-center w-20 font-black whitespace-nowrap">
                  CURRENCY
                  <span className="block text-[8px] font-normal text-slate-600">(as per PO)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400">
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="divide-x divide-slate-400 hover:bg-slate-50/50">
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 leading-snug">
                    {it.description}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 uppercase">
                    {it.unit || "MT"}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                    {typeof it.quantity === "number" ? it.quantity.toLocaleString("fr-FR") : it.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                    {formatFCFA(it.unitPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950">
                    {formatFCFA(it.totalHT)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                    {it.currency || "FCFA"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux & Décomptes en Cascade OHADA */}
        <div className="flex justify-end pt-1">
          <div className="w-full sm:w-88 border border-slate-900 divide-y divide-slate-300 text-xs font-mono">
            <div className="flex justify-between py-2 px-3 bg-slate-50 font-bold">
              <span>TOTAL BRUT HT :</span>
              <span>{formatFCFA(rawSubtotalHT)}</span>
            </div>
            {discountAmount > 0 && (
              <>
                <div className="flex justify-between py-1.5 px-3 text-rose-700">
                  <span>REMISE ({discountPercent}%) :</span>
                  <span>-{formatFCFA(discountAmount)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3 bg-emerald-50 text-emerald-950 font-extrabold border-y border-emerald-300">
                  <span>➔ NET COMMERCIAL :</span>
                  <span>{formatFCFA(netCommercial)}</span>
                </div>
              </>
            )}
            {escompteAmount > 0 && (
              <>
                <div className="flex justify-between py-1.5 px-3 text-rose-700">
                  <span>ESCOMPTE ({escomptePercent}%) :</span>
                  <span>-{formatFCFA(escompteAmount)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3 bg-blue-50 text-blue-950 font-extrabold border-y border-blue-300">
                  <span>➔ NET FINANCIER :</span>
                  <span>{formatFCFA(netFinancier)}</span>
                </div>
              </>
            )}
            {advanceAmount > 0 && (
              <div className="flex justify-between py-1.5 px-3 text-indigo-700">
                <span>AVANCE DÉDUITE :</span>
                <span>-{formatFCFA(advanceAmount)}</span>
              </div>
            )}
            {(discountAmount > 0 || escompteAmount > 0 || advanceAmount > 0) && (
              <div className="flex justify-between py-1.5 px-3 bg-slate-100 text-slate-900 font-bold">
                <span>MONTANT HT SOUMIS TVA :</span>
                <span>{formatFCFA(taxableHT)}</span>
              </div>
            )}
            <div className="flex justify-between py-1.5 px-3 text-slate-700">
              <span>TVA LÉGALE ({taxRate}%) :</span>
              <span>{taxAmount > 0 ? formatFCFA(taxAmount) : "0 FCFA (Exonéré)"}</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 bg-slate-200 text-slate-950 font-black">
              <span>MONTANT TOTAL TTC :</span>
              <span>{formatFCFA(totalTTC)}</span>
            </div>
            {precompteAmount > 0 && (
              <div className="flex justify-between py-1.5 px-3 text-amber-800">
                <span>PRÉCOMPTE FISCAL ({precompteRate}%) :</span>
                <span>-{formatFCFA(precompteAmount)}</span>
              </div>
            )}
            {consignationAmount > 0 && (
              <div className="flex justify-between py-1.5 px-3 text-emerald-800">
                <span>CONSIGNATION :</span>
                <span>+{formatFCFA(consignationAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 px-3 bg-slate-900 text-white font-black text-sm">
              <span>NET À PAYER :</span>
              <span className="text-emerald-400">{formatFCFA(netToPay)}</span>
            </div>
          </div>
        </div>

        {/* Mentions légales & Règlement */}
        {renderLegalMentions()}
        {renderBankAndPayment()}

        {/* Signature & Cachet officiel */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
          <div className="text-center sm:text-left text-[11px] text-slate-500 font-mono">
            <p className="font-bold text-slate-800">*** MERCI DE VOTRE CONFIANCE ***</p>
            <p>Facture certifiée conforme aux engagements contractuels</p>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-xs font-black uppercase text-slate-900 mb-1">
              {activeCompany.signatory || "Le Gérant & Directeur Général"}
            </span>
            {renderStamp()}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // GABARIT 2 : PREMIUM ÉMERAUDE (Signature iziFACTURE)
  // =========================================================
  if (currentTemplate === "tpl-2") {
    return (
      <div
        id="printable-invoice"
        className="bg-white text-slate-900 border border-slate-200/90 shadow-xl rounded-2xl overflow-hidden font-sans select-none w-full"
      >
        {/* Bandeau Supérieur Incurvé Premium avec Accent Color */}
        <div
          className={`${isCompact ? "p-3.5" : "p-6"} text-white relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${currentAccent}, #022c22)`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`${isCompact ? "w-12 h-12" : "w-16 h-16"} rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg border border-white/20 shrink-0`}>
                {activeCompany.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeCompany.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span
                    className="font-black text-lg sm:text-xl font-mono"
                    style={{ color: currentAccent }}
                  >
                    {companyInitials}
                  </span>
                )}
              </div>
              <div>
                <h1 className={`${isCompact ? "text-base sm:text-lg" : "text-lg sm:text-xl"} font-black uppercase tracking-tight text-white drop-shadow-xs`}>
                  {activeCompany.name}
                </h1>
                {activeCompany.tagline && (
                  <p className="text-[11px] text-white/90 italic font-medium mt-0.5">
                    {activeCompany.tagline}
                  </p>
                )}
                <p className="text-[10px] text-white/80 font-mono mt-0.5">
                  RCCM : {activeCompany.rccm || "RC-NIA-2021"} {activeCompany.nif ? `· NIF : ${activeCompany.nif}` : ""}
                </p>
              </div>
            </div>

            <div className={`text-left sm:text-right bg-white/10 backdrop-blur-md ${isCompact ? "px-3 py-1.5" : "px-4 py-2.5"} rounded-xl border border-white/20 self-start sm:self-auto`}>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/80 block">
                FACTURE OFFICIELLE
              </span>
              <span className="text-sm sm:text-base font-black font-mono tracking-wider text-white block">
                {number}
              </span>
              <span className="text-[9px] text-white/80 block mt-0.5">
                Émise le : {formatDateFR(issueDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Corps de facture */}
        <div className={`${isCompact ? "p-3.5 space-y-3" : "p-5 sm:p-7 space-y-5"}`}>
          {/* Cartes Émetteur et Client côte à côte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div
              className={`${isCompact ? "p-2.5 space-y-0.5" : "p-4 space-y-1"} bg-slate-50/80 rounded-xl border-l-4`}
              style={{ borderLeftColor: currentAccent }}
            >
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                ÉMETTEUR
              </span>
              <p className="text-xs font-extrabold text-slate-900">{activeCompany.name}</p>
              <p className="text-[10px] sm:text-[11px] text-slate-600">
                {activeCompany.address} — {activeCompany.city}, {activeCompany.country}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-600 font-mono">
                Tél : {activeCompany.phone} · {activeCompany.email}
              </p>
            </div>

            <div className={`${isCompact ? "p-2.5 space-y-1" : "p-4 space-y-1.5"} bg-slate-50/80 rounded-xl border border-slate-200/80`}>
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                CLIENT DESTINATAIRE
              </span>
              <p className="text-xs font-extrabold text-slate-900 uppercase font-mono">{clientName}</p>
              {clientContactPerson && (
                <p className="text-[10px] text-slate-700">Contact : <strong>{clientContactPerson}</strong></p>
              )}
              {(clientPhone || clientEmail || clientNif) && (
                <p className="text-[10px] text-slate-600 font-mono">
                  {clientNif ? `NIF: ${clientNif} · ` : ""}{[clientPhone, clientEmail].filter(Boolean).join(" · ")}
                </p>
              )}
              {(clientAddress || clientCity) && (
                <p className="text-[10px] sm:text-[11px] text-slate-600">📍 {[clientAddress, clientCity].filter(Boolean).join(", ")}</p>
              )}
              {object && (
                <p className="text-[10px] sm:text-[11px] text-slate-500 italic">Objet : {object}</p>
              )}
            </div>
          </div>

          {/* Tableau avec En-tête Coloré */}
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className="text-white font-extrabold text-[11px]"
                  style={{ backgroundColor: currentAccent }}
                >
                  <th className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"}`}>DÉSIGNATION DES PRESTATIONS</th>
                  <th className={`${isCompact ? "py-1.5 px-1.5" : "py-2.5 px-2"} text-center w-16`}>QTÉ</th>
                  <th className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"} text-right w-28 whitespace-nowrap`}>PRIX UNIT. HT</th>
                  <th className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"} text-right w-32 whitespace-nowrap`}>MONTANT HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((it, idx) => (
                  <tr key={it.id} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                    <td className={`${isCompact ? "py-1.5 px-2.5" : "py-3 px-3"} font-medium text-slate-800`}>{it.description}</td>
                    <td className={`${isCompact ? "py-1.5 px-1.5" : "py-3 px-2"} text-center font-mono text-slate-700`}>{it.quantity}</td>
                    <td className={`${isCompact ? "py-1.5 px-2.5" : "py-3 px-3"} text-right font-mono text-slate-700`}>{formatFCFA(it.unitPrice)}</td>
                    <td className={`${isCompact ? "py-1.5 px-2.5" : "py-3 px-3"} text-right font-mono font-bold text-slate-900`}>{formatFCFA(it.totalHT)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Récapitulatif Total en Cascade OHADA */}
          <div className="flex justify-end">
            <div className={`w-full sm:w-80 ${isCompact ? "p-2.5 space-y-1" : "p-4 space-y-1.5"} rounded-xl border border-slate-200 bg-slate-50/70 text-xs shadow-xs`}>
              <div className="flex justify-between text-slate-700">
                <span>Total Brut HT :</span>
                <span className="font-mono font-bold text-slate-950">{formatFCFA(rawSubtotalHT)}</span>
              </div>
              {discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-rose-700">
                    <span>Remise ({discountPercent}%) :</span>
                    <span className="font-mono font-bold">-{formatFCFA(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 bg-emerald-50 rounded text-emerald-900 font-extrabold border border-emerald-200/50">
                    <span>➔ Net Commercial :</span>
                    <span className="font-mono">{formatFCFA(netCommercial)}</span>
                  </div>
                </>
              )}
              {escompteAmount > 0 && (
                <>
                  <div className="flex justify-between text-rose-700">
                    <span>Escompte ({escomptePercent}%) :</span>
                    <span className="font-mono font-bold">-{formatFCFA(escompteAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 bg-blue-50 rounded text-blue-900 font-extrabold border border-blue-200/50">
                    <span>➔ Net Financier :</span>
                    <span className="font-mono">{formatFCFA(netFinancier)}</span>
                  </div>
                </>
              )}
              {advanceAmount > 0 && (
                <div className="flex justify-between text-indigo-700">
                  <span>Avance déduite :</span>
                  <span className="font-mono font-bold">-{formatFCFA(advanceAmount)}</span>
                </div>
              )}
              {(discountAmount > 0 || escompteAmount > 0 || advanceAmount > 0) && (
                <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-1">
                  <span>Montant HT imposable :</span>
                  <span className="font-mono font-bold">{formatFCFA(taxableHT)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>TVA légale ({taxRate}%) :</span>
                <span className="font-mono font-bold">{taxAmount > 0 ? `+${formatFCFA(taxAmount)}` : "0 FCFA"}</span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-slate-200/70 rounded text-slate-950 font-black border border-slate-300">
                <span>Montant Total TTC :</span>
                <span className="font-mono">{formatFCFA(totalTTC)}</span>
              </div>
              {precompteAmount > 0 && (
                <div className="flex justify-between text-amber-800">
                  <span>Précompte fiscal ({precompteRate}%) :</span>
                  <span className="font-mono font-bold">-{formatFCFA(precompteAmount)}</span>
                </div>
              )}
              {consignationAmount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Consignation :</span>
                  <span className="font-mono font-bold">+{formatFCFA(consignationAmount)}</span>
                </div>
              )}
              <div
                className="flex justify-between items-center pt-2 mt-2 border-t border-slate-300 p-2.5 rounded-lg"
                style={{
                  backgroundColor: `${currentAccent}15`,
                  border: `1px solid ${currentAccent}40`,
                }}
              >
                <span className="font-extrabold text-slate-900">
                  {invoiceType === "avoir"
                    ? "NET À DÉDUIRE :"
                    : invoiceType === "proforma"
                    ? "TOTAL ESTIMÉ :"
                    : "NET À PAYER :"}
                </span>
                <span
                  className="font-mono font-black text-base"
                  style={{ color: currentAccent }}
                >
                  {formatFCFA(netToPay)}
                </span>
              </div>
            </div>
          </div>

          {renderLegalMentions()}
          {renderBankAndPayment()}

          {/* Footer & Signature */}
          <div className="flex flex-col sm:flex-row items-end justify-between pt-2 border-t border-slate-100 gap-4">
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <p>Document officiel établi sous la norme comptable OHADA / UEMOA.</p>
              <p>Échéance de paiement : {dueDate ? formatDateFR(dueDate) : "À réception"}</p>
            </div>
            {renderStamp()}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // GABARIT 3 : ENTREPRISE (Colonne latérale sombre obsidienne)
  // =========================================================
  if (currentTemplate === "tpl-3") {
    return (
      <div
        id="printable-invoice"
        className="bg-white text-slate-900 border border-slate-300 shadow-xl rounded-2xl overflow-hidden font-sans select-none w-full grid grid-cols-1 sm:grid-cols-[210px_1fr]"
      >
        {/* Colonne latérale sombre */}
        <aside
          className={`bg-slate-950 text-white ${isCompact ? "p-3.5 space-y-3" : "p-5 space-y-5"}`}
          style={{ borderRight: `4px solid ${currentAccent}` }}
        >
          <div className={`${isCompact ? "w-11 h-11" : "w-14 h-14"} rounded-xl bg-white p-1 flex items-center justify-center`}>
            {activeCompany.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeCompany.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-mono font-black text-base sm:text-lg text-slate-900">{companyInitials}</span>
            )}
          </div>
          <div>
            <h1 className={`${isCompact ? "text-xs" : "text-sm"} font-black uppercase tracking-wider text-white leading-tight`}>
              {activeCompany.name}
            </h1>
            {activeCompany.tagline && (
              <p className="text-[10px] text-slate-400 italic mt-0.5">{activeCompany.tagline}</p>
            )}
          </div>

          <div className="space-y-0.5 text-[10px] text-slate-400">
            <span className="text-[9px] uppercase font-bold tracking-widest block" style={{ color: currentAccent }}>
              Émetteur
            </span>
            <p className="font-mono">RCCM : {activeCompany.rccm || "—"}</p>
            <p className="font-mono">NIF : {activeCompany.nif || "—"}</p>
            <p>{activeCompany.address}</p>
            <p>{activeCompany.city}, {activeCompany.country}</p>
            <p className="font-mono">{activeCompany.phone}</p>
            <p className="break-all">{activeCompany.email}</p>
          </div>

          <div className="space-y-0.5 text-[10px] text-slate-400">
            <span className="text-[9px] uppercase font-bold tracking-widest block" style={{ color: currentAccent }}>
              Facturé à
            </span>
            <p className="text-xs font-extrabold text-white uppercase font-mono">{clientName}</p>
            {clientContactPerson && <p className="text-slate-300">Contact : {clientContactPerson}</p>}
            {clientNif && <p className="font-mono text-slate-300">NIF : {clientNif}</p>}
            {(clientPhone || clientEmail) && (
              <p className="font-mono text-[9px] text-slate-400">{[clientPhone, clientEmail].filter(Boolean).join(" · ")}</p>
            )}
            <p>{[clientAddress, clientCity].filter(Boolean).join(", ")}</p>
          </div>

          <span className="inline-block text-[9px] uppercase font-bold text-emerald-400 tracking-wider border border-emerald-500/40 rounded px-2 py-0.5">
            ✓ Authentifié OHADA
          </span>
        </aside>

        {/* Contenu principal */}
        <main className={`${isCompact ? "p-3.5 space-y-2.5" : "p-5 sm:p-6 space-y-4"} min-w-0`}>
          <div className="flex items-start justify-between gap-3 pb-2.5 border-b-2 border-slate-900">
            <div>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-slate-400 block">
                {invoiceType === "avoir" ? "Facture d'avoir" : invoiceType === "proforma" ? "Facture proforma" : "Facture"}
              </span>
              <span className={`${isCompact ? "text-lg" : "text-xl"} font-black font-mono text-slate-950`}>{number}</span>
            </div>
            <div className="text-right text-[10px] sm:text-[11px] text-slate-500">
              <p>Émise le <strong className="font-mono text-slate-800">{formatDateFR(issueDate)}</strong></p>
              <p>Échéance : <strong className="font-mono text-slate-800">{dueDate ? formatDateFR(dueDate) : "À réception"}</strong></p>
            </div>
          </div>

          <p className="text-xs text-slate-700">
            <span className="font-bold">Objet : </span>
            <span className="italic">{object}</span>
          </p>

          <div className="rounded-xl border border-slate-300 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold text-[11px]">
                  <th className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"}`}>Désignation</th>
                  <th className={`${isCompact ? "py-1.5 px-1.5" : "py-2.5 px-2"} text-center w-14`}>Qté</th>
                  <th className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"} text-right w-28 whitespace-nowrap`}>Prix Unit. HT</th>
                  <th className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"} text-right w-32 whitespace-nowrap`}>Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => (
                  <tr key={it.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"} font-semibold text-slate-900`}>{it.description}</td>
                    <td className={`${isCompact ? "py-1.5 px-1.5" : "py-2.5 px-2"} text-center font-mono`}>{it.quantity}</td>
                    <td className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"} text-right font-mono`}>{formatFCFA(it.unitPrice)}</td>
                    <td className={`${isCompact ? "py-1.5 px-2.5" : "py-2.5 px-3"} text-right font-mono font-bold text-slate-950`}>
                      {formatFCFA(it.totalHT)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className={`w-full sm:w-80 bg-slate-950 text-white ${isCompact ? "p-2.5 space-y-1" : "p-4 space-y-1.5"} rounded-xl text-xs shadow-md`}>
              <div className="flex justify-between text-slate-400">
                <span>Total Brut HT :</span>
                <span className="font-mono text-white font-bold">{formatFCFA(rawSubtotalHT)}</span>
              </div>
              {discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-rose-400">
                    <span>Remise ({discountPercent}%) :</span>
                    <span className="font-mono font-bold">-{formatFCFA(discountAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 bg-slate-900 rounded text-emerald-400 font-extrabold border border-slate-800">
                    <span>➔ Net Commercial :</span>
                    <span className="font-mono">{formatFCFA(netCommercial)}</span>
                  </div>
                </>
              )}
              {escompteAmount > 0 && (
                <>
                  <div className="flex justify-between text-rose-400">
                    <span>Escompte ({escomptePercent}%) :</span>
                    <span className="font-mono font-bold">-{formatFCFA(escompteAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 px-2 bg-slate-900 rounded text-cyan-400 font-extrabold border border-slate-800">
                    <span>➔ Net Financier :</span>
                    <span className="font-mono">{formatFCFA(netFinancier)}</span>
                  </div>
                </>
              )}
              {advanceAmount > 0 && (
                <div className="flex justify-between text-indigo-300">
                  <span>Avance déduite :</span>
                  <span className="font-mono font-bold">-{formatFCFA(advanceAmount)}</span>
                </div>
              )}
              {(discountAmount > 0 || escompteAmount > 0 || advanceAmount > 0) && (
                <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
                  <span>Montant HT imposable :</span>
                  <span className="font-mono font-bold">{formatFCFA(taxableHT)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>TVA légale ({taxRate}%) :</span>
                <span className="font-mono text-white">{taxAmount > 0 ? `+${formatFCFA(taxAmount)}` : "0 FCFA"}</span>
              </div>
              <div className="flex justify-between py-1 px-2 bg-slate-900 rounded text-white font-black border border-slate-800">
                <span>Montant Total TTC :</span>
                <span className="font-mono">{formatFCFA(totalTTC)}</span>
              </div>
              {precompteAmount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Précompte fiscal ({precompteRate}%) :</span>
                  <span className="font-mono font-bold">-{formatFCFA(precompteAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-extrabold">
                <span>
                  {invoiceType === "avoir"
                    ? "NET À DÉDUIRE :"
                    : invoiceType === "proforma"
                    ? "TOTAL ESTIMÉ :"
                    : "NET À PAYER :"}
                </span>
                <span
                  className="font-mono font-black text-base"
                  style={{ color: currentAccent === "#0F172A" ? "#10B981" : currentAccent }}
                >
                  {formatFCFA(netToPay)}
                </span>
              </div>
            </div>
          </div>

          {renderLegalMentions()}
          {renderBankAndPayment()}

          <div className="flex flex-col sm:flex-row items-end justify-between pt-2 border-t border-slate-200 gap-4">
            <div className="text-[10px] text-slate-400">
              <p>Facture émise par iziFACTURE PRO · Normes Comptables Sahel</p>
            </div>
            {renderStamp()}
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // GABARIT 4 : MINIMALISTE (Petit ticket / reçu compact)
  // =========================================================
  if (currentTemplate === "tpl-4") {
    return (
      <div
        id="printable-invoice"
        className="bg-white text-slate-900 border border-dashed border-slate-300 shadow-md rounded-lg px-5 py-6 font-mono select-none w-full max-w-sm mx-auto"
      >
        {/* En-tête ticket centré */}
        <div className="text-center pb-3 border-b border-dashed border-slate-400">
          <h1 className="text-sm font-bold uppercase tracking-wide text-slate-950">
            {activeCompany.name}
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {activeCompany.address} — {activeCompany.city}
          </p>
          <p className="text-[10px] text-slate-500">Tél : {activeCompany.phone}</p>
          {(activeCompany.rccm || activeCompany.nif) && (
            <p className="text-[10px] text-slate-500">
              {activeCompany.rccm ? `RCCM ${activeCompany.rccm}` : ""}
              {activeCompany.rccm && activeCompany.nif ? " · " : ""}
              {activeCompany.nif ? `NIF ${activeCompany.nif}` : ""}
            </p>
          )}
        </div>

        {/* Référence */}
        <div className="py-3 text-[11px] border-b border-dashed border-slate-400 space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-500">
              {invoiceType === "avoir" ? "AVOIR" : invoiceType === "proforma" ? "PROFORMA" : "FACTURE"}
            </span>
            <span className="font-bold">{number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span>{formatDateFR(issueDate)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Client</span>
            <span className="font-bold text-right truncate">{clientName}</span>
          </div>
        </div>

        {/* Articles */}
        <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
          {items.map((it) => (
            <div key={it.id} className="text-[11px]">
              <p className="font-bold text-slate-900 leading-tight">{it.description}</p>
              <div className="flex justify-between text-slate-600">
                <span>
                  {it.quantity} x {formatFCFA(it.unitPrice)}
                </span>
                <span className="font-bold text-slate-900">{formatFCFA(it.totalHT)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="py-3 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-600">
            <span>Sous-total HT</span>
            <span>{formatFCFA(rawSubtotalHT)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>TVA {taxRate}%</span>
            <span>{formatFCFA(taxAmount)}</span>
          </div>
          <div
            className="flex justify-between pt-1.5 text-sm font-black"
            style={{ color: currentAccent }}
          >
            <span>TOTAL</span>
            <span>{formatFCFA(netToPay)}</span>
          </div>
        </div>

        {/* Paiement compact */}
        {displayBankDetails && (
          <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] text-slate-700 space-y-1">
            <p className="font-bold text-slate-900 uppercase">
              MODE DE PAIEMENT : <span className="font-mono text-slate-950">{selectedPaymentMethod}</span>
            </p>
            {resolvedPaymentDetail && (
              <p className="font-mono font-bold text-slate-800 text-[10px]">
                {resolvedPaymentDetail}
              </p>
            )}
          </div>
        )}

        {displayLegalMentions && (
          <p className="py-3 text-[10px] text-slate-700 leading-snug border-b border-dashed border-slate-400">
            Arrêtée à la somme de{" "}
            <span className="font-bold capitalize">{wordsAmount}</span>{" "}
            ({netToPay.toLocaleString("fr-FR")}) FCFA
          </p>
        )}

        {/* Pied de ticket */}
        <div className="pt-3 text-center text-[10px] text-slate-500 space-y-2">
          <p className="font-bold text-slate-800 tracking-widest">*** MERCI DE VOTRE CONFIANCE ***</p>
          <div className="flex justify-center">{renderStamp()}</div>
        </div>
      </div>
    );
  }

  // =========================================================
  // GABARIT 1 PAR DÉFAUT : CLASSIQUE SAHEL (Standard OHADA)
  // =========================================================
  return (
    <div
      id="printable-invoice"
      className={`bg-white text-slate-900 border border-slate-200/90 shadow-xl rounded-2xl overflow-hidden font-sans select-none w-full ${
        isCompact ? "p-3 sm:p-4" : "p-4 sm:p-7"
      }`}
    >
      {/* Liseré supérieur aux couleurs du pays */}
      <div
        className={`h-1.5 w-full ${
          isCompact ? "-mt-3 sm:-mt-4 -mx-3 sm:-mx-4 mb-2" : "-mt-4 sm:-mt-7 -mx-4 sm:-mx-7 mb-4"
        } rounded-t-2xl`}
        style={{ backgroundColor: currentAccent }}
      />

      {/* En-tête Classique OHADA */}
      <div
        className={`flex items-start justify-between gap-2 sm:gap-3 ${
          isCompact ? "pb-2 mb-1" : "pb-5"
        } border-b-2 border-slate-900/10`}
      >
        <div className="shrink-0">
          {activeCompany.logoUrl ? (
            <div
              className={`${
                isCompact ? "w-12 h-12 sm:w-14 sm:h-14" : "w-16 h-16 sm:w-24 sm:h-20"
              } rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center overflow-hidden shadow-sm`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeCompany.logoUrl}
                alt={activeCompany.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div
              className={`${
                isCompact ? "w-11 h-11 sm:w-14 sm:h-14" : "w-14 h-14 sm:w-20 sm:h-20"
              } rounded-xl p-1.5 flex flex-col items-center justify-center text-white shadow-md border shrink-0`}
              style={{
                backgroundColor: currentAccent,
                borderColor: `${currentAccent}60`,
              }}
            >
              <span className="text-sm sm:text-base font-black tracking-widest text-white font-mono">
                {companyInitials}
              </span>
              <span className="text-[7px] text-white/90 uppercase font-bold text-center truncate max-w-[60px]">
                {activeCompany.city || "Sahel"}
              </span>
            </div>
          )}
        </div>

        <div className="text-center flex-1 px-1 sm:px-2">
          <h2 className={`${isCompact ? "text-xs sm:text-sm" : "text-xs sm:text-base"} font-extrabold uppercase tracking-tight text-slate-900 font-sans leading-tight`}>
            {activeCompany.name}
          </h2>

          {activeCompany.tagline && (
            <p className="text-[9px] sm:text-[10px] font-semibold italic mt-0.5" style={{ color: currentAccent }}>
              {activeCompany.tagline}
            </p>
          )}

          {(activeCompany.rccm || activeCompany.nif) && (
            <p className="text-[9px] sm:text-[10px] font-mono text-slate-700 font-semibold mt-0.5">
              {activeCompany.rccm && <span>RCCM : {activeCompany.rccm}</span>}
              {activeCompany.rccm && activeCompany.nif && <span> · </span>}
              {activeCompany.nif && <span>NIF : {activeCompany.nif}</span>}
            </p>
          )}

          {(activeCompany.phone || activeCompany.email) && (
            <p className="text-[9px] sm:text-[10px] font-semibold text-slate-800 mt-0.5">
              {activeCompany.phone && <span>TEL : {activeCompany.phone}</span>}
              {activeCompany.phone && activeCompany.email && <span> · </span>}
              {activeCompany.email && <span>{activeCompany.email}</span>}
            </p>
          )}

          {activeCompany.address && (
            <p className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5">
              {activeCompany.address} — {activeCompany.city}, {activeCompany.country}
            </p>
          )}
        </div>

        {/* Cartouche Numéro & Date */}
        <div
          className={`${
            isCompact ? "w-20 sm:w-24 p-1" : "w-24 sm:w-32 p-2"
          } rounded-xl border border-slate-300 bg-slate-50 text-center shrink-0`}
        >
          <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-600 block">
            {invoiceType === "avoir" ? "AVOIR" : invoiceType === "proforma" ? "PROFORMA" : "FACTURE"}
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono font-black text-slate-900 block mt-0.5">
            {number}
          </span>
          <span className="text-[8px] text-slate-500 block mt-0.5">
            {formatDateFR(issueDate)}
          </span>
        </div>
      </div>

      {/* Cadre Client */}
      <div
        className={`space-y-1 ${
          isCompact ? "my-1.5 p-2" : "my-3.5 p-3.5"
        } bg-slate-50/80 rounded-xl border border-slate-200`}
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <span className="text-[11px] sm:text-xs font-extrabold text-slate-900 underline underline-offset-4">
              DOIT :
            </span>
            <span className="text-[11px] sm:text-xs font-black text-slate-950 uppercase font-mono tracking-wide ml-1.5">
              {clientName}
            </span>
            {clientContactPerson && (
              <span className="text-[10px] text-slate-600 block sm:inline sm:ml-2">
                (Attn : <strong>{clientContactPerson}</strong>)
              </span>
            )}
          </div>
          {(clientAddress || clientCity) && (
            <span className="text-[10px] text-slate-500">
              📍 {[clientAddress, clientCity].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
        {(clientPhone || clientEmail || clientNif) && (
          <div className="text-[10px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono pt-0.5">
            {clientNif && <span>NIF Client : <strong>{clientNif}</strong></span>}
            {clientPhone && <span>Tél : {clientPhone}</span>}
            {clientEmail && <span>Email : {clientEmail}</span>}
          </div>
        )}
        {object && (
          <div className="pt-0.5 border-t border-slate-200/60 text-[10.5px]">
            <span className="font-bold text-slate-800">Objet / Désignation : </span>
            <span className="text-slate-800 italic font-medium">{object}</span>
          </div>
        )}
      </div>

      {/* Tableau Standard OHADA */}
      <div className={`overflow-x-auto rounded-xl border border-slate-300 ${isCompact ? "mb-1.5" : "mb-4"}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold">
              <th className={`${isCompact ? "py-1 px-2 text-[10.5px]" : "py-2.5 px-3"} border-r border-slate-300`}>Désignation</th>
              <th className={`${isCompact ? "py-1 px-1 text-[10.5px]" : "py-2.5 px-2"} text-center border-r border-slate-300 w-14`}>Qté</th>
              <th className={`${isCompact ? "py-1 px-2 text-[10.5px]" : "py-2.5 px-3"} text-right border-r border-slate-300 w-28 whitespace-nowrap`}>Prix unit. HT</th>
              <th className={`${isCompact ? "py-1 px-2 text-[10.5px]" : "py-2.5 px-3"} text-right w-32 whitespace-nowrap`}>Montant HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {items.map((it) => (
              <tr key={it.id}>
                <td className={`${isCompact ? "py-1 px-2 text-[10.5px]" : "py-2.5 px-3"} border-r border-slate-200 text-slate-800`}>{it.description}</td>
                <td className={`${isCompact ? "py-1 px-1 text-[10.5px]" : "py-2.5 px-2"} text-center border-r border-slate-200 font-mono`}>{it.quantity}</td>
                <td className={`${isCompact ? "py-1 px-2 text-[10.5px]" : "py-2.5 px-3"} text-right border-r border-slate-200 font-mono`}>{formatFCFA(it.unitPrice)}</td>
                <td className={`${isCompact ? "py-1 px-2 text-[10.5px]" : "py-2.5 px-3"} text-right font-mono font-bold text-slate-950`}>{formatFCFA(it.totalHT)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-xs">
            <tr>
              <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-slate-700`}>
                Total Brut HT :
              </td>
              <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-slate-900 font-bold`}>
                {formatFCFA(rawSubtotalHT)}
              </td>
            </tr>

            {/* Réduction(s) en cascade */}
            {discountAmount > 0 && (
              <>
                <tr>
                  <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-rose-700`}>
                    Remise commerciale ({discountPercent}%) :
                  </td>
                  <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-rose-700 font-bold`}>
                    -{formatFCFA(discountAmount - secondDiscountAmount)}
                  </td>
                </tr>

                {secondDiscountAmount > 0 && (
                  <>
                    <tr className="bg-slate-100/60 border-y border-slate-200">
                      <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1 px-3"} text-right border-r border-slate-300 text-slate-700 font-medium`}>
                        1er Net Commercial :
                      </td>
                      <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1 px-3"} text-right font-mono text-slate-800`}>
                        {formatFCFA(rawSubtotalHT - (discountAmount - secondDiscountAmount))}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-rose-700`}>
                        2ème Remise en cascade ({secondDiscountPercent}%) :
                      </td>
                      <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-rose-700 font-bold`}>
                        -{formatFCFA(secondDiscountAmount)}
                      </td>
                    </tr>
                  </>
                )}

                {/* Net Commercial OHADA */}
                <tr className="bg-emerald-50/50 border-y border-emerald-200/60">
                  <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-slate-900 font-extrabold`}>
                    Net Commercial :
                  </td>
                  <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-slate-950 font-extrabold`}>
                    {formatFCFA(netCommercial)}
                  </td>
                </tr>
              </>
            )}

            {/* Escompte financier en cascade sur Net Commercial */}
            {escompteAmount > 0 && (
              <>
                <tr>
                  <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-rose-700`}>
                    Escompte financier ({escomptePercent}%) :
                  </td>
                  <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-rose-700 font-bold`}>
                    -{formatFCFA(escompteAmount)}
                  </td>
                </tr>
                {/* Net Financier OHADA */}
                <tr className="bg-blue-50/50 border-y border-blue-200/60">
                  <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-slate-900 font-extrabold`}>
                    Net Financier :
                  </td>
                  <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-slate-950 font-extrabold`}>
                    {formatFCFA(netFinancier)}
                  </td>
                </tr>
              </>
            )}

            {/* Avance / Acompte déduit */}
            {advanceAmount > 0 && (
              <tr>
                <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-indigo-700`}>
                  Avance / Acompte déduit :
                </td>
                <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-indigo-700 font-bold`}>
                  -{formatFCFA(advanceAmount)}
                </td>
              </tr>
            )}

            {/* Montant HT imposable */}
            {(discountAmount > 0 || escompteAmount > 0 || advanceAmount > 0) && (
              <tr className="bg-slate-100/70 border-y border-slate-200">
                <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-slate-800 font-bold`}>
                  Montant HT soumis à TVA :
                </td>
                <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-slate-900 font-bold`}>
                  {formatFCFA(taxableHT)}
                </td>
              </tr>
            )}

            {/* TVA légale */}
            <tr>
              <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-slate-700`}>
                TVA légale ({taxRate}%) :
              </td>
              <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-slate-900 font-bold`}>
                {taxAmount > 0 ? `+${formatFCFA(taxAmount)}` : "0 FCFA (Exonéré)"}
              </td>
            </tr>

            {/* Montant Total TTC */}
            <tr className="bg-slate-200/70 border-t border-b-2 border-slate-300">
              <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-slate-950 font-black`}>
                Montant TTC :
              </td>
              <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-slate-950 font-black`}>
                {formatFCFA(totalTTC)}
              </td>
            </tr>

            {/* Précompte fiscal */}
            {precompteAmount > 0 && (
              <tr>
                <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-amber-800`}>
                  Précompte fiscal / ISB ({precompteRate}%) :
                </td>
                <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-amber-800 font-bold`}>
                  -{formatFCFA(precompteAmount)}
                </td>
              </tr>
            )}

            {/* Consignation emballages */}
            {consignationAmount > 0 && (
              <tr>
                <td colSpan={3} className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right border-r border-slate-300 text-emerald-800`}>
                  Consignation d'emballages :
                </td>
                <td className={`${isCompact ? "py-0.5 px-2 text-[10px]" : "py-1.5 px-3"} text-right font-mono text-emerald-800 font-bold`}>
                  +{formatFCFA(consignationAmount)}
                </td>
              </tr>
            )}

            {/* Net à payer réel */}
            <tr
              className="border-t-2 border-slate-900 font-extrabold"
              style={{ backgroundColor: `${currentAccent}14` }}
            >
              <td colSpan={3} className={`${isCompact ? "py-1 px-2 text-[10.5px]" : "py-2.5 px-3"} text-right border-r border-slate-300 text-slate-900 font-black`}>
                {invoiceType === "avoir"
                  ? "NET À DÉDUIRE :"
                  : invoiceType === "proforma"
                  ? "TOTAL GÉNÉRAL ESTIMÉ :"
                  : "NET À PAYER :"}
              </td>
              <td
                className={`${isCompact ? "py-1 px-2 text-xs" : "py-2.5 px-3 text-sm"} text-right font-mono font-black whitespace-nowrap`}
                style={{ color: currentAccent }}
              >
                {formatFCFA(netToPay)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {renderLegalMentions()}
      {renderBankAndPayment()}

      <div className="flex flex-col sm:flex-row items-end justify-between pt-1 gap-2">
        <div className="text-[9px] text-slate-500 space-y-0.5">
          <p>Émise à {activeCompany.city || "Niamey"}, le <strong className="text-slate-700 font-mono">{formatDateFR(issueDate)}</strong></p>
          <p>Mode : <span className="font-semibold text-slate-700">{selectedPaymentMethod}</span></p>
        </div>
        {renderStamp()}
      </div>
    </div>
  );
}
