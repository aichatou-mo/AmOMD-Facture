"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Invoice,
  InvoiceItem,
  Client,
  PaymentMethodType,
  CompanyProfile,
  DEFAULT_COMPANY,
  InvoiceType,
} from "@/lib/mock-data";
import { formatFCFA, calculateTotals } from "@/lib/money";
import {
  IconPlus,
  IconTrash,
  IconPrinter,
  IconDownload,
  IconCheck,
} from "./Icons";
import InvoiceLivePreview from "./InvoiceLivePreview";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { useTranslation } from "@/lib/i18n";

export interface SaveInvoiceOptions {
  navigateTo?: "invoices" | "invoice-detail" | "stay";
}

interface CreateInvoicePageProps {
  clients: Client[];
  companies?: CompanyProfile[];
  activeCompany?: CompanyProfile;
  editingInvoice?: Invoice | null;
  preselectedClientId?: string | null;
  onSaveInvoice: (
    invoice: Invoice,
    options?: SaveInvoiceOptions
  ) => Promise<boolean> | void;
  onNavigateToInvoices?: () => void;
  onNavigateToDetail?: (invoice: Invoice) => void;
  onCancel: () => void;
}

function generateInvoiceNum(type: InvoiceType): string {
  const year = new Date().getFullYear();
  const suffix = String(Math.floor(Math.random() * 9000 + 1000));
  if (type === "avoir") return `AVOIR-${year}-${suffix}`;
  if (type === "proforma") return `PRO-${year}-${suffix}`;
  return `FAC-${year}-${suffix}`;
}

