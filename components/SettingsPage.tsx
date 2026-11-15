"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CompanyProfile,
  DEFAULT_TEAM_MEMBERS,
  DEFAULT_REGION_SETTINGS,
  AFRICAN_COUNTRIES,
  RegionSettings,
  TeamMember,
  PaymentMethodType,
  Invoice,
  InvoiceItem,
} from "@/lib/mock-data";
import { IconCheck, IconClose, IconTrash, IconSearch, IconGlobe } from "./Icons";
import InvoiceLivePreview from "./InvoiceLivePreview";
import OfficeColorPicker from "./OfficeColorPicker";
import { useTranslation, Language } from "@/lib/i18n";
import { AVAILABLE_LANGUAGES } from "./GlobeLanguageSelector";
import { formatFCFA } from "@/lib/money";

interface SettingsPageProps {
  companies?: CompanyProfile[];
  activeCompany: CompanyProfile;
  onSelectCompany?: (company: CompanyProfile) => void;
  onSaveCompany: (updated: CompanyProfile) => void;
  onAddCompany?: (newComp: CompanyProfile) => void;
  onDeleteCompany?: (id: string) => void;
  showToast: (msg: string) => void;
  onCreateInvoiceWithTemplate?: (templateId: string) => void;
}

// 4 tabs: Profil de l'entreprise, Modèles de facturation (dédié), Régional & Devises, Équipe & Accès
type TabId = "profile" | "templates" | "region" | "team";

const INVOICE_TEMPLATES = [
  {
    id: "tpl-1",
    name: "Modèle Standard",
    tag: "Classique",
    description: "Format sobre, officiel et conforme OHADA.",
    preview: "📄",
    color: "from-[#111522] to-[#191f30]",
  },
  {
    id: "tpl-2",
    name: "Modèle Moderne",
    tag: "Élégant",
    description: "En-tête stylisée et mise en valeur du logo.",
    preview: "💎",
    color: "from-[#111522] to-[#1d253d]",
  },
  {
    id: "tpl-3",
    name: "Modèle Entreprise",
    tag: "Corporate",
    description: "Bandeau sombre Bleu Nuit et colonnes nettes.",
    preview: "🏢",
    color: "from-[#0c111d] to-[#111522]",
  },
  {
    id: "tpl-4",
    name: "Modèle Minimaliste",
    tag: "Épuré",
    description: "Présentation aérée et typographie fluide.",
    preview: "📑",
    color: "from-[#111522] to-[#232b42]",
  },
];

const INVOICE_PALETTES = [
  { name: "Vert Émeraude (Signature)", hex: "#059669" },
  { name: "Vert Forêt", hex: "#15803D" },
  { name: "Teal Sahélien", hex: "#0D9488" },
  { name: "Bleu Nuit (Signature)", hex: "#111522" },
  { name: "Bleu Sahel", hex: "#1D4ED8" },
  { name: "Bleu Indigo", hex: "#4338CA" },
  { name: "Violet Impérial", hex: "#7C3AED" },
  { name: "Pourpre Royal", hex: "#9333EA" },
  { name: "Rouge Brique", hex: "#DC2626" },
  { name: "Bordeaux Sombre", hex: "#991B1B" },
  { name: "Or Safran", hex: "#D97706" },
  { name: "Jaune Or", hex: "#ffdc45" },
];

export function generateAccessCode(prefix: string = "AMF"): string {
  const clean = (prefix || "AMF").replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase() || "AMF";
  const num1 = Math.floor(1000 + Math.random() * 9000);
  const num2 = Math.floor(100 + Math.random() * 900);
  return `${clean}-${num1}-${num2}`;
}

function buildDefaultTeam(company: CompanyProfile): TeamMember[] {
  const ownerName = company.signatory || company.name || "Titulaire du compte";
  const initials = (company.shortName || company.name || "PR").substring(0, 2).toUpperCase();
  const ownerPrefix = (company.shortName || company.name || "SARL").replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
  const ownerCode = `MASTER-${ownerPrefix || "SARL"}-${Math.floor(1000 + Math.random() * 9000)}`;
  return [
    {
      id: "owner-tenant",
      name: ownerName,
      email: company.email || "contact@amomd-facture.com",
      role: "Chef d'entreprise",
      status: "Actif",
      avatarBg: "bg-[#111522]",
      avatarText: initials,
      lastActive: "En ligne maintenant",
      isOwner: true,
      accessCode: ownerCode,
      permissions: {
        canCreateInvoice: true,
        canDeleteInvoice: true,
        canValidatePayment: true,
        canEditSettings: true,
        canManageTeam: true,
        canViewReports: true,
        canExport: true,
      },
    },
  ];
}