export default function CreateInvoicePage({
  clients,
  activeCompany = DEFAULT_COMPANY,
  editingInvoice,
  preselectedClientId,
  onSaveInvoice,
  onNavigateToInvoices,
  onNavigateToDetail,
  onCancel,
}: CreateInvoicePageProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  const issuerCompany: CompanyProfile = editingInvoice?.company || activeCompany;

  // Étape 1 : Choix vertical du type de facture -> 1 clic ouvre directement l'étape 2
  const [currentStep, setCurrentStep] = useState<"choose-type" | "fill-details">(() =>
    editingInvoice || preselectedClientId ? "fill-details" : "choose-type"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [currentStep]);

  const [invoiceType, setInvoiceType] = useState<InvoiceType>(() => {
    if (editingInvoice?.invoiceType) return editingInvoice.invoiceType;
    if (
      editingInvoice?.number?.startsWith("AVOIR") ||
      editingInvoice?.number?.startsWith("AV-")
    ) {
      return "avoir";
    }
    if (editingInvoice?.number?.startsWith("PRO-")) return "proforma";
    return "doit";
  });

  const [originalInvoiceRef, setOriginalInvoiceRef] = useState<string>(
    editingInvoice?.originalInvoiceRef || ""
  );
  const [avoirReason, setAvoirReason] = useState<string>(
    editingInvoice?.avoirReason || ""
  );
  const [proformaValidityDays, setProformaValidityDays] = useState<number>(
    editingInvoice?.proformaValidityDays || 30
  );

  // Mode client : sélection dans l'annuaire OU saisie directe d'un nouveau client
  const matchedExistingClient = editingInvoice
    ? clients.find(
        (c) => c.name.trim().toLowerCase() === editingInvoice.clientName.trim().toLowerCase()
      )
    : preselectedClientId
    ? clients.find((c) => c.id === preselectedClientId)
    : clients[0];

  const [clientMode, setClientMode] = useState<"existing" | "new">(() => {
    if (editingInvoice && !matchedExistingClient) return "new";
    if (clients.length === 0) return "new";
    return "existing";
  });

  const [selectedClientId, setSelectedClientId] = useState<string>(
    matchedExistingClient?.id || clients[0]?.id || ""
  );

  // Saisie directe d'un client
  const [newClientName, setNewClientName] = useState<string>(
    editingInvoice && !matchedExistingClient ? editingInvoice.clientName : ""
  );
  const [newClientContact, setNewClientContact] = useState<string>(
    editingInvoice && !matchedExistingClient ? (editingInvoice as any).clientContactPerson || "" : ""
  );
  const [newClientNif, setNewClientNif] = useState<string>(
    editingInvoice && !matchedExistingClient ? (editingInvoice as any).clientNif || "" : ""
  );
  const [newClientPhone, setNewClientPhone] = useState<string>(
    editingInvoice && !matchedExistingClient ? editingInvoice.clientPhone || "" : ""
  );
  const [newClientEmail, setNewClientEmail] = useState<string>(
    editingInvoice && !matchedExistingClient ? editingInvoice.clientEmail || "" : ""
  );
  const [newClientCity, setNewClientCity] = useState<string>(
    editingInvoice && !matchedExistingClient ? editingInvoice.clientCity || "" : ""
  );
  const [newClientAddress, setNewClientAddress] = useState<string>(
    editingInvoice && !matchedExistingClient ? editingInvoice.clientAddress || "" : ""
  );

  // Références pour fermeture au clic en dehors
  const deductionsRef = useRef<HTMLDivElement>(null);
  const orderRefsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (deductionsRef.current && !deductionsRef.current.contains(e.target as Node)) {
        setShowAdvancedDeductions(false);
      }
      if (orderRefsRef.current && !orderRefsRef.current.contains(e.target as Node)) {
        setShowOrderRefs(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(preselectedClientId || clients[0].id);
    }
  }, [clients, preselectedClientId, selectedClientId]);

  const isCustomModel = issuerCompany.invoiceTemplateId === "custom";
  const customData = issuerCompany.customInvoiceData;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    editingInvoice?.templateId || issuerCompany.invoiceTemplateId || "tpl-1"
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const defaultDue = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [issueDate, setIssueDate] = useState<string>(
    editingInvoice ? editingInvoice.issueDate : todayStr
  );
  const [dueDate, setDueDate] = useState<string>(
    editingInvoice ? editingInvoice.dueDate : defaultDue
  );

  const [invoiceObject, setInvoiceObject] = useState<string>(
    editingInvoice?.object || ""
  );

  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    editingInvoice?.number || generateInvoiceNum("doit")
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(
    editingInvoice?.paymentMethod ||
      issuerCompany.defaultPaymentMethod ||
      "Mobile Money"
  );
  const [paymentDetail, setPaymentDetail] = useState<string>(
    editingInvoice?.paymentDetail ||
      issuerCompany.defaultPaymentDetail ||
      ""
  );

  // Sections optionnelles repliées par défaut pour garder un formulaire aéré et lumineux
  const [showAdvancedDeductions, setShowAdvancedDeductions] = useState<boolean>(() => {
    if (!editingInvoice) return false;
    return (
      (editingInvoice.discountPercent ?? 0) > 0 ||
      (editingInvoice.escomptePercent ?? 0) > 0 ||
      (editingInvoice.advanceAmount ?? 0) > 0 ||
      (editingInvoice.precompteRate ?? 0) > 0 ||
      (editingInvoice.consignationAmount ?? 0) > 0
    );
  });

  const [showOrderRefs, setShowOrderRefs] = useState<boolean>(() => {
    if (!editingInvoice) return false;
    return Boolean(
      editingInvoice.poNumber ||
        editingInvoice.contractNumber ||
        editingInvoice.vendorNumber ||
        editingInvoice.ltiNumber ||
        editingInvoice.bankAccountRef
    );
  });

  const [poNumber, setPoNumber] = useState<string>(editingInvoice?.poNumber || "");
  const [contractNumber, setContractNumber] = useState<string>(
    editingInvoice?.contractNumber || ""
  );
  const [vendorNumber, setVendorNumber] = useState<string>(
    editingInvoice?.vendorNumber || ""
  );
  const [ltiNumber, setLtiNumber] = useState<string>(
    editingInvoice?.ltiNumber || ""
  );
  const [bankAccountRef, setBankAccountRef] = useState<string>(
    editingInvoice?.bankAccountRef || issuerCompany.bankAccount || ""
  );

  // TVA 100% variable (modifiable librement selon le taux applicable)
  const [taxRate, setTaxRate] = useState<number>(
    editingInvoice?.taxRate ?? issuerCompany.defaultTaxRate ?? 19
  );
  const [discountPercent, setDiscountPercent] = useState<number>(
    editingInvoice?.discountPercent ?? 0
  );
  const [escomptePercent, setEscomptePercent] = useState<number>(
    editingInvoice?.escomptePercent ?? 0
  );
  const [advanceAmount, setAdvanceAmount] = useState<number>(
    editingInvoice?.advanceAmount ?? 0
  );
  const [consignationAmount, setConsignationAmount] = useState<number>(
    editingInvoice?.consignationAmount ?? 0
  );
  const [precompteRate, setPrecompteRate] = useState<number>(
    editingInvoice?.precompteRate ?? editingInvoice?.isbRate ?? 0
  );

  // Lignes de facturation — vierges et propres à la création (aucune donnée fictive)
  const [items, setItems] = useState<
    Array<{
      id: string;
      description: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      currency?: string;
    }>
  >(() => {
    if (editingInvoice && editingInvoice.items && editingInvoice.items.length > 0) {
      return editingInvoice.items.map((it) => ({
        id: it.id,
        description: it.description,
        unit: it.unit || "Unité",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        currency: it.currency || "FCFA",
      }));
    }
    return [
      {
        id: `line-${Date.now()}`,
        description: "",
        unit: "Unité",
        quantity: 1,
        unitPrice: 0,
        currency: "FCFA",
      },
    ];
  });

  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedInvoiceModal, setSavedInvoiceModal] = useState<Invoice | null>(null);

  useEffect(() => {
    if (showPrintModal || savedInvoiceModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showPrintModal, savedInvoiceModal]);

  const selectedClient =
    clientMode === "existing"
      ? clients.find((c) => c.id === selectedClientId) || clients[0]
      : null;

  const resolvedClientName =
    clientMode === "existing"
      ? selectedClient?.name || ""
      : newClientName.trim();
  const resolvedClientEmail =
    clientMode === "existing"
      ? selectedClient?.email || ""
      : newClientEmail.trim();
  const resolvedClientPhone =
    clientMode === "existing"
      ? selectedClient?.phone || ""
      : newClientPhone.trim();
  const resolvedClientCity =
    clientMode === "existing"
      ? selectedClient?.city || ""
      : newClientCity.trim();
  const resolvedClientAddress =
    clientMode === "existing"
      ? selectedClient?.address || ""
      : newClientAddress.trim();

  const totals = calculateTotals(
    items,
    discountPercent,
    taxRate,
    escomptePercent,
    advanceAmount,
    precompteRate,
    consignationAmount
  );

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `line-${Date.now()}-${items.length + 1}`,
        description: "",
        unit: "Unité",
        quantity: 1,
        unitPrice: 0,
        currency: "FCFA",
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: "description" | "unit" | "quantity" | "unitPrice" | "currency",
    value: string | number
  ) => {
    setItems(
      items.map((i) => {
        if (i.id !== id) return i;
        if (field === "description" || field === "unit" || field === "currency") {
          return { ...i, [field]: String(value) };
        }
        if (field === "quantity") {
          const qty = Math.max(0, Number(value) || 0);
          return { ...i, quantity: qty };
        }
        const numeric = Math.max(0, Math.round(Number(value) || 0));
        return { ...i, [field]: numeric };
      })
    );
  };

  // Clic sur un type de facture -> ouvre directement le formulaire
  const handleSelectInvoiceType = (
    newType: InvoiceType,
    autoAdvance: boolean = true
  ) => {
    setInvoiceType(newType);
    if (!editingInvoice) {
      setInvoiceNumber(generateInvoiceNum(newType));
    }
    if (autoAdvance) {
      setCurrentStep("fill-details");
    }
  };

  const loadCustomTemplateValues = () => {
    if (!customData) return;
    if (customData.number) setInvoiceNumber(customData.number);
    if (customData.object) setInvoiceObject(customData.object);
    if (customData.poNumber) setPoNumber(customData.poNumber);
    if (customData.contractNumber) setContractNumber(customData.contractNumber);
    if (customData.vendorNumber) setVendorNumber(customData.vendorNumber);
    if (customData.ltiNumber) setLtiNumber(customData.ltiNumber);
    if (customData.bankAccountRef) setBankAccountRef(customData.bankAccountRef);
    if (customData.paymentMethod) setPaymentMethod(customData.paymentMethod);
    if (customData.paymentDetail) setPaymentDetail(customData.paymentDetail);
    if (customData.taxRate !== undefined) setTaxRate(customData.taxRate);
    if (customData.discountPercent !== undefined)
      setDiscountPercent(customData.discountPercent);
    if (customData.precompteRate !== undefined)
      setPrecompteRate(customData.precompteRate);
    if (customData.items && customData.items.length > 0) {
      setItems(
        customData.items.map((it, idx) => ({
          id: it.id || `custom-${idx + 1}`,
          description: it.description,
          unit: it.unit || "Unité",
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          currency: it.currency || "FCFA",
        }))
      );
    }
    setSelectedTemplateId("custom");
  };

  const handleSave = async (status: "brouillon" | "envoyee") => {
    setFormError(null);

    if (!resolvedClientName) {
      setFormError(
        "Veuillez sélectionner un client ou saisir le nom du client destinataire."
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const formattedItems: InvoiceItem[] = items.map((i, idx) => {
      const qty = Number(i.quantity) || 1;
      const up = Math.round(Number(i.unitPrice) || 0);
      return {
        id: i.id || `it-${Date.now()}-${idx}`,
        description:
          i.description.trim() ||
          (invoiceType === "avoir" ? "Ligne d'avoir" : "Prestation / Article"),
        unit: i.unit || "Unité",
        quantity: qty,
        unitPrice: up,
        totalHT: Math.round(qty * up),
        currency: i.currency || "FCFA",
      };
    });

    const newInvoice: Invoice = {
      id: editingInvoice?.id || `inv-${Date.now()}`,
      number: invoiceNumber.trim() || generateInvoiceNum(invoiceType),
      invoiceType,
      originalInvoiceRef:
        invoiceType === "avoir" ? originalInvoiceRef.trim() || undefined : undefined,
      avoirReason:
        invoiceType === "avoir" ? avoirReason.trim() || undefined : undefined,
      proformaValidityDays:
        invoiceType === "proforma" ? proformaValidityDays : undefined,
      company: issuerCompany,
      companyName: issuerCompany.name,
      clientName: resolvedClientName,
      clientContactPerson:
        clientMode === "existing"
          ? selectedClient?.contactPerson || undefined
          : newClientContact.trim() || undefined,
      clientNif:
        clientMode === "existing"
          ? (selectedClient as any)?.nif || undefined
          : newClientNif.trim() || undefined,
      clientEmail: resolvedClientEmail,
      clientPhone: resolvedClientPhone,
      clientCity: resolvedClientCity,
      clientAddress: resolvedClientAddress || undefined,
      object: invoiceObject.trim() || undefined,
      issueDate,
      dueDate,
      status: editingInvoice
        ? status === "brouillon"
          ? "brouillon"
          : editingInvoice.status
        : status,
      poNumber: poNumber.trim() || undefined,
      contractNumber: contractNumber.trim() || undefined,
      vendorNumber: vendorNumber.trim() || undefined,
      ltiNumber: ltiNumber.trim() || undefined,
      bankAccountRef: bankAccountRef.trim() || undefined,
      subtotalHT: totals.rawSubtotalHT,
      discountPercent,
      discountAmount: totals.discountAmount,
      netCommercial: totals.netCommercial,
      escomptePercent,
      escompteAmount: totals.escompteAmount,
      netFinancier: totals.netFinancier,
      advanceAmount,
      taxableHT: totals.subtotalHT,
      taxRate,
      taxAmount: totals.taxAmount,
      totalTTC: totals.totalTTC,
      consignationAmount: totals.consignationAmount,
      precompteRate,
      precompteAmount: totals.precompteAmount,
      netToPay: totals.netToPay,
      paidAmount: editingInvoice?.paidAmount || 0,
      paymentMethod,
      paymentDetail: paymentDetail.trim() || undefined,
      templateId: selectedTemplateId,
      items: formattedItems,
    };

    try {
      setIsSaving(true);
      const result = await onSaveInvoice(newInvoice, { navigateTo: "stay" });
      if (result !== false) {
        setSavedInvoiceModal(newInvoice);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const previewInvoiceData: Partial<Invoice> = {
    templateId: selectedTemplateId,
    number: invoiceNumber,
    invoiceType,
    originalInvoiceRef: invoiceType === "avoir" ? originalInvoiceRef : undefined,
    avoirReason: invoiceType === "avoir" ? avoirReason : undefined,
    proformaValidityDays:
      invoiceType === "proforma" ? proformaValidityDays : undefined,
    company: issuerCompany,
    companyName: issuerCompany.name,
    clientName: resolvedClientName || "Nom du client",
    clientContactPerson:
      clientMode === "existing"
        ? selectedClient?.contactPerson
        : newClientContact.trim(),
    clientNif:
      clientMode === "existing"
        ? (selectedClient as any)?.nif
        : newClientNif.trim(),
    clientEmail: resolvedClientEmail,
    clientPhone: resolvedClientPhone,
    clientCity: resolvedClientCity,
    clientAddress: resolvedClientAddress,
    object: invoiceObject || "Objet de la facture",
    issueDate,
    dueDate,
    paymentMethod,
    paymentDetail,
    poNumber,
    contractNumber,
    vendorNumber,
    ltiNumber,
    bankAccountRef,
    subtotalHT: totals.rawSubtotalHT,
    discountPercent,
    discountAmount: totals.discountAmount,
    netCommercial: totals.netCommercial,
    escomptePercent,
    escompteAmount: totals.escompteAmount,
    netFinancier: totals.netFinancier,
    advanceAmount,
    taxableHT: totals.subtotalHT,
    taxRate,
    taxAmount: totals.taxAmount,
    totalTTC: totals.totalTTC,
    consignationAmount: totals.consignationAmount,
    precompteRate,
    precompteAmount: totals.precompteAmount,
    netToPay: totals.netToPay,
    items: items.map((it) => ({
      id: it.id,
      description: it.description || "Désignation de la prestation",
      unit: it.unit || "Unité",
      quantity: Number(it.quantity) || 1,
      unitPrice: Math.round(Number(it.unitPrice) || 0),
      totalHT: Math.round((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)),
      currency: it.currency || "FCFA",
    })),
  };

  const handlePrint = () => {
    if (mobileTab === "form") {
      setMobileTab("preview");
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadPdf = () => {
    downloadInvoicePdf(previewInvoiceData as Invoice, issuerCompany);
  };

  // =========================================================================
  // ÉTAPE 1 : DISPOSITION VERTICALE DES 3 TYPES DE FACTURES (1 CLIC DIRECT)
  // Ordre : 1. Facture standard (Doit) -> 2. Facture d'Avoir -> 3. Facture Proforma
  // =========================================================================
  if (currentStep === "choose-type") {
    const verticalTypes: Array<{
      type: InvoiceType;
      stepNum: string;
      title: string;
      desc: string;
      prefix: string;
      badgeBg: string;
    }> = [
      {
        type: "doit",
        stepNum: "01",
        title: "Facture standard (Doit)",
        desc: "Facture commerciale définitive pour une vente de produits ou une prestation de services.",
        prefix: "FAC-",
        badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      {
        type: "avoir",
        stepNum: "02",
        title: "Facture d'Avoir",
        desc: "Document rectificatif suite à un retour de marchandises, une remise ou une annulation.",
        prefix: "AVOIR-",
        badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      },
      {
        type: "proforma",
        stepNum: "03",
        title: "Facture Proforma",
        desc: "Devis chiffré et offre commerciale prévisionnelle avant validation client.",
        prefix: "PRO-",
        badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
      },
    ];

    return (
      <div className="max-w-2xl mx-auto py-2 sm:py-6 space-y-5 animate-fade-in">
        {/* En-tête épuré et professionnel sans cadre superflu */}
        <div className="flex items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Choisissez le type de facture
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sélectionnez le document à émettre pour ouvrir directement le formulaire de saisie.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer"
          >
            {t.cancel || "Annuler"}
          </button>
        </div>

        {/* Liste verticale : Doit (Haut), Avoir (Milieu), Proforma (Bas) */}
        <div className="flex flex-col gap-3.5">
          {verticalTypes.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => handleSelectInvoiceType(item.type, true)}
              className="group w-full text-left bg-white hover:bg-slate-900 text-slate-800 hover:text-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 hover:border-slate-900 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.05)] hover:shadow-xl hover:shadow-slate-900/15 transition-all duration-150 active:scale-[0.99] flex items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 group-hover:bg-slate-800 text-slate-900 group-hover:text-emerald-400 font-mono font-extrabold text-sm flex items-center justify-center shrink-0 transition-colors">
                  {item.stepNum}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-white transition-colors">
                      {item.title}
                    </h2>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-colors group-hover:bg-slate-800 group-hover:text-emerald-400 group-hover:border-emerald-500/30 ${item.badgeBg}`}
                    >
                      {item.prefix}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-300 mt-1 leading-relaxed transition-colors">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-slate-50 group-hover:bg-emerald-500 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 font-bold transition-all">
                →
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // ÉTAPE 2 : FORMULAIRE AÉRÉ, LUMINEUX & APERÇU EN DIRECT
  // =========================================================================
  const quickTaxRates = [0, 5, 10, 18, 19];

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-16">
      {/* En-tête lumineux et épuré */}
      <div className="bg-white px-5 py-4 sm:px-6 sm:py-5 rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {!editingInvoice ? (
              <button
                type="button"
                onClick={() => setCurrentStep("choose-type")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition active:scale-95"
              >
                <span>←</span>
                <span>Changer de type</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition active:scale-95"
              >
                <span>←</span>
                <span>{t.invoices || "Factures"}</span>
              </button>
            )}
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-emerald-700">
              {invoiceType === "doit" && "Facture de vente standard (Doit)"}
              {invoiceType === "avoir" && "Facture d'Avoir rectificative"}
              {invoiceType === "proforma" && "Facture Proforma / Devis"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {editingInvoice
              ? `Modifier la facture ${editingInvoice.number}`
              : "Nouvelle facture"}
          </h1>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          {t.cancel || "Annuler"}
        </button>
      </div>

      {/* Message d'erreur de validation éventuel */}
      {formError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-fade-in no-print">
          <span>{formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Switcher Mobile Formulaire / Aperçu */}
      <div className="flex xl:hidden bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm sticky top-16 z-30 no-print">
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 active:scale-95 ${
            mobileTab === "form"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Saisie de la facture
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-150 active:scale-95 ${
            mobileTab === "preview"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Aperçu du document
        </button>
      </div>

      {/* Grille Principale Aérée : Formulaire à gauche, Aperçu en direct à droite */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* COLONNE GAUCHE : FORMULAIRE LUMINEUX */}
        <div
          className={`xl:col-span-6 space-y-6 no-print print:hidden form-print-hidden ${
            mobileTab === "preview" ? "hidden xl:block" : "block"
          }`}
        >
          {/* Bloc contextuel Facture d'Avoir */}
          {invoiceType === "avoir" && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-sky-200/90 shadow-[0_6px_24px_-6px_rgba(14,165,233,0.08)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Référence & Motif de l&apos;Avoir
                </h2>
                <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  Facture rectificative
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    N° de facture d&apos;origine
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : FAC-2026-1024"
                    value={originalInvoiceRef}
                    onChange={(e) => setOriginalInvoiceRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Motif de l&apos;avoir
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : Retour de marchandises, remise..."
                    value={avoirReason}
                    onChange={(e) => setAvoirReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bloc contextuel Facture Proforma */}
          {invoiceType === "proforma" && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-violet-200/90 shadow-[0_6px_24px_-6px_rgba(139,92,246,0.08)] space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900">
                  Validité de la Facture Proforma
                </h2>
                <span className="text-[11px] font-mono font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
                  Offre chiffrée
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[15, 30, 45, 60, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setProformaValidityDays(days)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition active:scale-95 ${
                      proformaValidityDays === days
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {days} jours
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CARTE 1 : CLIENT DESTINATAIRE */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.04)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Client destinataire
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sélectionnez un client enregistré ou saisissez un nouveau client.
                </p>
              </div>

              {clients.length > 0 && (
                <div className="inline-flex bg-slate-100 p-1 rounded-xl self-start">
                  <button
                    type="button"
                    onClick={() => setClientMode("existing")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                      clientMode === "existing"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Annuaire ({clients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode("new")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                      clientMode === "new"
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    + Nouveau client
                  </button>
                </div>
              )}
            </div>

            {clientMode === "existing" && clients.length > 0 ? (
              <div className="space-y-3">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.contactPerson ? ` (${c.contactPerson})` : ""}
                      {c.city ? ` — ${c.city}` : ""}
                    </option>
                  ))}
                </select>

                {selectedClient && (
                  <div className="px-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Raison sociale / Client</span>
                      <strong className="text-slate-900">{selectedClient.name}</strong>
                    </div>
                    {selectedClient.contactPerson && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Interlocuteur</span>
                        <strong className="text-slate-800">{selectedClient.contactPerson}</strong>
                      </div>
                    )}
                    {(selectedClient as any)?.nif && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">NIF Client</span>
                        <span className="font-mono font-bold text-slate-800">{(selectedClient as any).nif}</span>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Téléphone</span>
                        <span className="font-mono">{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.email && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                        <span>{selectedClient.email}</span>
                      </div>
                    )}
                    {(selectedClient.city || selectedClient.address) && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Ville & Adresse</span>
                        <span>{[selectedClient.address, selectedClient.city].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Raison sociale / Entreprise du client *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : Société Sahel Énergie SARL"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nom de l&apos;interlocuteur / Responsable client
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : M. Amadou Moussa"
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Téléphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex : +227 90 00 00 00"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIF Client (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : 54291/R"
                    value={newClientNif}
                    onChange={(e) => setNewClientNif(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@client.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : Niamey, Diffa, Agadez..."
                    value={newClientCity}
                    onChange={(e) => setNewClientCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Adresse physique
                  </label>
                  <input
                    type="text"
                    placeholder="Quartier, rue, porte ou boîte postale"
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CARTE 2 : INFORMATIONS DE LA FACTURE */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.04)] space-y-5">
            <h2 className="text-base font-extrabold text-slate-900">
              Informations générales
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Numéro de facture
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mode de paiement
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                >
                  <option value="Mobile Money">Mobile Money (Airtel, Moov, MyNita, Amanata)</option>
                  <option value="Carte Bancaire">Carte Bancaire (Visa, Mastercard, GIM-UEMOA)</option>
                  <option value="Carte de Crédit">Carte de Crédit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date d&apos;émission
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date d&apos;échéance
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Objet / Désignation de la facture</span>
                  <span className="text-[11px] text-slate-400 font-normal">Synonyme de la prestation / fourniture</span>
                </label>
                <input
                  type="text"
                  value={invoiceObject}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInvoiceObject(val);
                    if (items.length === 1 && (!items[0].description || items[0].description === invoiceObject)) {
                      handleUpdateItem(items[0].id, "description", val);
                    }
                  }}
                  placeholder="Ex : Fourniture de sacs de ciment, Session de formation, Transport de vivres..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition"
                />
              </div>
            </div>
          </div>

          {/* CARTE 3 : LIGNES DE PRESTATIONS / ARTICLES */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.04)] space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Détail des prestations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajoutez vos articles ou services facturés en FCFA.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95 shrink-0"
              >
                <IconPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ajouter une ligne</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const lineTotal = Math.round(
                  (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                );
                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3.5 transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Ligne {index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                          <span>Retirer</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Désignation
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItem(item.id, "description", e.target.value)
                          }
                          placeholder="Description du produit ou de la prestation"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Unité
                          </label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "unit", e.target.value)
                            }
                            placeholder="Unité, Jour, Forfait..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Quantité
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(item.id, "quantity", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Prix Unitaire (FCFA)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.unitPrice || ""}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateItem(item.id, "unitPrice", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-xs">
                      <span className="text-slate-500">Montant HT de la ligne</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {formatFCFA(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTIONS OPTIONNELLES DÉDUCTIBLES & MARCHÉS (AVEC FERMETURE AUTOMATIQUE AU CLIC DEHORS) */}
          <div className="space-y-3.5">
            {/* Remise, Escompte, Acompte & Précompte */}
            <div ref={deductionsRef} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvancedDeductions(!showAdvancedDeductions)}
                className="w-full py-2 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between transition cursor-pointer"
              >
                <span>Remise, Escompte, Acompte & Précompte ISB (Optionnel)</span>
                <span className="font-mono text-slate-500 text-sm">
                  {showAdvancedDeductions ? "−" : "+"}
                </span>
              </button>

              {showAdvancedDeductions && (
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs animate-fade-in">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Remise commerciale (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={discountPercent || ""}
                      placeholder="0"
                      onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Escompte de règlement (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={escomptePercent || ""}
                      placeholder="0"
                      onChange={(e) => setEscomptePercent(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Acompte / Avance versée (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={advanceAmount || ""}
                      placeholder="0"
                      onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Précompte fiscal / ISB (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={precompteRate || ""}
                      placeholder="Ex : 0, 2, 5"
                      onChange={(e) => setPrecompteRate(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Consignation d&apos;emballages (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={consignationAmount || ""}
                      placeholder="0"
                      onChange={(e) => setConsignationAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Récapitulatif dynamique du décompte en cascade SYSCOHADA */}
                  {(discountPercent > 0 || escomptePercent > 0 || advanceAmount > 0 || precompteRate > 0) && (
                    <div className="sm:col-span-2 p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                        <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <span>📐</span>
                          <span>Décompte en cascade (Norme SYSCOHADA)</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                          Niger / UEMOA
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Total Brut HT :</span>
                        <span className="font-mono font-bold text-slate-900">{formatFCFA(totals.rawSubtotalHT)}</span>
                      </div>
                      {totals.discountAmount > 0 && (
                        <>
                          <div className="flex justify-between text-rose-700">
                            <span>Remise ({totals.discountPercent}%) :</span>
                            <span className="font-mono font-bold">-{formatFCFA(totals.discountAmount)}</span>
                          </div>
                          <div className="flex justify-between py-0.5 px-2 bg-white rounded text-emerald-950 font-extrabold border border-emerald-200/60">
                            <span>➔ Net Commercial :</span>
                            <span className="font-mono">{formatFCFA(totals.netCommercial)}</span>
                          </div>
                        </>
                      )}
                      {totals.escompteAmount > 0 && (
                        <>
                          <div className="flex justify-between text-rose-700">
                            <span>Escompte ({totals.escomptePercent}%) :</span>
                            <span className="font-mono font-bold">-{formatFCFA(totals.escompteAmount)}</span>
                          </div>
                          <div className="flex justify-between py-0.5 px-2 bg-white rounded text-blue-950 font-extrabold border border-blue-200/60">
                            <span>➔ Net Financier :</span>
                            <span className="font-mono">{formatFCFA(totals.netFinancier)}</span>
                          </div>
                        </>
                      )}
                      {totals.advanceAmount > 0 && (
                        <div className="flex justify-between text-indigo-700">
                          <span>Avance déduite :</span>
                          <span className="font-mono font-bold">-{formatFCFA(totals.advanceAmount)}</span>
                        </div>
                      )}
                      {(totals.discountAmount > 0 || totals.escompteAmount > 0 || totals.advanceAmount > 0) && (
                        <div className="flex justify-between text-slate-800 font-bold border-t border-emerald-200 pt-1">
                          <span>Montant HT imposable :</span>
                          <span className="font-mono">{formatFCFA(totals.subtotalHT)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-700">
                        <span>TVA ({taxRate}%) :</span>
                        <span className="font-mono font-bold">{formatFCFA(totals.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between py-0.5 px-2 bg-white rounded text-slate-950 font-black border border-slate-200">
                        <span>Total TTC :</span>
                        <span className="font-mono">{formatFCFA(totals.totalTTC)}</span>
                      </div>
                      {totals.precompteAmount > 0 && (
                        <div className="flex justify-between text-amber-800">
                          <span>Précompte ({totals.precompteRate}%) :</span>
                          <span className="font-mono font-bold">-{formatFCFA(totals.precompteAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-emerald-300 text-sm">
                        <span>Net à payer estimé :</span>
                        <span className="font-mono text-emerald-800">{formatFCFA(totals.netToPay)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Références Bon de Commande / Marché */}
            <div ref={orderRefsRef} className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <button
                type="button"
                onClick={() => setShowOrderRefs(!showOrderRefs)}
                className="w-full py-2 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between transition cursor-pointer"
              >
                <span>Références Bon de Commande / Contrat / Compte (Optionnel)</span>
                <span className="font-mono text-slate-500 text-sm">
                  {showOrderRefs ? "−" : "+"}
                </span>
              </button>

              {showOrderRefs && (
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs animate-fade-in">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      N° Bon de Commande (PO)
                    </label>
                    <input
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      N° de Contrat / Marché
                    </label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      N° Fournisseur (Vendor ID)
                    </label>
                    <input
                      type="text"
                      value={vendorNumber}
                      onChange={(e) => setVendorNumber(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Référence LTI / Livraison
                    </label>
                    <input
                      type="text"
                      value={ltiNumber}
                      onChange={(e) => setLtiNumber(e.target.value)}
                      placeholder="Optionnel"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">
                      Coordonnées de paiement affichées (Mobile Money / RIB)
                    </label>
                    <input
                      type="text"
                      value={bankAccountRef}
                      onChange={(e) => setBankAccountRef(e.target.value)}
                      placeholder="Ex : Airtel Money +227 ... ou RIB bancaire"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARTE TVA VARIABLE & RÉSUMÉ FINANCIER DANS LE FORMULAIRE */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.04)] space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-sm font-extrabold text-slate-900">
                  TVA variable (%)
                </label>
                <p className="text-xs text-slate-500">
                  Modifiez le taux de TVA en direct pour recalculer les totaux
                </p>
              </div>
              <div className="relative w-28 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTaxRate(Number.isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
                  }}
                  className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-extrabold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            {/* Quick tax rate pills */}
            <div className="flex flex-wrap items-center gap-2">
              {quickTaxRates.map((rate) => {
                const active = Number(taxRate) === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTaxRate(rate)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition active:scale-95 ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {rate}%
                  </button>
                );
              })}
            </div>

            {/* Décomposition financière en direct */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total HT</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatFCFA(totals.rawSubtotalHT)}
                </span>
              </div>

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Remise ({discountPercent}%)</span>
                  <span className="font-mono font-bold">
                    - {formatFCFA(totals.discountAmount)}
                  </span>
                </div>
              )}

              {totals.escompteAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Escompte ({escomptePercent}%)</span>
                  <span className="font-mono font-bold">
                    - {formatFCFA(totals.escompteAmount)}
                  </span>
                </div>
              )}

              {totals.advanceAmount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Acompte déduit</span>
                  <span className="font-mono font-bold">
                    - {formatFCFA(totals.advanceAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>TVA ({taxRate}%)</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatFCFA(totals.taxAmount)}
                </span>
              </div>

              <div className="flex justify-between text-slate-800 font-bold pt-1.5 border-t border-slate-200/70">
                <span>Total TTC</span>
                <span className="font-mono">{formatFCFA(totals.totalTTC)}</span>
              </div>

              {totals.precompteAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Précompte ({precompteRate}%)</span>
                  <span className="font-mono font-bold">
                    - {formatFCFA(totals.precompteAmount)}
                  </span>
                </div>
              )}

              <div className="pt-2.5 border-t-2 border-slate-200 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">
                  {invoiceType === "avoir"
                    ? "Net à déduire"
                    : invoiceType === "proforma"
                    ? "Montant Proforma Net"
                    : "Net à payer"}
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 whitespace-nowrap">
                  {formatFCFA(totals.netToPay)}
                </span>
              </div>
            </div>
          </div>

          {/* BARRE FINALE D'ENREGISTREMENT EN BAS DU FORMULAIRE */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-[0_6px_24px_-6px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition active:scale-95 text-center cursor-pointer"
            >
              {t.cancel || "Annuler"}
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave("brouillon")}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 disabled:opacity-50 text-center cursor-pointer"
              >
                Enregistrer comme brouillon
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSave("envoyee")}
                className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-slate-900/15 transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <IconCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {isSaving ? "Enregistrement en cours..." : "Enregistrer la facture"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : APERÇU OFFICIEL DU DOCUMENT EN DIRECT (PUR ET NET) */}
        <div
          className={`xl:col-span-6 xl:sticky xl:top-20 space-y-4 preview-print-column print:block print:w-full print:static print:p-0 ${
            mobileTab === "form" ? "hidden xl:block" : "block"
          }`}
        >
          {/* Barre d'outils du document : Modèles & Exportation rapide */}
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "tpl-1", label: "Standard" },
                { id: "tpl-2", label: "Moderne" },
                { id: "tpl-3", label: "Entreprise" },
                { id: "tpl-4", label: "Épuré" },
                ...(isCustomModel || issuerCompany.customTemplateFileName
                  ? [{ id: "custom", label: "Personnalisé" }]
                  : []),
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                title="Imprimer directement"
              >
                <IconPrinter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Télécharger en PDF"
              >
                <IconDownload className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Télécharger PDF</span>
              </button>
            </div>
          </div>

          <div className="w-full overflow-x-auto no-scrollbar print:overflow-visible">
            <InvoiceLivePreview
              invoice={previewInvoiceData}
              company={issuerCompany}
              templateId={selectedTemplateId}
            />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODALE DE CONFIRMATION APRÈS ENREGISTREMENT : CHOIX PDF OU FACTURES   */}
      {/* ===================================================================== */}
      {mounted &&
        savedInvoiceModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 no-print">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => {
                setSavedInvoiceModal(null);
                if (onNavigateToInvoices) onNavigateToInvoices();
              }}
            />

            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 animate-fade-in z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <IconCheck className="w-7 h-7" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Facture enregistrée avec succès !
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Votre facture{" "}
                  <strong className="font-mono text-slate-900">
                    {savedInvoiceModal.number}
                  </strong>{" "}
                  pour <strong className="text-slate-900">{savedInvoiceModal.clientName}</strong>{" "}
                  a bien été sauvegardée dans votre compte.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Montant Net
                </span>
                <span className="text-lg font-black font-mono text-emerald-700">
                  {formatFCFA(savedInvoiceModal.netToPay || savedInvoiceModal.totalTTC)}
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const inv = savedInvoiceModal;
                    downloadInvoicePdf(inv, issuerCompany);
                    setSavedInvoiceModal(null);
                    if (onNavigateToInvoices) onNavigateToInvoices();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-slate-900/20 transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <IconDownload className="w-4 h-4 text-emerald-400" />
                  <span>Télécharger en PDF et voir mes factures</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSavedInvoiceModal(null);
                    if (onNavigateToInvoices) onNavigateToInvoices();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
                >
                  Aller à la liste des factures
                </button>

                {onNavigateToDetail && (
                  <button
                    type="button"
                    onClick={() => {
                      const inv = savedInvoiceModal;
                      setSavedInvoiceModal(null);
                      onNavigateToDetail(inv);
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
                  >
                    Ouvrir l&apos;aperçu détaillé
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modale d'Aperçu A4 */}
      {mounted &&
        showPrintModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] overflow-y-auto no-print">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowPrintModal(false)}
            />
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
              <div className="relative rounded-3xl bg-slate-100 text-left shadow-2xl w-full max-w-4xl border border-slate-200 animate-fade-in flex flex-col max-h-[92vh]">
                <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200 rounded-t-3xl shrink-0">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Aperçu A4 — {invoiceNumber}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mise en page officielle prête pour PDF ou impression
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrintModal(false);
                        setTimeout(() => handlePrint(), 150);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95 flex items-center gap-2"
                    >
                      <IconPrinter className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Imprimer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPrintModal(false)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto modal-scrollbar p-3 sm:p-6 bg-slate-200/60 flex justify-center">
                  <div className="w-full max-w-[210mm] shadow-2xl rounded-sm bg-white border border-slate-300 overflow-hidden">
                    <InvoiceLivePreview
                      invoice={previewInvoiceData}
                      company={issuerCompany}
                      templateId={selectedTemplateId}
                      isCompact={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