export default function SettingsPage({
  activeCompany,
  onSaveCompany,
  showToast,
  onCreateInvoiceWithTemplate,
}: SettingsPageProps) {
  const { t, lang, setLang } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [formData, setFormData] = useState<CompanyProfile>(activeCompany);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => buildDefaultTeam(activeCompany));
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    activeCompany.invoiceTemplateId || "tpl-1"
  );
  const [accentColor, setAccentColor] = useState<string>(
    activeCompany.invoiceAccentColor || "#059669"
  );
  const [showStampOnInvoice, setShowStampOnInvoice] = useState<boolean>(
    activeCompany.showStampOnInvoice ?? true
  );
  const [showBankDetails, setShowBankDetails] = useState<boolean>(
    activeCompany.showBankDetailsOnInvoice ?? true
  );
  const [showLegalMentions, setShowLegalMentions] = useState<boolean>(
    activeCompany.showLegalMentionsOnInvoice ?? true
  );
  const [customTemplateFile, setCustomTemplateFile] = useState<{
    name: string;
    size: string;
    uploadedAt: string;
    previewUrl?: string;
    mime?: string;
  } | null>(
    activeCompany.customTemplateFileName
      ? {
        name: activeCompany.customTemplateFileName,
        size: "840 Ko",
        uploadedAt: "Importé",
        previewUrl: activeCompany.customTemplateUrl,
        mime: activeCompany.customTemplateMime,
      }
      : null
  );
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string>(
    activeCompany.invoiceTemplateId || "tpl-1"
  );
  const [modalEditMode, setModalEditMode] = useState<boolean>(false);
  const [isEditingCustomData, setIsEditingCustomData] = useState<boolean>(false);
  const [customMenuOpen, setCustomMenuOpen] = useState<boolean>(false);
  const customMenuRef = useRef<HTMLDivElement>(null);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethodType>(
    (formData.defaultPaymentMethod as PaymentMethodType) || "Carte de Crédit"
  );
  const [defaultPaymentDetail, setDefaultPaymentDetail] = useState<string>(
    formData.defaultPaymentDetail || formData.bankAccount || "SONIBANK Niamey — Compte N° 041029481001/45"
  );
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewInvoiceCardRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const [previewViewMode, setPreviewViewMode] = useState<"fit" | "full">("fit");
  const [previewScale, setPreviewScale] = useState<number>(1);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isTemplateSaved, setIsTemplateSaved] = useState<boolean>(false);
  const [isProfileSaved, setIsProfileSaved] = useState<boolean>(false);

  // Données modifiables de la facture personnalisée importée
  const [customInvoiceData, setCustomInvoiceData] = useState<Partial<Invoice>>(() => {
    return (
      activeCompany.customInvoiceData || {
        number: "DA/0014/2026/MO",
        clientName: "Programme Alimentaire Mondiale",
        clientCity: "Maine Soroa",
        object: "Transport des vivres de Diffa to Maine Soroa",
        poNumber: "4700795005",
        vendorNumber: "50045826",
        contractNumber: "DA/LOG/149-15A...MO",
        ltiNumber: "7700776450/7700784099/7700780024",
        paymentMethod: "Mobile Money",
        paymentDetail: "SONIBANK Niamey — Compte N° 041029481001/45",
        bankAccountRef: "041029481001/45",
        issueDate: "2026-04-09",
        dueDate: "2026-05-09",
        status: "envoyee",
        subtotalHT: 9350000,
        taxRate: 0,
        taxAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        precompteRate: 0,
        precompteAmount: 0,
        totalTTC: 9350000,
        netToPay: 9350000,
        items: [
          {
            id: "pam-1",
            description: "Transport des vivres de Diffa to Maine Soroa (Céréales / Vivres)",
            unit: "MT",
            quantity: 350,
            unitPrice: 25000,
            totalHT: 8750000,
            currency: "FCFA",
          },
          {
            id: "pam-2",
            description: "Manutention, déchargement et reconditionnement magasins PAM",
            unit: "VOYAGE",
            quantity: 4,
            unitPrice: 150000,
            totalHT: 600000,
            currency: "FCFA",
          },
        ],
      }
    );
  });

  useEffect(() => {
    setMounted(true);
    try {
      const savedTeam = window.localStorage.getItem("izifacture_team_members");
      const owner = buildDefaultTeam(activeCompany)[0];
      if (savedTeam) {
        const parsed = JSON.parse(savedTeam) as TeamMember[];
        // Filtrer strictement toutes les données fictives / mock (Ibrahim Salifou, Aïchatou Garba, @sahel-tech.ne)
        const collaborators = parsed
          .filter(
            (m) =>
              !m.isOwner &&
              m.name !== "Amadou Diallo" &&
              m.name !== "Ibrahim Salifou" &&
              m.name !== "Aïchatou Garba" &&
              !m.email?.toLowerCase().includes("@sahel-tech.ne") &&
              m.id !== "team-2" &&
              m.id !== "team-3"
          )
          .map((m) => ({
            ...m,
            accessCode: m.accessCode || generateAccessCode(activeCompany.shortName || activeCompany.name || "COLLAB"),
          }));
        setTeamMembers([owner, ...collaborators]);
        window.localStorage.setItem("izifacture_team_members", JSON.stringify([owner, ...collaborators]));
      } else {
        setTeamMembers([owner]);
        window.localStorage.setItem("izifacture_team_members", JSON.stringify([owner]));
      }
    } catch { }
  }, [activeCompany]);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem("izifacture_team_members", JSON.stringify(teamMembers));
    } catch { }
  }, [teamMembers, mounted]);

  useEffect(() => {
    setFormData(activeCompany);
    setSelectedTemplate(activeCompany.invoiceTemplateId || "tpl-1");
    setAccentColor(activeCompany.invoiceAccentColor || "#059669");
    setShowStampOnInvoice(activeCompany.showStampOnInvoice ?? activeCompany.showStamp ?? true);
    setShowBankDetails(activeCompany.showBankDetailsOnInvoice ?? true);
    setShowLegalMentions(activeCompany.showLegalMentionsOnInvoice ?? true);
    if (activeCompany.defaultPaymentMethod) {
      setDefaultPaymentMethod(activeCompany.defaultPaymentMethod as PaymentMethodType);
    }
    if (activeCompany.defaultPaymentDetail || activeCompany.bankAccount) {
      setDefaultPaymentDetail(
        activeCompany.defaultPaymentDetail ||
        activeCompany.bankAccount ||
        "SONIBANK Niamey — Compte N° 041029481001/45"
      );
    }
    if (activeCompany.customTemplateFileName) {
      setCustomTemplateFile({
        name: activeCompany.customTemplateFileName,
        size: "840 Ko",
        uploadedAt: "Importé",
        previewUrl: activeCompany.customTemplateUrl,
        mime: activeCompany.customTemplateMime,
      });
    }
    if (activeCompany.customInvoiceData) {
      setCustomInvoiceData(activeCompany.customInvoiceData);
    }
  }, [activeCompany]);

  // Verrouillage du défilement de l'arrière-plan quand la modale aperçu est ouverte
  useEffect(() => {
    if (previewModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [previewModalOpen]);

  // Calcul dynamique de l'échelle d'affichage pour une visibilité intégrale de la facture à 100% sans coupure
  useEffect(() => {
    if (!previewModalOpen) return;
    const calculateScale = () => {
      if (previewViewMode === "fit" && previewInvoiceCardRef.current && previewAreaRef.current) {
        const availableH = previewAreaRef.current.clientHeight - 24;
        const availableW = previewAreaRef.current.clientWidth - 24;
        const cardH = previewInvoiceCardRef.current.scrollHeight;
        const cardW = previewInvoiceCardRef.current.scrollWidth;

        if (availableH > 0 && cardH > 0 && cardW > 0) {
          const scaleH = availableH / cardH;
          const scaleW = availableW / cardW;
          const bestScale = Math.min(1, scaleH, scaleW);
          setPreviewScale(Math.max(0.55, Math.min(1, bestScale)));
        }
      } else {
        setPreviewScale(1);
      }
    };

    calculateScale();
    const timer = setTimeout(calculateScale, 60);
    window.addEventListener("resize", calculateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateScale);
    };
  }, [previewModalOpen, previewViewMode, previewTemplateId]);

  // Fermeture du menu trois points au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customMenuRef.current && !customMenuRef.current.contains(e.target as Node)) {
        setCustomMenuOpen(false);
      }
    };
    if (customMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [customMenuOpen]);

  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setDefaultPaymentMethod(method);
    let newDetail = defaultPaymentDetail;
    if (method === "Mobile Money") {
      newDetail = formData.phone ? `Airtel Money / Moov Money (${formData.phone})` : "Airtel Money / Moov Money";
    } else if (method === "Carte Bancaire") {
      newDetail = "Visa, Mastercard, GIM-UEMOA";
    } else if (method === "Carte de Crédit") {
      newDetail = formData.bankAccount || "SONIBANK Niamey — Compte N° 041029481001/45";
    }
    setDefaultPaymentDetail(newDetail);
    const updated: CompanyProfile = {
      ...formData,
      defaultPaymentMethod: method,
      defaultPaymentDetail: newDetail,
      bankAccount: method === "Carte de Crédit" ? newDetail : formData.bankAccount,
    };
    setFormData(updated);
    onSaveCompany(updated);
    showToast(`✅ Mode de paiement mis à jour : ${method}`);
  };

  const updateCustomInvoiceField = (field: keyof Invoice, value: any) => {
    setCustomInvoiceData((prev) => {
      const updated = { ...prev, [field]: value };
      return updated;
    });
  };

  const updateCustomItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setCustomInvoiceData((prev) => {
      const items = [...(prev.items || [])];
      const currentItem = { ...items[index], [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        currentItem.totalHT = (Number(currentItem.quantity) || 0) * (Number(currentItem.unitPrice) || 0);
      }
      items[index] = currentItem;
      const subtotalHT = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
      const discountAmount = Math.round((subtotalHT * (prev.discountPercent || 0)) / 100);
      const taxableHT = Math.max(0, subtotalHT - discountAmount);
      const taxAmount = Math.round((taxableHT * (prev.taxRate || 0)) / 100);
      const totalTTC = taxableHT + taxAmount;
      const precompteAmount = Math.round((totalTTC * (prev.precompteRate || 0)) / 100);
      const netToPay = Math.max(0, totalTTC - precompteAmount);

      return {
        ...prev,
        items,
        subtotalHT,
        discountAmount,
        taxAmount,
        totalTTC,
        precompteAmount,
        netToPay,
      };
    });
  };

  const addCustomItem = () => {
    setCustomInvoiceData((prev) => {
      const items = [
        ...(prev.items || []),
        {
          id: `item-${Date.now()}`,
          description: "Nouvelle prestation de transport / manutention",
          unit: "MT",
          quantity: 10,
          unitPrice: 25000,
          totalHT: 250000,
          currency: "FCFA",
        },
      ];
      const subtotalHT = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
      const discountAmount = Math.round((subtotalHT * (prev.discountPercent || 0)) / 100);
      const taxableHT = Math.max(0, subtotalHT - discountAmount);
      const taxAmount = Math.round((taxableHT * (prev.taxRate || 0)) / 100);
      const totalTTC = taxableHT + taxAmount;
      const precompteAmount = Math.round((totalTTC * (prev.precompteRate || 0)) / 100);
      const netToPay = Math.max(0, totalTTC - precompteAmount);

      return {
        ...prev,
        items,
        subtotalHT,
        discountAmount,
        taxAmount,
        totalTTC,
        precompteAmount,
        netToPay,
      };
    });
  };

  const removeCustomItem = (index: number) => {
    setCustomInvoiceData((prev) => {
      const items = (prev.items || []).filter((_, i) => i !== index);
      const subtotalHT = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
      const discountAmount = Math.round((subtotalHT * (prev.discountPercent || 0)) / 100);
      const taxableHT = Math.max(0, subtotalHT - discountAmount);
      const taxAmount = Math.round((taxableHT * (prev.taxRate || 0)) / 100);
      const totalTTC = taxableHT + taxAmount;
      const precompteAmount = Math.round((totalTTC * (prev.precompteRate || 0)) / 100);
      const netToPay = Math.max(0, totalTTC - precompteAmount);

      return {
        ...prev,
        items,
        subtotalHT,
        discountAmount,
        taxAmount,
        totalTTC,
        precompteAmount,
        netToPay,
      };
    });
  };

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("Lecteur");
  const [inviteAccessCode, setInviteAccessCode] = useState<string>(() =>
    generateAccessCode(activeCompany.shortName || activeCompany.name || "COLLAB")
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // État pour tester la connexion d'un collaborateur par son code d'accès
  const [isCodeLoginModalOpen, setIsCodeLoginModalOpen] = useState<boolean>(false);
  const [codeLoginInput, setCodeLoginInput] = useState<string>("");
  const [activeCollaboratorSession, setActiveCollaboratorSession] = useState<TeamMember | null>(null);
  const [codeLoginFeedback, setCodeLoginFeedback] = useState<{
    success: boolean;
    member?: TeamMember;
    message: string;
  } | null>(null);

  useEffect(() => {
    setFormData(activeCompany);
    if (activeCompany.invoiceTemplateId) {
      setSelectedTemplate(activeCompany.invoiceTemplateId);
      setPreviewTemplateId(activeCompany.invoiceTemplateId);
    }
    if (activeCompany.invoiceAccentColor) {
      setAccentColor(activeCompany.invoiceAccentColor);
    }
  }, [activeCompany]);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const invoiceTemplateInputRef = useRef<HTMLInputElement>(null);
  const galleryTemplateInputRef = useRef<HTMLInputElement>(null);

  const [regionSettings, setRegionSettings] = useState<RegionSettings>(DEFAULT_REGION_SETTINGS);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideDropdowns = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideDropdowns);
    return () => document.removeEventListener("mousedown", handleOutsideDropdowns);
  }, []);

  const currentCountryInfo =
    AFRICAN_COUNTRIES.find(
      (c) => c.name.toLowerCase() === (formData.country || "Niger").toLowerCase()
    ) || AFRICAN_COUNTRIES[0];

  const handleInputChange = (field: keyof CompanyProfile, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast(lang === "en" ? "Image too large (max 2 MB)" : "L'image est trop volumineuse (max 2 Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData((prev) => ({ ...prev, logoUrl: result }));
        showToast(lang === "en" ? "Company logo uploaded!" : "✅ Logo de l'entreprise importé !");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast(lang === "en" ? "Stamp image too large (max 3 MB)" : "L'image du cachet est trop volumineuse (max 3 Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData((prev) => ({ ...prev, stampUrl: result }));
        showToast(lang === "en" ? "Official stamp imported!" : "✅ Cachet officiel importé !");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInvoiceTemplateImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / 1024).toFixed(0)} Ko`;
      const dateStr = new Date().toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", {
        day: "numeric",
        month: "short",
      });
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const newFile = {
          name: file.name,
          size: sizeStr,
          uploadedAt: dateStr,
          previewUrl: dataUrl,
          mime: file.type,
        };
        setCustomTemplateFile(newFile);
        setSelectedTemplate("custom");
        setPreviewTemplateId("custom");
        const updatedComp = {
          ...formData,
          invoiceTemplateId: "custom",
          customTemplateFileName: file.name,
          customTemplateUrl: dataUrl,
          customTemplateMime: file.type,
          customInvoiceData,
        };
        setFormData(updatedComp);
        onSaveCompany(updatedComp);
        showToast(
          lang === "ar"
            ? `✅ تم استيراد قالب "${file.name}" بنجاح!`
            : lang === "en"
              ? `✅ Invoice "${file.name}" imported! All its elements are now available.`
              : `✅ Facture "${file.name}" importée ! Modèle activé pour vos nouvelles factures.`
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountryChange = (countryName: string) => {
    const found = AFRICAN_COUNTRIES.find((c) => c.name === countryName);
    if (found) {
      setFormData((prev) => ({ ...prev, country: found.name, city: prev.city || found.capital }));
      setRegionSettings((prev) => ({
        ...prev,
        country: found.name,
        city: found.capital,
        timezone: found.timezone,
      }));
      showToast(`Pays sélectionné : ${found.name}`);
    } else {
      setFormData((prev) => ({ ...prev, country: countryName }));
      showToast(`Pays sélectionné : ${countryName}`);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      showToast(lang === "en" ? "Company name is required." : "La raison sociale est obligatoire.");
      return;
    }
    const updatedCompany = {
      ...formData,
      customInvoiceData,
    };
    onSaveCompany(updatedCompany);
    showToast(
      lang === "ar"
        ? `✅ تم حفظ إعدادات "${formData.name}" بنجاح!`
        : lang === "en"
          ? `✅ Settings saved for "${formData.name}"!`
          : `✅ Paramètres de "${formData.name}" enregistrés !`
    );
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLang(newLanguage);
    const selectedLangObj = AVAILABLE_LANGUAGES.find((l) => l.code === newLanguage);
    showToast(`✅ Langue activée : ${selectedLangObj?.nativeName || newLanguage.toUpperCase()}`);
  };

  // Team management avec Code d'Accès Unique
  const handleCopyAccessCode = (code: string, memberName: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`📋 Code d'accès (${code}) copié pour ${memberName} !`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleClearDemoMembers = () => {
    const owner = buildDefaultTeam(activeCompany)[0];
    setTeamMembers([owner]);
    try {
      window.localStorage.setItem("izifacture_team_members", JSON.stringify([owner]));
    } catch { }
    showToast("🧹 Collaborateurs fictifs effacés : seul votre compte principal est conservé.");
  };

  const handleOpenInviteModal = () => {
    setInviteAccessCode(generateAccessCode(activeCompany.shortName || activeCompany.name || "COLLAB"));
    setIsInviteModalOpen(true);
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const finalCode = inviteAccessCode || generateAccessCode(activeCompany.shortName || activeCompany.name || "COLLAB");
    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "Actif",
      avatarBg: "bg-purple-600",
      avatarText: inviteName.trim().substring(0, 2).toUpperCase(),
      lastActive: "Code d'accès actif",
      accessCode: finalCode,
      permissions: {
        canCreateInvoice: inviteRole !== "Lecteur",
        canDeleteInvoice: false,
        canValidatePayment: inviteRole === "Comptable",
        canEditSettings: false,
        canManageTeam: false,
        canViewReports: inviteRole !== "Facturier / Commercial",
        canExport: true,
      },
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setIsInviteModalOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Lecteur");
    setInviteAccessCode(generateAccessCode(activeCompany.shortName || activeCompany.name || "COLLAB"));
    showToast(`✅ Collaborateur ajouté ! Code d'accès unique : ${finalCode}`);
  };

  const handleRemoveMember = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (member?.isOwner) {
      showToast("❌ Le propriétaire du compte ne peut pas être supprimé.");
      return;
    }
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    setMemberToDelete(null);
    showToast(`✅ ${member?.name || "Membre"} retiré de l'équipe.`);
  };

  const handleToggleMemberStatus = (memberId: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId && !m.isOwner) {
          const newStatus = m.status === "Actif" ? "Suspendu" : "Actif";
          showToast(`${m.name} → ${newStatus}`);
          return { ...m, status: newStatus };
        }
        return m;
      })
    );
  };

  const handleTogglePermission = (
    memberId: string,
    permKey: keyof NonNullable<TeamMember["permissions"]>
  ) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId && !m.isOwner) {
          const current = m.permissions || {
            canCreateInvoice: false,
            canDeleteInvoice: false,
            canValidatePayment: false,
            canEditSettings: false,
            canManageTeam: false,
            canViewReports: false,
            canExport: false,
          };
          const nextPerms = { ...current, [permKey]: !current[permKey] };
          showToast(`Autorisations mises à jour pour ${m.name}`);
          return { ...m, permissions: nextPerms };
        }
        return m;
      })
    );
  };

  const handleVerifyCodeLogin = (codeToVerify?: string) => {
    const raw = (codeToVerify || codeLoginInput).trim().toUpperCase();
    if (!raw) {
      setCodeLoginFeedback({
        success: false,
        message: "Veuillez saisir le code d'accès collaborateur.",
      });
      return;
    }
    const found = teamMembers.find(
      (m) => (m.accessCode || "").toUpperCase() === raw
    );
    if (found) {
      setCodeLoginFeedback({
        success: true,
        member: found,
        message: `✅ Code vérifié avec succès ! Collaborateur identifié : ${found.name} (${found.role}).`,
      });
      setActiveCollaboratorSession(found);
      showToast(`Session active pour ${found.name} (${found.role})`);
    } else {
      setCodeLoginFeedback({
        success: false,
        message: `❌ Code « ${raw} » non reconnu. Vérifiez le format (ex: SARL-1234-567) ou demandez un code à l'administrateur.`,
      });
    }
  };

  // Input styles
  const inputCls =
    "w-full px-3.5 py-2.5 bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl text-sm text-[#111522] placeholder:text-[#808392] focus:bg-white focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/40 transition duration-150";
  const labelCls = "block text-xs font-bold text-[#111522] mb-1.5";

  // Section Header inside Cards
  const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="pb-3 mb-4 border-b border-[#edece6]">
      <h2 className="text-base sm:text-lg font-serif font-medium text-[#111522] tracking-tight">{title}</h2>
      <p className="text-xs text-[#697080] mt-0.5">{subtitle}</p>
    </div>
  );

  const handleSaveTemplateSettings = () => {
    const updated: CompanyProfile = {
      ...formData,
      invoiceTemplateId: selectedTemplate,
      invoiceAccentColor: accentColor,
      showStampOnInvoice,
      showBankDetailsOnInvoice: showBankDetails,
      showLegalMentionsOnInvoice: showLegalMentions,
      defaultPaymentMethod,
      defaultPaymentDetail,
      customTemplateFileName: customTemplateFile?.name || formData.customTemplateFileName,
      customTemplateUrl: customTemplateFile?.previewUrl || formData.customTemplateUrl,
      customTemplateMime: customTemplateFile?.mime || formData.customTemplateMime,
      customInvoiceData,
    };
    setFormData(updated);
    onSaveCompany(updated);
    showToast(
      lang === "ar"
        ? "✅ تم حفظ تفضيلات قالب الفاتورة بنجاح!"
        : lang === "en"
          ? "✅ Invoice template preferences saved!"
          : "✅ Préférences du modèle de facturation enregistrées !"
    );
  };

  const renderCustomInvoiceEditor = () => (
    <div className="bg-[#f8f7f3] border border-[#e8e7e2] rounded-2xl p-4 sm:p-5 space-y-4 animate-fade-in shadow-xs text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#e8e7e2]">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-[#111522] flex items-center gap-2">
            <span>✏️</span>
            <span>Modification des éléments du modèle de facture importé</span>
          </h4>
          <p className="text-[11px] text-[#697080] mt-0.5">
            Tous les éléments ci-dessous sont modifiables et se mettent à jour instantanément sur l&apos;aperçu.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#fff0a6] text-[#453700] border border-[#ffe36a] w-fit">
          Norme PAM / Excel
        </span>
      </div>

      {/* Section 1 : Métadonnées En-tête */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">FACT NO (N° Facture) *</label>
          <input
            type="text"
            value={customInvoiceData.number || ""}
            onChange={(e) => updateCustomInvoiceField("number", e.target.value)}
            placeholder="DA/0014/2026/MO"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono font-bold text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">DATE D&apos;ÉMISSION *</label>
          <input
            type="date"
            value={customInvoiceData.issueDate || ""}
            onChange={(e) => updateCustomInvoiceField("issueDate", e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">DATE D&apos;ÉCHÉANCE</label>
          <input
            type="date"
            value={customInvoiceData.dueDate || ""}
            onChange={(e) => updateCustomInvoiceField("dueDate", e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">PO NO. (Bon de Commande)</label>
          <input
            type="text"
            value={customInvoiceData.poNumber || ""}
            onChange={(e) => updateCustomInvoiceField("poNumber", e.target.value)}
            placeholder="4700795005"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono font-bold text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">WFP VENDOR NO.</label>
          <input
            type="text"
            value={customInvoiceData.vendorNumber || ""}
            onChange={(e) => updateCustomInvoiceField("vendorNumber", e.target.value)}
            placeholder="50045826"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">CONTRAT NR</label>
          <input
            type="text"
            value={customInvoiceData.contractNumber || ""}
            onChange={(e) => updateCustomInvoiceField("contractNumber", e.target.value)}
            placeholder="DA/LOG/149-15A...MO"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">LTI N° (Expédition / Connaissement)</label>
          <input
            type="text"
            value={customInvoiceData.ltiNumber || ""}
            onChange={(e) => updateCustomInvoiceField("ltiNumber", e.target.value)}
            placeholder="7700776450/7700784099/7700780024"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>
      </div>

      {/* Section 2 : Destinataire (Doit) & Objet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-[#e8e7e2]">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">DOIT (Nom de l&apos;organisation / Client) *</label>
          <input
            type="text"
            value={customInvoiceData.clientName || ""}
            onChange={(e) => updateCustomInvoiceField("clientName", e.target.value)}
            placeholder="Programme Alimentaire Mondiale"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-bold text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">VILLE / LOCALITÉ</label>
          <input
            type="text"
            value={customInvoiceData.clientCity || ""}
            onChange={(e) => updateCustomInvoiceField("clientCity", e.target.value)}
            placeholder="Maine Soroa"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">OBJET DE LA FACTURE *</label>
          <input
            type="text"
            value={customInvoiceData.object || ""}
            onChange={(e) => updateCustomInvoiceField("object", e.target.value)}
            placeholder="Transport des vivres de Diffa to Maine Soroa"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl italic text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>
      </div>

      {/* Section 3 : Mode de paiement (Mobile Money, Carte Bancaire, Carte de Crédit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-[#e8e7e2]">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">MODE DE PAIEMENT</label>
          <select
            value={customInvoiceData.paymentMethod || "Mobile Money"}
            onChange={(e) => {
              const m = e.target.value as PaymentMethodType;
              updateCustomInvoiceField("paymentMethod", m);
              if (m === "Mobile Money" && (!customInvoiceData.paymentDetail || customInvoiceData.paymentDetail.includes("SONIBANK"))) {
                updateCustomInvoiceField("paymentDetail", "Airtel Money (+227 90 24 55 12)");
                updateCustomInvoiceField("bankAccountRef", "Airtel Money (+227 90 24 55 12)");
              } else if (m === "Carte Bancaire" && (!customInvoiceData.paymentDetail || customInvoiceData.paymentDetail.includes("Airtel"))) {
                updateCustomInvoiceField("paymentDetail", "SONIBANK Niamey — Compte N° 041029481001/45");
                updateCustomInvoiceField("bankAccountRef", "SONIBANK Niamey — Compte N° 041029481001/45");
              }
            }}
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-bold text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          >
            <option value="Mobile Money">📱 Mobile Money (Airtel, Moov, MyNita, Amanata)</option>
            <option value="Carte Bancaire">💳 Carte Bancaire (Visa, Mastercard, GIM-UEMOA)</option>
            <option value="Carte de Crédit">🏦 Carte de Crédit</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">DÉTAIL / RÉFÉRENCE DE RÈGLEMENT</label>
          <input
            type="text"
            value={customInvoiceData.paymentDetail || customInvoiceData.bankAccountRef || ""}
            onChange={(e) => {
              updateCustomInvoiceField("paymentDetail", e.target.value);
              updateCustomInvoiceField("bankAccountRef", e.target.value);
            }}
            placeholder="Ex: Airtel Money (+227 90 24 55 12) ou SONIBANK Niamey — Compte N° 041029481001/45"
            className="w-full px-3 py-2 bg-white border border-[#e4e2d9] rounded-xl font-mono text-[#111522] focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35"
          />
        </div>
      </div>

      {/* Section 4 : Tableau des Lignes de Facturation */}
      <div className="pt-2 border-t border-[#e8e7e2] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#111522]">
            Articles & Prestations (Grille Officielle PAM)
          </span>
          <button
            type="button"
            onClick={addCustomItem}
            className="px-2.5 py-1 rounded-lg bg-[#fff0a6] text-[#111522] hover:bg-[#ffdc45] border border-[#ffe36a] font-bold text-[11px] transition active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>+ Ajouter une ligne</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-[#e8e7e2] rounded-xl bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f2f0e8] text-[#111522] font-extrabold border-b border-[#e8e7e2] text-[10px] uppercase">
                <th className="p-2 text-center w-10">#</th>
                <th className="p-2 min-w-[200px]">Description</th>
                <th className="p-2 text-center w-24">Unité</th>
                <th className="p-2 text-center w-24">Quantité</th>
                <th className="p-2 text-right w-28">Prix Unit. (FCFA)</th>
                <th className="p-2 text-right w-28">Total</th>
                <th className="p-2 text-center w-12">Suppr.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edece6]">
              {(customInvoiceData.items || []).map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-[#fff9db]/45">
                  <td className="p-2 text-center font-mono font-bold text-[#697080]">{idx + 1}</td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateCustomItem(idx, "description", e.target.value)}
                      className="w-full px-2 py-1 bg-[#f8f7f3] border border-[#e4e2d9] rounded text-xs text-[#111522] focus:bg-white focus:border-[#111522] focus:outline-none"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={it.unit || "MT"}
                      onChange={(e) => updateCustomItem(idx, "unit", e.target.value)}
                      className="w-full px-1.5 py-1 bg-[#f8f7f3] border border-[#e4e2d9] rounded text-center font-mono uppercase text-xs text-[#111522] focus:bg-white focus:border-[#111522] focus:outline-none"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      value={it.quantity}
                      onChange={(e) => updateCustomItem(idx, "quantity", Number(e.target.value))}
                      className="w-full px-1.5 py-1 bg-[#f8f7f3] border border-[#e4e2d9] rounded text-center font-mono font-bold text-xs text-[#111522] focus:bg-white focus:border-[#111522] focus:outline-none"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="number"
                      value={it.unitPrice}
                      onChange={(e) => updateCustomItem(idx, "unitPrice", Number(e.target.value))}
                      className="w-full px-1.5 py-1 bg-[#f8f7f3] border border-[#e4e2d9] rounded text-right font-mono text-xs text-[#111522] focus:bg-white focus:border-[#111522] focus:outline-none"
                    />
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-[#111522] whitespace-nowrap">
                    {formatFCFA(it.totalHT)}
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeCustomItem(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition active:scale-90 cursor-pointer font-bold"
                      title="Supprimer la ligne"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5 : Totaux et Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#e8e7e2]">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#5f6571] font-bold">Total Général :</span>
          <span className="text-sm font-extrabold text-[#111522] bg-[#fff0a6] px-3 py-1 rounded-xl border border-[#ffe36a]">
            {formatFCFA(customInvoiceData.netToPay || 0)}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setPreviewTemplateId("custom");
              setPreviewModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#111522] hover:bg-[#191f30] text-white font-bold text-xs transition active:scale-95 shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>👁️ Voir l&apos;aperçu mis à jour</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const updatedComp = {
                ...formData,
                invoiceTemplateId: "custom",
                customInvoiceData,
              };
              setSelectedTemplate("custom");
              setFormData(updatedComp);
              onSaveCompany(updatedComp);
              if (onCreateInvoiceWithTemplate) {
                onCreateInvoiceWithTemplate("custom");
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] font-bold text-xs transition active:scale-95 shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            title="Ouvrir la page de création avec ce modèle et ces articles"
          >
            <span>📝 Créer une facture avec ce modèle</span>
          </button>
        </div>
      </div>
    </div>
  );

  const tabs: { id: TabId; label: string; icon: string; desc: string }[] = [
    {
      id: "profile",
      label: t.tabCompanyProfile || "Profil de l'entreprise",
      icon: "🏢",
      desc: lang === "en" ? "Company identity, address, contact, logo & stamp" : "Identité légale, coordonnées, logo & cachet officiel",
    },
    {
      id: "templates",
      label: t.tabInvoiceTemplates || "Modèles de facturation",
      icon: "📄",
      desc: lang === "en" ? "Choose OHADA compliant invoice template layout" : "Choisissez la mise en page de vos factures conformes OHADA",
    },
    {
      id: "region",
      label: t.tabRegionCalendar || "Régional & Devises",
      icon: "🌍",
      desc: lang === "en" ? "Country, currency (FCFA), VAT rates and language" : "Pays de facturation, devise FCFA, TVA et langue",
    },
    {
      id: "team",
      label: t.tabTeamAccess || "Équipe & Accès",
      icon: "👥",
      desc: lang === "en" ? "Collaborators, access permissions and invitations" : "Collaborateurs autorisés, rôles et gestion de l'équipe",
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-20 lg:pb-8">
      {/* TOP PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#111522] tracking-tight">
            {t.settingsTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[#697080] mt-1">
            {t.settingsSubtitle}
          </p>
        </div>
      </div>

      {/* BARRE D'ONGLETS DIRECTE — ACCÈS EN 1 CLIC, SANS FLÈCHES NI CADRES INTERMÉDIAIRES */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 border-b border-[#e8e7e2]">
        {tabs.map((tab) => {
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all duration-150 active:scale-95 shrink-0 cursor-pointer ${isCurrent
                ? "bg-[#111522] text-white shadow-md shadow-[#111522]/15 ring-2 ring-[#ffdc45]/45"
                : "bg-white text-[#5f6571] hover:text-[#111522] hover:bg-[#f2f0e8] border border-[#e8e7e2]"
                }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5 animate-fade-in">

        {/* =========================================== */}
        {/* TAB 1: PROFIL DE L'ENTREPRISE + MODÈLES    */}
        {/* =========================================== */}
        {activeTab === "profile" && (
          <form onSubmit={handleSave} className="space-y-5 animate-fade-in">

            {/* CARD 1: Identité */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e8e7e2] shadow-[0_4px_20px_-4px_rgba(17,21,34,0.04)]">
              <SectionHeader
                title={t.companyIdentityTitle}
                subtitle={t.companyIdentityDesc}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t.legalNameLabel} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: AMOMD FACTURE SARL"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>RCCM (Registre du Commerce et du Crédit Mobilier)</label>
                  <input
                    type="text"
                    value={formData.rccm || ""}
                    onChange={(e) => handleInputChange("rccm", e.target.value)}
                    placeholder="Ex: RCCM-NI-NIA-2024-B-1234"
                    className={`${inputCls} font-mono`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>{t.headquartersAddressLabel}</label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Ex: Plateau, Dakar, Sénégal"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>{lang === "en" ? "Tax ID (NIF)" : lang === "ar" ? "رقم التعريف الضريبي (NIF)" : "NIF (Numéro Fiscal)"}</label>
                  <input
                    type="text"
                    value={formData.nif || ""}
                    onChange={(e) => handleInputChange("nif", e.target.value)}
                    placeholder="54291/R"
                    className={`${inputCls} font-mono`}
                  />
                </div>

                <div>
                  <label className={labelCls}>{lang === "en" ? "Short Code / Acronym" : lang === "ar" ? "الاختصار / الاسم المختصر" : "Sigle / Nom Court (Facture)"}</label>
                  <input
                    type="text"
                    value={formData.shortName || ""}
                    onChange={(e) => handleInputChange("shortName", e.target.value)}
                    placeholder="AMF, STS..."
                    className={`${inputCls} font-bold`}
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Coordonnées */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e8e7e2] shadow-[0_4px_20px_-4px_rgba(17,21,34,0.04)]">
              <SectionHeader
                title={t.contactDetailsTitle}
                subtitle={t.contactDetailsDesc}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t.billingEmailLabel}</label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="billing@amomd-facture.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>{t.businessPhoneLabel}</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+227 77 06 38 37"
                    className={`${inputCls} font-mono`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    {lang === "en" ? "Default Payment Method & Details" : lang === "ar" ? "طريقة الدفع الافتراضية والتفاصيل" : "Mode de paiement par défaut (Mobile Money, Carte Bancaire, Compte)"}
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount || ""}
                    onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                    placeholder="Ex: Airtel Money (+227 90 24 55 12) ou SONIBANK Niamey — Compte N° 041029481001/45"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: Visuels Logo & Cachet */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e8e7e2] shadow-[0_4px_20px_-4px_rgba(17,21,34,0.04)]">
              <SectionHeader
                title={t.visualsTitle}
                subtitle={t.visualsDesc}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Logo Upload */}
                <div className="p-4 bg-[#f8f7f3] border border-[#e8e7e2] rounded-xl flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border-2 border-white bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {formData.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs font-mono font-bold text-[#808392]">{formData.shortName || "LOGO"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-[#111522] block text-xs">
                      {t.companyLogoLabel}
                    </span>
                    <span className="text-[10px] text-[#697080] block mb-2">PNG / JPG (max 2 Mo)</span>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white border border-[#e4e2d9] hover:bg-[#f2f0e8] text-[#111522] text-[11px] font-bold rounded-lg transition active:scale-95 shadow-xs cursor-pointer"
                      >
                        {formData.logoUrl ? (lang === "en" ? "Change" : "Changer") : t.uploadLogoBtn}
                      </button>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: "" })}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          {t.removeLogoBtn}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stamp Upload */}
                <div className="p-4 bg-[#f8f7f3] border border-[#e8e7e2] rounded-xl flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border-2 border-white bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {formData.stampUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.stampUrl} alt="Cachet" className="max-h-full max-w-full object-contain rotate-[-2deg]" />
                    ) : (
                      <span className="text-xl">🔏</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-[#111522] block text-xs">
                      {t.officialStampLabel}
                    </span>
                    <span className="text-[10px] text-[#697080] block mb-2">
                      {lang === "en" ? "Scanned or transparent PNG" : "Scanné ou image PNG transparente"}
                    </span>
                    <input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stampInputRef.current?.click()}
                        className="px-2.5 py-1 bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] text-[11px] font-bold rounded-lg transition active:scale-95 shadow-xs cursor-pointer"
                      >
                        {formData.stampUrl ? (lang === "en" ? "Change" : "Changer") : t.uploadStampActionBtn}
                      </button>
                      {formData.stampUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, stampUrl: "" })}
                          className="text-[11px] text-rose-600 hover:underline font-semibold"
                        >
                          {t.removeStampActionBtn}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Profil */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] font-extrabold text-xs sm:text-sm shadow-md shadow-[#ffdc45]/20 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <IconCheck className="w-4 h-4 text-[#111522]" />
                <span>{t.saveSettings}</span>
              </button>
            </div>
          </form>
        )}

        {/* =========================================== */}
        {/* TAB 2: MODÈLES DE FACTURATION & PERSONNALISATION */}
        {/* =========================================== */}
        {activeTab === "templates" && (
          <div className="space-y-6 animate-fade-in w-full">
            {/* Carte principale pleine largeur */}
            <div className="bg-white p-5 sm:p-7 rounded-2xl border border-[#e8e7e2] shadow-[0_4px_20px_-4px_rgba(17,21,34,0.04)] space-y-6">
              
              {/* Header de la page */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#edece6]">
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-medium text-[#111522] tracking-tight flex items-center gap-2">
                    <span>📄</span>
                    <span>{t.tabInvoiceTemplates || "Modèles de facturation"}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#697080] mt-0.5">
                    {lang === "en"
                      ? "Choose your invoice layout or upload your own corporate template."
                      : "Choisissez la mise en page de vos factures ou importez votre propre modèle."}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#fff0a6] text-[#453700] border border-[#ffe36a]">
                    <span className="w-2 h-2 rounded-full bg-[#111522] animate-pulse" />
                    <span>
                      {selectedTemplate === "custom"
                        ? (customTemplateFile?.name || "Modèle personnalisé actif")
                        : INVOICE_TEMPLATES.find((tpl) => tpl.id === selectedTemplate)?.name || "Modèle Standard"}
                    </span>
                  </span>
                </div>
              </div>

              {/* 1. Grille des 4 modèles professionnels intégrés */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#111522] flex items-center gap-1.5">
                    <span>✨</span>
                    <span>1. Modèles professionnels intégrés</span>
                  </span>
                  <span className="text-[11px] text-[#697080] font-medium">Norme OHADA & UEMOA</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {INVOICE_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplate(tpl.id);
                          setPreviewTemplateId(tpl.id);
                          const updatedComp = { ...formData, invoiceTemplateId: tpl.id, customInvoiceData };
                          setFormData(updatedComp);
                          onSaveCompany(updatedComp);
                          setPreviewModalOpen(true);
                          showToast(`✅ ${tpl.name} activé !`);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all duration-150 active:scale-95 cursor-pointer text-left flex flex-col justify-between group ${isSelected
                          ? "bg-[#111522] text-white border-[#ffdc45] shadow-xl ring-2 ring-[#ffdc45]/35"
                          : "bg-white text-[#111522] border-[#e8e7e2] hover:border-[#111522] hover:bg-[#f8f7f3] shadow-[0_4px_20px_-4px_rgba(17,21,34,0.04)]"
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-2xl">{tpl.preview}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isSelected
                                ? "bg-[#ffdc45]/20 text-[#ffdc45] border-[#ffdc45]/35"
                                : "bg-[#f2f0e8] text-[#5f6571] border-[#e4e2d9]"
                                }`}
                            >
                              {tpl.tag}
                            </span>
                          </div>
                          <h3
                            className={`font-extrabold text-sm sm:text-base tracking-tight ${isSelected ? "text-white" : "text-[#111522]"
                              }`}
                          >
                            {tpl.name}
                          </h3>
                          <p
                            className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${isSelected ? "text-[#c4c7d1]" : "text-[#697080]"
                              }`}
                          >
                            {tpl.description}
                          </p>
                        </div>

                        <div
                          className={`pt-3 mt-3 border-t text-[11px] font-bold flex items-center justify-between ${isSelected
                            ? "border-white/10 text-[#ffdc45]"
                            : "border-[#edece6] text-[#697080] group-hover:text-[#111522]"
                            }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isSelected ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#ffdc45] animate-pulse" />
                                <span>Modèle actif</span>
                              </>
                            ) : (
                              <span>Cliquer pour voir</span>
                            )}
                          </span>
                          <span className="text-xs transition-transform group-hover:translate-x-0.5">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1.B SECTION DÉDIÉE : IMPORTER VOTRE PROPRE MODÈLE (GALERIE, PHOTOS OU FICHIERS) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#111522] text-white border border-white/10 shadow-xl space-y-4">
                {/* Inputs invisibles déclenchés par les boutons */}
                <input
                  type="file"
                  ref={galleryTemplateInputRef}
                  onChange={handleInvoiceTemplateImport}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={invoiceTemplateInputRef}
                  onChange={handleInvoiceTemplateImport}
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#ffdc45]/15 text-[#ffdc45] flex items-center justify-center text-2xl shrink-0 border border-[#ffdc45]/30 shadow-inner">
                      📥
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif font-medium text-lg sm:text-xl text-white">
                          Importer votre propre modèle de facture
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ffdc45]/15 text-[#ffdc45] border border-[#ffdc45]/30">
                          Galerie • Photos • Scan • PDF
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#b9bdc9] mt-1 max-w-2xl leading-relaxed">
                        Votre entreprise dispose d&apos;un modèle officiel, d&apos;un gabarit scanné ou d&apos;une photo de facture ?
                        Importez-le directement depuis votre galerie photo ou vos fichiers pour l&apos;appliquer à vos factures AMOMD FACTURE.
                      </p>
                    </div>
                  </div>

                  {/* Boutons d'importation visibles et clairs */}
                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => galleryTemplateInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] font-extrabold text-xs sm:text-sm transition active:scale-95 flex items-center gap-2 cursor-pointer shadow-md shadow-black/25"
                      title="Ouvrir la galerie ou vos photos"
                    >
                      <span className="text-base">📷</span>
                      <span>Galerie / Photos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => invoiceTemplateInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs sm:text-sm transition active:scale-95 flex items-center gap-2 cursor-pointer border border-white/15 shadow-sm"
                      title="Parcourir un document PDF, scan ou fichier"
                    >
                      <span className="text-base">📁</span>
                      <span>Parcourir fichier (PDF/Scan)</span>
                    </button>
                  </div>
                </div>

                {/* État du fichier importé */}
                {customTemplateFile ? (
                  <div className="p-3.5 rounded-xl bg-[#191f30] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-[#ffdc45]/15 text-[#ffdc45] flex items-center justify-center font-bold text-sm shrink-0">
                        📄
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-white truncate max-w-xs">{customTemplateFile.name}</strong>
                          <span className="text-[#9096a5] font-mono text-[11px]">({customTemplateFile.size})</span>
                          {selectedTemplate === "custom" && (
                            <span className="px-2 py-0.5 rounded-full bg-[#ffdc45] text-[#111522] text-[10px] font-bold">
                              ✓ Modèle actif
                            </span>
                          )}
                        </div>
                        <span className="text-[#9096a5] text-[11px] block mt-0.5">
                          Importé le {customTemplateFile.uploadedAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewTemplateId("custom");
                          setPreviewModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <span>👁️ Aperçu</span>
                      </button>
                      {selectedTemplate !== "custom" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate("custom");
                            setPreviewTemplateId("custom");
                            const updatedComp = { ...formData, invoiceTemplateId: "custom", customInvoiceData };
                            setFormData(updatedComp);
                            onSaveCompany(updatedComp);
                            showToast(`✅ ${customTemplateFile.name} réactivé !`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] font-bold text-xs transition active:scale-95 cursor-pointer"
                        >
                          Activer ce modèle
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => invoiceTemplateInputRef.current?.click()}
                    className="p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-[#ffdc45]/60 bg-white/5 hover:bg-white/10 transition cursor-pointer text-center"
                  >
                    <p className="text-xs text-[#e5e6ea] font-semibold">
                      Glissez-déposez votre modèle de facture ici ou cliquez sur l&apos;un des boutons ci-dessus
                    </p>
                    <p className="text-[11px] text-[#9096a5] mt-1">
                      Formats supportés : Photos JPG/PNG, scans, gabarits et documents PDF (jusqu&apos;à 10 Mo)
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Personnalisation Couleurs & Nuancier */}
              <div className="pt-2 border-t border-[#edece6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#f8f7f3] border border-[#e8e7e2]">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#111522] flex items-center gap-1.5">
                      <span>🎨</span>
                      <span>2. Personnaliser votre facture (Couleur & Nuancier)</span>
                    </span>
                    <p className="text-xs text-[#697080] max-w-md">
                      Cliquez pour ouvrir le sélecteur complet façon Office : Couleurs du thème, Couleurs standard ou mélangeur de teinte personnalisé.
                    </p>
                  </div>

                  {/* Composant Sélecteur de Couleur Office / Word */}
                  <div className="shrink-0">
                    <OfficeColorPicker
                      value={accentColor.startsWith("#") ? accentColor : "#111522"}
                      onChange={(newColor) => {
                        setAccentColor(newColor);
                        const updated = { ...formData, invoiceAccentColor: newColor };
                        setFormData(updated);
                        onSaveCompany(updated);
                        showToast(`Couleur ${newColor} appliquée à votre modèle !`);
                      }}
                      label="Couleur de votre facture"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Options d'affichage sur la facture */}
              <div className="pt-2 border-t border-[#edece6] space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#111522] flex items-center gap-1.5">
                  <span>⚙️</span>
                  <span>3. Options d&apos;affichage sur la facture</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="p-3.5 rounded-xl border border-[#e8e7e2] bg-[#f8f7f3] hover:bg-[#f2f0e8] flex items-center justify-between cursor-pointer transition">
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-bold text-[#111522] block">Cachet officiel</span>
                      <span className="text-[10px] text-[#697080]">Apposer le tampon/signature</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showStampOnInvoice}
                      onChange={(e) => {
                        setShowStampOnInvoice(e.target.checked);
                        const updated = { ...formData, showStampOnInvoice: e.target.checked };
                        setFormData(updated);
                        onSaveCompany(updated);
                      }}
                      className="w-4 h-4 rounded accent-[#111522] cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-xl border border-[#e8e7e2] bg-[#f8f7f3] hover:bg-[#f2f0e8] flex items-center justify-between cursor-pointer transition">
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-bold text-[#111522] block">Coordonnées RIB / Mobile</span>
                      <span className="text-[10px] text-[#697080]">Afficher en pied de page</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showBankDetails}
                      onChange={(e) => {
                        setShowBankDetails(e.target.checked);
                        const updated = { ...formData, showBankDetailsOnInvoice: e.target.checked };
                        setFormData(updated);
                        onSaveCompany(updated);
                      }}
                      className="w-4 h-4 rounded accent-[#111522] cursor-pointer"
                    />
                  </label>

                  <label className="p-3.5 rounded-xl border border-[#e8e7e2] bg-[#f8f7f3] hover:bg-[#f2f0e8] flex items-center justify-between cursor-pointer transition">
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-bold text-[#111522] block">Mentions Légales & Arrêté</span>
                      <span className="text-[10px] text-[#697080]">Montant en toutes lettres</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={showLegalMentions}
                      onChange={(e) => {
                        setShowLegalMentions(e.target.checked);
                        const updated = { ...formData, showLegalMentionsOnInvoice: e.target.checked };
                        setFormData(updated);
                        onSaveCompany(updated);
                      }}
                      className="w-4 h-4 rounded accent-[#111522] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* 4. Actions & Sauvegarde */}
              <div className="pt-4 border-t border-[#edece6] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTemplateId(selectedTemplate);
                    setPreviewModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#e4e2d9] bg-white hover:bg-[#f2f0e8] text-[#111522] text-xs font-bold transition active:scale-95 inline-flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>👁️</span>
                  <span>Aperçu de la facture</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTemplateSettings}
                  className="px-5 py-2.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs sm:text-sm font-extrabold shadow-md shadow-[#ffdc45]/20 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <IconCheck className="w-4 h-4 text-[#111522]" />
                  <span>Enregistrer la personnalisation</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =========================================== */}
        {/* TAB 3: RÉGIONAL & DEVISES + LANGUE         */}
        {/* =========================================== */}
        {activeTab === "region" && (
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#e8e7e2] shadow-[0_8px_30px_-8px_rgba(17,21,34,0.05)] space-y-6 animate-fade-in">
            <SectionHeader
              title={t.regionalSettingsTitle}
              subtitle={t.regionalSettingsDesc}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              {/* 1. Langue — clic + recherche ou choix direct */}
              <div ref={langDropdownRef} className="relative">
                <label className={labelCls}>{t.languageLabel || "Langue de l'application"}</label>
                <button
                  type="button"
                  onClick={() => {
                    setLangDropdownOpen(!langDropdownOpen);
                    setCountryDropdownOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e4e2d9] hover:border-[#111522] rounded-xl text-left flex items-center justify-between transition shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-[#111522] text-[#ffdc45] font-mono text-[10px] font-extrabold uppercase">
                      {lang}
                    </span>
                    <span className="font-bold text-[#111522] truncate">
                      {AVAILABLE_LANGUAGES.find((l) => l.code === lang)?.nativeName || "Français"}
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-[#697080] transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {langDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-[#e8e7e2] shadow-2xl z-40 overflow-hidden animate-scale-up">
                    <div className="p-2.5 border-b border-[#edece6]">
                      <div className="relative">
                        <IconSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#808392]" />
                        <input
                          type="text"
                          autoFocus
                          value={langSearch}
                          onChange={(e) => setLangSearch(e.target.value)}
                          placeholder="Rechercher une langue..."
                          className="w-full pl-8 pr-3 py-2 bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl text-xs text-[#111522] placeholder-[#808392] focus:bg-white focus:outline-none focus:border-[#111522]"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                      {AVAILABLE_LANGUAGES.filter((l) => {
                        const q = langSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          l.nativeName.toLowerCase().includes(q) ||
                          l.code.toLowerCase().includes(q) ||
                          l.region.toLowerCase().includes(q)
                        );
                      }).map((l) => {
                        const isSelected = lang === l.code;
                        return (
                          <button
                            key={l.code}
                            type="button"
                            onClick={() => {
                              handleLanguageChange(l.code);
                              setLangSearch("");
                              setLangDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${isSelected
                              ? "bg-[#111522] text-white"
                              : "text-[#5f6571] hover:bg-[#f8f7f3] hover:text-[#111522]"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold uppercase ${isSelected ? "bg-[#ffdc45] text-[#111522]" : "bg-[#f2f0e8] text-[#5f6571]"
                                  }`}
                              >
                                {l.code}
                              </span>
                              <span className="font-bold">{l.nativeName}</span>
                            </div>
                            {isSelected && <IconCheck className="w-4 h-4 text-[#ffdc45]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Pays — clic + recherche libre, sans NE/BF ni TVA fixe */}
              <div ref={countryDropdownRef} className="relative">
                <label className={labelCls}>{t.countryLabel || "Pays"} *</label>
                <button
                  type="button"
                  onClick={() => {
                    setCountryDropdownOpen(!countryDropdownOpen);
                    setLangDropdownOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e4e2d9] hover:border-[#111522] rounded-xl text-left flex items-center justify-between transition shadow-2xs cursor-pointer"
                >
                  <span className="font-bold text-[#111522] truncate">
                    {formData.country || "Sélectionner un pays"}
                  </span>
                  <svg className={`w-4 h-4 text-[#697080] transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {countryDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-[#e8e7e2] shadow-2xl z-40 overflow-hidden animate-scale-up">
                    <div className="p-2.5 border-b border-[#edece6]">
                      <div className="relative">
                        <IconSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#808392]" />
                        <input
                          type="text"
                          autoFocus
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Rechercher votre pays..."
                          className="w-full pl-8 pr-3 py-2 bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl text-xs text-[#111522] placeholder-[#808392] focus:bg-white focus:outline-none focus:border-[#111522]"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                      {AFRICAN_COUNTRIES.filter((ct) => {
                        const q = countrySearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          ct.name.toLowerCase().includes(q) ||
                          ct.capital.toLowerCase().includes(q)
                        );
                      }).map((ct) => {
                        const isSelected =
                          (formData.country || "").toLowerCase() === ct.name.toLowerCase();
                        return (
                          <button
                            key={ct.name}
                            type="button"
                            onClick={() => {
                              handleCountryChange(ct.name);
                              setCountrySearch("");
                              setCountryDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${isSelected
                              ? "bg-[#111522] text-white"
                              : "text-[#5f6571] hover:bg-[#f8f7f3] hover:text-[#111522]"
                              }`}
                          >
                            <span className="font-bold">{ct.name}</span>
                            {isSelected && <IconCheck className="w-4 h-4 text-[#ffdc45]" />}
                          </button>
                        );
                      })}
                      {countrySearch.trim() &&
                        !AFRICAN_COUNTRIES.some(
                          (ct) => ct.name.toLowerCase() === countrySearch.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleCountryChange(countrySearch.trim());
                              setCountrySearch("");
                              setCountryDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#111522] bg-[#fff0a6] hover:bg-[#ffdc45] text-left"
                          >
                            Utiliser « {countrySearch.trim()} »
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Ville — saisie libre + suggestions rapides */}
              <div>
                <label className={labelCls}>{t.cityLabel || "Ville"}</label>
                <input
                  type="text"
                  value={formData.city ?? ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder={`Ex: ${currentCountryInfo.capital}`}
                  className={inputCls}
                />
                {currentCountryInfo.cities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {currentCountryInfo.cities.slice(0, 5).map((cityName) => (
                      <button
                        key={cityName}
                        type="button"
                        onClick={() => handleInputChange("city", cityName)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${formData.city === cityName
                          ? "bg-[#111522] text-[#ffdc45]"
                          : "bg-[#f2f0e8] text-[#5f6571] hover:bg-[#e8e7e2] hover:text-[#111522]"
                          }`}
                      >
                        {cityName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Taux de TVA par défaut — 100% VARIABLE */}
              <div>
                <label className={labelCls}>
                  Taux de TVA par défaut (%) — Variable
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.defaultTaxRate ?? 19}
                    onChange={(e) =>
                      handleInputChange(
                        "defaultTaxRate",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    placeholder="Ex: 19, 18, 10, 5, 0..."
                    className={`${inputCls} font-mono pr-10`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#808392]">
                    %
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[0, 5, 10, 18, 19].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleInputChange("defaultTaxRate", rate)}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer ${(formData.defaultTaxRate ?? 19) === rate
                        ? "bg-[#111522] text-[#ffdc45]"
                        : "bg-[#f2f0e8] text-[#5f6571] hover:bg-[#e8e7e2] hover:text-[#111522]"
                        }`}
                    >
                      {rate}%
                    </button>
                  ))}
                  <span className="text-[10px] text-[#808392] ml-1">
                    Modifiable sur chaque facture
                  </span>
                </div>
              </div>

              {/* 5. Devise principale */}
              <div className="sm:col-span-2">
                <label className={labelCls}>{t.mainCurrencyLabel || "Devise de facturation"}</label>
                <input
                  type="text"
                  disabled
                  value="FCFA (Franc CFA — XOF / XAF)"
                  className={`${inputCls} font-mono bg-[#f2f0e8] text-[#5f6571]`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#edece6]">
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-6 py-2.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] font-extrabold text-xs sm:text-sm shadow-md shadow-[#ffdc45]/20 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <IconCheck className="w-4 h-4 text-[#111522]" />
                <span>{t.saveSettings}</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================== */}
        {/* TAB 4: ÉQUIPE & ACCÈS — Complet            */}
        {/* =========================================== */}
        {activeTab === "team" && (
          <div className="space-y-4 animate-fade-in">
            {/* Header + Invite button */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e8e7e2] shadow-[0_4px_20px_-4px_rgba(17,21,34,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#edece6]">
                <div>
                  <h2 className="text-base sm:text-lg font-serif font-medium text-[#111522]">{t.teamAccessTitle || "Équipe & Accès"}</h2>
                  <p className="text-xs text-[#697080] mt-0.5">
                    {lang === "en"
                      ? `Team members authorized for ${formData.name}`
                      : `Collaborateurs de l'espace de ${formData.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {teamMembers.filter((m) => !m.isOwner).length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearDemoMembers}
                      className="px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                      title="Effacer les collaborateurs fictifs / de test pour n'avoir que des données réelles"
                    >
                      🧹 Effacer données fictives
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCodeLoginFeedback(null);
                      setCodeLoginInput("");
                      setIsCodeLoginModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] text-xs font-bold transition active:scale-95 shadow-sm shrink-0 cursor-pointer"
                    title="Tester la connexion d'un collaborateur à la base avec son code unique"
                  >
                    <span>🔑</span>
                    <span>Tester connexion par code</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInviteModal}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs font-extrabold transition active:scale-95 shadow-sm shrink-0 cursor-pointer"
                  >
                    + {t.inviteMemberBtn || "Inviter un collaborateur"}
                  </button>
                </div>
              </div>

              {/* Bannière de session active de test collaborateur */}
              {activeCollaboratorSession && (
                <div className="mb-4 p-3.5 rounded-2xl bg-[#111522] text-white border border-[#ffdc45]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fade-in">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffdc45] animate-ping shrink-0" />
                    <div className="text-xs">
                      <span className="text-[#9096a5]">Session collaborateur active : </span>
                      <strong className="text-[#ffdc45] font-bold">{activeCollaboratorSession.name}</strong>
                      <span className="text-[#e5e6ea]"> — {activeCollaboratorSession.role}</span>
                      <span className="ml-2 font-mono text-[10px] px-2 py-0.5 rounded bg-[#191f30] text-[#ffdc45] border border-white/10">
                        {activeCollaboratorSession.accessCode}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCollaboratorSession(null);
                      showToast("Session collaborateur terminée. Retour au profil Propriétaire.");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition active:scale-95 cursor-pointer self-start sm:self-auto shrink-0 border border-white/15"
                  >
                    Quitter la session
                  </button>
                </div>
              )}
              <div className="space-y-3.5">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 sm:p-5 bg-[#f8f7f3] border border-[#e8e7e2] rounded-2xl space-y-3 hover:bg-[#f2f0e8]/70 transition shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${member.avatarBg} text-white font-bold text-sm flex items-center justify-center font-mono shrink-0 shadow-2xs`}>
                          {member.avatarText}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#111522] text-sm">
                              {member.name}
                            </span>
                            {member.isOwner ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111522] text-[#ffdc45] border border-[#111522]">
                                🛡️ Tenant / Propriétaire
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${member.status === "Actif"
                                  ? "bg-[#d9f0df] text-[#285b35] border-[#b9dfc8]"
                                  : member.status === "Invité"
                                    ? "bg-[#fff0a6] text-[#453700] border-[#ffe36a]"
                                    : "bg-rose-50 text-rose-800 border-rose-200"
                                  }`}
                              >
                                {member.role}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#697080] font-mono break-all sm:truncate block mt-0.5">
                            {member.email}
                          </span>
                        </div>
                      </div>

                      {/* Actions statut & suppression */}
                      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {member.isOwner ? (
                          <span className="text-xs font-semibold text-[#453700] bg-[#fff0a6] px-3 py-1 rounded-xl border border-[#ffe36a]">
                            Accès complet irrévocable
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleMemberStatus(member.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${member.status === "Actif"
                                ? "bg-[#d9f0df] hover:bg-[#b9dfc8] text-[#285b35] border border-[#b9dfc8]"
                                : "bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300"
                                }`}
                            >
                              {member.status === "Actif" ? "✓ Connexion autorisée" : "⛔ Accès suspendu"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setMemberToDelete(member)}
                              className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                              title="Retirer ce collaborateur"
                            >
                              Retirer
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bannière du Code d'Accès Unique */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-[#111522] text-white rounded-xl text-xs font-mono border border-white/10 shadow-inner">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-extrabold text-[#ffdc45] uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <span>🔑</span>
                          <span>Code d&apos;accès :</span>
                        </span>
                        <span className="font-extrabold text-[#ffdc45] tracking-wider text-xs sm:text-sm bg-[#191f30] px-2 py-0.5 rounded-lg border border-white/10 select-all truncate">
                          {member.accessCode || generateAccessCode(activeCompany.shortName || activeCompany.name || "COLLAB")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyAccessCode(member.accessCode || "", member.name)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10.5px] font-bold transition active:scale-95 cursor-pointer border border-white/15 flex items-center gap-1 shadow-sm"
                          title="Copier le code d'accès à donner au collaborateur"
                        >
                          <span>{copiedCode === member.accessCode ? "✓ Copié !" : "📋 Copier"}</span>
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ${member.name}, voici votre code d'accès unique pour vous connecter à la plateforme AMOMD FACTURE de ${activeCompany.name} :\n🔑 Code d'accès : ${member.accessCode || ""}\nAccédez à la plateforme ici : http://localhost:3000`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] rounded-lg text-[10.5px] font-bold transition active:scale-95 flex items-center gap-1 shadow-sm"
                          title="Partager le code d'accès par WhatsApp au collaborateur"
                        >
                          <span>💬 WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* Matrice des droits accordés par le Tenant (cliquables pour modifier) */}
                    <div className="pt-3 border-t border-[#e8e7e2]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5f6571]">
                          Autorisations de gestion accordées par le Tenant :
                        </span>
                        {!member.isOwner && (
                          <span className="text-[10px] text-[#697080]">
                            Cliquez pour activer/désactiver une permission
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
                        {[
                          { key: "canCreateInvoice" as const, label: "Créer des factures", icon: "📝" },
                          { key: "canDeleteInvoice" as const, label: "Supprimer des factures", icon: "🗑️" },
                          { key: "canValidatePayment" as const, label: "Valider les paiements", icon: "💳" },
                          { key: "canEditSettings" as const, label: "Modifier les paramètres", icon: "⚙️" },
                        ].map((perm) => {
                          const isAllowed = member.isOwner || Boolean(member.permissions?.[perm.key]);
                          return (
                            <button
                              key={perm.key}
                              type="button"
                              disabled={member.isOwner}
                              onClick={() => handleTogglePermission(member.id, perm.key)}
                              className={`px-2.5 py-1.5 rounded-xl text-[10.5px] sm:text-[11px] font-bold border transition active:scale-95 flex items-center justify-between sm:justify-start gap-1.5 ${member.isOwner
                                ? "bg-[#111522] text-[#ffdc45] border-[#111522] cursor-default"
                                : isAllowed
                                  ? "bg-[#fff0a6] text-[#111522] border-[#ffe36a] hover:bg-[#ffdc45] cursor-pointer"
                                  : "bg-[#edece6] text-[#808392] border-[#e4e2d9] hover:bg-[#e4e2d9] line-through opacity-75 cursor-pointer"
                                }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span>{perm.icon}</span>
                                <span className="truncate">{perm.label}</span>
                              </div>
                              <span className="font-mono text-[10px] shrink-0 font-extrabold ml-1">
                                {isAllowed ? "✓" : "✕"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {teamMembers.filter((m) => !m.isOwner).length === 0 && (
                  <div className="p-4 rounded-2xl border border-dashed border-[#e4e2d9] bg-[#f8f7f3] text-center">
                    <p className="text-xs font-semibold text-[#5f6571]">Aucun collaborateur invité pour le moment</p>
                    <p className="text-[11px] text-[#808392] mt-0.5">
                      Cliquez sur « + Inviter un collaborateur » pour créer des accès personnalisés à votre comptable ou commercial.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal Invite Member */}
      {mounted && isInviteModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-[#0c111d]/70 backdrop-blur-sm animate-fade-in p-3 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-[#e8e7e2] shadow-2xl w-full max-w-md animate-scale-up">
            <div className="flex items-center justify-between p-5 border-b border-[#edece6]">
              <h3 className="text-lg font-serif font-medium text-[#111522]">
                👥 {t.inviteMemberBtn || "Inviter un collaborateur"}
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1.5 rounded-xl text-[#808392] hover:text-[#111522] hover:bg-[#f2f0e8] active:scale-95 transition"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Prénom Nom"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl text-[#111522] font-bold focus:bg-white focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="collaborateur@entreprise.ne"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl text-[#111522] focus:bg-white focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35 transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1">Rôle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
                  className="w-full px-3 py-2.5 bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl text-[#111522] focus:bg-white focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35 transition"
                >
                  <option value="Administrateur">Administrateur</option>
                  <option value="Comptable">Comptable</option>
                  <option value="Facturier / Commercial">Facturier / Commercial</option>
                  <option value="Lecteur">Lecteur (lecture seule)</option>
                </select>
              </div>

              {/* Code d'accès unique généré */}
              <div className="p-3.5 bg-[#111522] border border-white/10 rounded-xl space-y-1.5 text-white shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#ffdc45] flex items-center gap-1.5">
                    <span>🔑</span>
                    <span>Code d&apos;accès unique attribué</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteAccessCode);
                      showToast(`📋 Code d'accès (${inviteAccessCode}) copié !`);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#ffdc45] text-[10.5px] font-bold transition active:scale-95 cursor-pointer border border-white/15"
                  >
                    📋 Copier
                  </button>
                </div>
                <div className="font-mono font-black text-white text-base tracking-widest bg-[#191f30] px-3 py-1.5 rounded-lg border border-white/10 select-all">
                  {inviteAccessCode}
                </div>
                <p className="text-[10px] text-[#9096a5] leading-tight">
                  Donnez ce code d&apos;accès unique à votre collaborateur pour qu&apos;il puisse se connecter à votre espace de facturation.
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#edece6]">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e4e2d9] text-[#5f6571] hover:bg-[#f2f0e8] font-bold active:scale-95 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] font-extrabold active:scale-95 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>✓ Valider & Activer le code</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tester la Connexion par Code Collaborateur */}
      {mounted && isCodeLoginModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0c111d]/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#e8e7e2] shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up text-[#111522]">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-[#edece6] bg-[#f8f7f3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#111522] text-[#ffdc45] flex items-center justify-center text-lg border border-[#111522] font-bold">
                  🔑
                </div>
                <div>
                  <h3 className="text-lg font-serif font-medium text-[#111522]">
                    Connexion Espace Collaborateur
                  </h3>
                  <p className="text-xs text-[#697080]">
                    Accès sécurisé pour l&apos;espace de {formData.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeLoginModalOpen(false)}
                className="p-1.5 rounded-xl text-[#808392] hover:text-[#111522] hover:bg-[#f2f0e8] active:scale-95 transition cursor-pointer"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-xs text-[#5f6571] leading-relaxed">
                Chaque collaborateur invité dispose d&apos;un code d&apos;accès unique. Saisissez ou sélectionnez un code ci-dessous pour vérifier ses droits et simuler sa connexion :
              </p>

              {/* Saisie du Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5f6571] mb-1.5">
                  Code d&apos;accès collaborateur
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeLoginInput}
                    onChange={(e) => setCodeLoginInput(e.target.value)}
                    placeholder="Ex: ESE-7130-825 ou MASTER-SARL-..."
                    className="flex-1 px-3.5 py-2.5 bg-[#f8f7f3] border border-[#e4e2d9] rounded-xl font-mono text-sm font-bold text-[#111522] placeholder:text-[#808392] focus:bg-white focus:outline-none focus:border-[#111522] focus:ring-2 focus:ring-[#ffdc45]/35 transition uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyCodeLogin()}
                    className="px-4 py-2.5 rounded-xl bg-[#111522] hover:bg-[#191f30] text-[#ffdc45] font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    Vérifier
                  </button>
                </div>
              </div>

              {/* Suggestions rapides des codes existants */}
              {teamMembers.length > 0 && (
                <div className="p-3 bg-[#f8f7f3] rounded-2xl border border-[#e8e7e2] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6571] block">
                    Codes existants dans votre entreprise :
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {teamMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setCodeLoginInput(m.accessCode || "");
                          handleVerifyCodeLogin(m.accessCode);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-bold font-mono transition active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                          m.isOwner
                            ? "bg-[#111522] text-white"
                            : "bg-white text-[#111522] hover:bg-[#f2f0e8] border border-[#e4e2d9]"
                        }`}
                      >
                        <span className="font-sans font-semibold">{m.name}</span>
                        <span className={`text-[10px] ${m.isOwner ? "text-[#ffdc45]" : "text-[#697080]"}`}>({m.accessCode})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultat de la vérification */}
              {codeLoginFeedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
                    codeLoginFeedback.success
                      ? "bg-[#d9f0df]/70 border-[#b9dfc8] text-[#111522]"
                      : "bg-rose-50/80 border-rose-200 text-rose-950"
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {codeLoginFeedback.message}
                  </p>

                  {codeLoginFeedback.member && (
                    <div className="mt-2 pt-2 border-t border-[#b9dfc8] space-y-1.5 text-[11px]">
                      <div className="font-semibold text-[#285b35]">
                        Autorisations accordées par le titulaire du compte :
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                        <span className="flex items-center gap-1">
                          {codeLoginFeedback.member.permissions?.canCreateInvoice ? "✅" : "❌"} Créer des factures
                        </span>
                        <span className="flex items-center gap-1">
                          {codeLoginFeedback.member.permissions?.canDeleteInvoice ? "✅" : "❌"} Supprimer des factures
                        </span>
                        <span className="flex items-center gap-1">
                          {codeLoginFeedback.member.permissions?.canValidatePayment ? "✅" : "❌"} Valider les paiements
                        </span>
                        <span className="flex items-center gap-1">
                          {codeLoginFeedback.member.permissions?.canEditSettings ? "✅" : "❌"} Modifier paramètres
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#edece6]">
                <button
                  type="button"
                  onClick={() => setIsCodeLoginModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#e4e2d9] text-[#5f6571] text-xs font-bold hover:bg-[#f2f0e8] transition active:scale-95 cursor-pointer"
                >
                  Fermer
                </button>
                {codeLoginFeedback?.success && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCodeLoginModalOpen(false);
                      showToast(`Connecté avec succès en tant que ${codeLoginFeedback.member?.name} !`);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    Activer cette session
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation suppression membre */}
      {mounted && memberToDelete && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0c111d]/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#e8e7e2] max-w-sm w-full p-6 space-y-4 animate-scale-up">
            <h3 className="font-serif font-medium text-[#111522] text-lg">Retirer ce membre ?</h3>
            <p className="text-sm text-[#5f6571]">
              Confirmez-vous le retrait de <strong>{memberToDelete.name}</strong> de l&apos;espace de facturation ?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#e4e2d9] text-[#5f6571] hover:bg-[#f2f0e8] font-bold active:scale-95 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRemoveMember(memberToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold active:scale-95 transition shadow-sm"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      

      {/* Modal Aperçu de la facture : Rendu haute fidélité direct, épuré et intégralement visible */}
      {mounted && previewModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-[#0c111d]/92 backdrop-blur-md flex flex-col animate-fade-in select-none overflow-hidden"
          onClick={() => setPreviewModalOpen(false)}
        >
          {/* BARRE SUPÉRIEURE DE NAVIGATION ET CONTRÔLE : FIXE, DÉDIÉE, NE COUVRE JAMAIS LA FACTURE */}
          <header
            className="w-full bg-[#111522] border-b border-white/10 text-white px-3 sm:px-6 py-2.5 sm:py-3 shrink-0 flex items-center justify-between gap-3 shadow-xl z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gauche : Onglets sélecteurs de modèles */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 max-w-[70vw]">
              <div className="hidden md:flex items-center gap-2 pr-2 border-r border-white/10 shrink-0">
                <span className="text-base">📄</span>
                <span className="text-xs font-bold text-[#c4c7d1]">Modèles :</span>
              </div>

              {/* Onglets des Modèles (Inversion Bleu Nuit / Jaune Or) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {INVOICE_TEMPLATES.map((tpl) => {
                  const isCurrent = previewTemplateId === tpl.id;
                  const isSaved = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setPreviewTemplateId(tpl.id);
                        setSelectedTemplate(tpl.id);
                        const updatedComp = { ...formData, invoiceTemplateId: tpl.id, customInvoiceData };
                        setFormData(updatedComp);
                        onSaveCompany(updatedComp);
                        showToast(`✅ ${tpl.name} activé !`);
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 ${isCurrent
                        ? "bg-[#ffdc45] text-[#111522] shadow-md ring-2 ring-[#ffdc45]/40 font-extrabold"
                        : "bg-white/10 text-[#e5e6ea] hover:text-white hover:bg-white/15"
                        }`}
                    >
                      <span className="text-sm">{tpl.preview}</span>
                      <span className="whitespace-nowrap">{tpl.name}</span>
                      {isSaved && (
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCurrent ? "bg-[#111522]" : "bg-[#ffdc45]"}`} title="Modèle actif" />
                      )}
                    </button>
                  );
                })}

                {/* Modèle personnalisé si existant */}
                {customTemplateFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTemplateId("custom");
                      setSelectedTemplate("custom");
                      const updatedComp = { ...formData, invoiceTemplateId: "custom", customInvoiceData };
                      setFormData(updatedComp);
                      onSaveCompany(updatedComp);
                      showToast(`✅ ${customTemplateFile.name} activé !`);
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1.5 ${previewTemplateId === "custom"
                      ? "bg-[#ffdc45] text-[#111522] shadow-md ring-2 ring-[#ffdc45]/40 font-extrabold"
                      : "bg-white/10 text-[#e5e6ea] hover:text-white hover:bg-white/15"
                      }`}
                  >
                    <span className="text-sm">📥</span>
                    <span className="whitespace-nowrap max-w-[120px] truncate">{customTemplateFile.name}</span>
                    {selectedTemplate === "custom" && (
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${previewTemplateId === "custom" ? "bg-[#111522]" : "bg-[#ffdc45]"}`} />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Droite : Mode de Vue (Facture Entière vs 100%) + Fermer */}
            <div className="flex items-center gap-2 shrink-0">
              {previewTemplateId === "custom" && (
                <button
                  type="button"
                  onClick={() => setModalEditMode(!modalEditMode)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 border cursor-pointer ${modalEditMode
                    ? "bg-[#ffdc45] text-[#111522] border-[#ffdc45] font-extrabold"
                    : "bg-white/10 text-[#e5e6ea] hover:text-white border-white/15"
                    }`}
                >
                  <span>✏️</span>
                  <span className="hidden md:inline">{modalEditMode ? "Masquer champs" : "Éditer champs"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPreviewViewMode(previewViewMode === "fit" ? "full" : "fit")}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#e5e6ea] text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 border border-white/15 cursor-pointer"
                title={previewViewMode === "fit" ? "Passer en taille réelle (100%)" : "Ajuster pour voir la facture entière"}
              >
                <span>{previewViewMode === "fit" ? "🔍" : "👁️"}</span>
                <span className="hidden md:inline">
                  {previewViewMode === "fit" ? "Taille 100%" : "Facture entière"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-[#e5e6ea] hover:text-white text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1 border border-white/15 shadow-sm cursor-pointer"
                aria-label="Fermer"
              >
                <span>✕</span>
                <span className="hidden sm:inline">Fermer</span>
              </button>
            </div>
          </header>

          {/* ZONE PRINCIPALE : AUCUN ÉLÉMENT PAR-DESSUS, VISIBILITÉ INTÉGRALE */}
          <div
            ref={previewAreaRef}
            className={`flex-1 w-full p-2 sm:p-4 flex flex-col items-center cursor-pointer ${previewViewMode === "fit"
              ? "justify-center overflow-hidden"
              : "justify-start overflow-y-auto no-scrollbar"
              }`}
            onClick={() => setPreviewModalOpen(false)}
          >
            {/* Panneau d'édition inline si modèle personnalisé et mode édition actif */}
            {previewTemplateId === "custom" && modalEditMode && (
              <div
                className="w-full max-w-2xl mb-3 bg-white rounded-2xl p-4 shadow-xl border border-[#e8e7e2] cursor-default shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {renderCustomInvoiceEditor()}
              </div>
            )}

            {/* LA FACTURE ENTIÈRE DIRECTEMENT ET INTÉGRALEMENT VISIBLE (Sans coupure du bas) */}
            <div
              ref={previewInvoiceCardRef}
              style={
                previewViewMode === "fit" && previewScale < 1
                  ? {
                    transform: `scale(${previewScale})`,
                    transformOrigin: "center center",
                  }
                  : undefined
              }
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e8e7e2] cursor-default shrink-0 transition-transform duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <InvoiceLivePreview
                invoice={
                  previewTemplateId === "custom"
                    ? customInvoiceData
                    : {
                      number: "FAC-DEMO-001",
                      clientName: "ENTREPRISE PARTENAIRE SA",
                      clientCity: formData.city || "Niamey",
                      object: "Prestation d'ingénierie & déploiement technique",
                      issueDate: "2026-10-28",
                      dueDate: "2026-11-28",
                      status: "envoyee",
                      paymentMethod: defaultPaymentMethod,
                      paymentDetail: defaultPaymentDetail,
                      subtotalHT: 10500000,
                      taxRate: 19,
                      taxAmount: 1995000,
                      totalTTC: 12495000,
                      netToPay: 12495000,
                      items: [
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
                      ],
                    }
                }
                company={formData}
                templateId={previewTemplateId}
                accentColor={accentColor}
                showStamp={showStampOnInvoice}
                showBankDetails={showBankDetails}
                showLegalMentions={showLegalMentions}
                customFile={customTemplateFile}
                isCompact={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      
    </div>
  );
}
