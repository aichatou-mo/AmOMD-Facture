"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/RevenueChart";
import StatusSelector from "@/components/StatusSelector";
import ConfirmDialog from "@/components/ConfirmDialog";
import { IconPlus } from "@/components/Icons";
import type { SaveInvoiceOptions } from "@/components/CreateInvoicePage";

import InvoicesListPage from "@/components/InvoicesListPage";
import CreateInvoicePage from "@/components/CreateInvoicePage";
import InvoiceDetailPage from "@/components/InvoiceDetailPage";
import ClientsPage from "@/components/ClientsPage";
import SettingsPage from "@/components/SettingsPage";
import AuthPage from "@/components/AuthPage";
import LandingPage from "@/components/LandingPage";
import AIAssistantModal from "@/components/AIAssistantModal";
import AIAssistantTrigger from "@/components/AIAssistantTrigger";
import DateRangePicker from "@/components/DateRangePicker";
import {
  CompanyProfile,
  Invoice,
  InvoiceStatus,
  Client,
} from "@/lib/mock-data";
import { formatFCFA, formatDateFR, parseSearchAmount, findInvoiceCombinations } from "@/lib/money";
import { LanguageProvider, useTranslation } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  fetchInvoices,
  upsertInvoice,
  deleteInvoice as removeInvoiceFromDb,
  updateInvoiceStatus as updateDbInvoiceStatus,
  fetchClients,
  upsertClient,
  deleteClient as removeClientFromDb,
  ensureUserCompany,
  upsertCompany,
} from "@/lib/supabase-service";

function buildCleanCompany(user?: User | null): CompanyProfile {
  const metaName =
    typeof user?.user_metadata?.company_name === "string"
      ? user.user_metadata.company_name.trim()
      : "";
  return {
    id: user ? `comp-${user.id.slice(0, 8)}` : "comp-default",
    name: metaName || "Mon Entreprise",
    email: user?.email || "",
    country: "Niger",
    city: "",
    defaultTaxRate: 19,
    defaultPaymentMethod: "Mobile Money",
    invoiceTemplateId: "tpl-1",
    showStamp: false,
    showStampOnInvoice: false,
  };
}

function MainApp({ initialTab = "dashboard" }: { initialTab?: string }) {
  const { t } = useTranslation();

  // Authentification réelle Supabase
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [publicView, setPublicView] = useState<"landing" | "login" | "signup">("landing");

  const [currentTab, setCurrentTab] = useState<string>(initialTab);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [selectedKpi, setSelectedKpi] = useState<string>("paid");
  const [selectedDateRange, setSelectedDateRange] = useState<"all" | "today" | "month" | "quarter" | "year" | "day" | "custom">("all");
  const [dateFilterStart, setDateFilterStart] = useState<string>("");
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("");

  // États 100% réels (aucune donnée fictive pré-remplie)
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [activeCompany, setActiveCompany] = useState<CompanyProfile>(() =>
    buildCleanCompany(null)
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Rapprochement intelligent de montants pour la recherche du Dashboard
  const dashboardSearchAmount = useMemo(() => {
    return parseSearchAmount(searchQuery);
  }, [searchQuery]);

  const dashboardCombinations = useMemo(() => {
    if (!dashboardSearchAmount) return [];
    return findInvoiceCombinations(invoices, dashboardSearchAmount, 4);
  }, [invoices, dashboardSearchAmount]);

  const dashboardMatchingInvoices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const qNoSpace = q.replace(/\s+/g, "");
    return invoices.filter((inv) => {
      // Vérification exhaustive de tous les montants pertinents de la facture
      const amounts = [
        inv.netToPay,
        inv.paidAmount,
        inv.totalTTC,
        inv.taxableHT,
        inv.subtotalHT,
      ].filter((x) => x !== undefined && x !== null && !isNaN(Number(x)) && Number(x) > 0) as number[];

      const matchesAmount = amounts.some((amt) => {
        const amtRound = Math.round(Number(amt));
        if (dashboardSearchAmount && Math.abs(amtRound - dashboardSearchAmount) <= 2) {
          return true;
        }
        const amtStr = String(amtRound);
        const amtFormatted = amtRound.toLocaleString("fr-FR").replace(/\s+/g, "");
        return (
          amtStr.includes(qNoSpace) ||
          amtFormatted.includes(qNoSpace) ||
          qNoSpace.includes(amtStr)
        );
      });

      const matchesClient = inv.clientName.toLowerCase().includes(q);
      const matchesNumber = inv.number.toLowerCase().includes(q);
      const matchesObject = Boolean(inv.object && inv.object.toLowerCase().includes(q));
      return matchesClient || matchesAmount || matchesNumber || matchesObject;
    });
  }, [invoices, searchQuery, dashboardSearchAmount]);

  // Filtrage selon la période sélectionnée (Demande expresse utilisateur & capture)
  const filteredInvoicesByDate = useMemo(() => {
    // Si une plage personnalisée est définie (Date début et/ou Date fin de la capture utilisateur)
    if (dateFilterStart || dateFilterEnd) {
      return invoices.filter((inv) => {
        const invDate = inv.issueDate?.slice(0, 10) || "";
        if (!invDate) return true;
        if (dateFilterStart && dateFilterEnd) {
          return invDate >= dateFilterStart && invDate <= dateFilterEnd;
        }
        if (dateFilterStart) {
          return invDate >= dateFilterStart;
        }
        if (dateFilterEnd) {
          return invDate <= dateFilterEnd;
        }
        return true;
      });
    }

    if (selectedDateRange === "all") return invoices;
    const now = new Date();
    return invoices.filter((inv) => {
      const d = new Date(inv.issueDate);
      if (isNaN(d.getTime())) return true;
      if (selectedDateRange === "today") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
      if (selectedDateRange === "month") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }
      if (selectedDateRange === "quarter") {
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 92;
      }
      if (selectedDateRange === "year") {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [invoices, selectedDateRange, dateFilterStart, dateFilterEnd]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Initialisation de l'onglet depuis l'URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\//, "").split("/")[0];
      const validTabs = [
        "dashboard",
        "invoices",
        "clients",
        "settings",
        "create-invoice",
        "invoice-detail",
        "products",
        "payments",
      ];
      if (validTabs.includes(path)) {
        setCurrentTab(path);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [currentTab]);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const newPath = tab === "dashboard" ? "/" : `/${tab}`;
      window.history.pushState(null, "", newPath);
    }
  };

  // Écoute de la session Supabase Auth (Connexion / Création de compte / Déconnexion)
  useEffect(() => {
    let mounted = true;

    // Timeout de sécurité pour éviter de rester bloqué sur l'écran de chargement
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setIsAuthChecking(false);
      }
    }, 900);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        clearTimeout(safetyTimer);
        setAuthUser(data.session?.user ?? null);
        setIsAuthChecking(false);
      })
      .catch(() => {
        if (mounted) {
          clearTimeout(safetyTimer);
          setIsAuthChecking(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      clearTimeout(safetyTimer);
      const nextUser = session?.user ?? null;
      setAuthUser(nextUser);
      setIsAuthChecking(false);

      if (!nextUser) {
        setInvoices([]);
        setClients([]);
        setCompanies([]);
        setSelectedInvoice(null);
        setEditingInvoice(null);
        setActiveCompany(buildCleanCompany(null));
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Chargement des données réelles de l'utilisateur connecté depuis Supabase
  useEffect(() => {
    if (!authUser?.id) return;
    let isMounted = true;

    async function loadUserWorkspace(user: User) {
      try {
        setIsDbLoading(true);
        const metaCompanyName =
          typeof user.user_metadata?.company_name === "string"
            ? user.user_metadata.company_name
            : undefined;

        const [dbCompanies, dbClients, dbInvoices] = await Promise.all([
          ensureUserCompany(user.id, metaCompanyName, user.email),
          fetchClients(user.id),
          fetchInvoices(user.id),
        ]);

        if (!isMounted) return;

        const primaryComp =
          dbCompanies && dbCompanies.length > 0
            ? dbCompanies[0]
            : buildCleanCompany(user);

        setCompanies(dbCompanies.length > 0 ? dbCompanies : [primaryComp]);
        setActiveCompany(primaryComp);
        setClients(dbClients || []);

        const hydratedInvoices = (dbInvoices || []).map((inv) => ({
          ...inv,
          company:
            (dbCompanies || []).find(
              (c) => c.name === inv.companyName || c.id === inv.company?.id
            ) || primaryComp,
          companyName: inv.companyName || primaryComp.name,
        }));

        setInvoices(hydratedInvoices);
        setSelectedInvoice((prev) =>
          prev
            ? hydratedInvoices.find((i) => i.id === prev.id) ||
            hydratedInvoices[0] ||
            null
            : hydratedInvoices[0] || null
        );
      } catch (err) {
        console.warn("Erreur chargement espace utilisateur:", err);
      } finally {
        if (isMounted) setIsDbLoading(false);
      }
    }

    loadUserWorkspace(authUser);
    return () => {
      isMounted = false;
    };
  }, [authUser?.id]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await supabase.auth.signOut();
    setAuthUser(null);
    setPublicView("landing");
    setInvoices([]);
    setClients([]);
    setCompanies([]);
    setSelectedInvoice(null);
    setEditingInvoice(null);
    handleTabChange("dashboard");
    showToast("Vous avez été déconnecté avec succès.");
  };

  // Synchronise le CA et le nombre de factures du client lié
  const computeSyncedClient = (
    clientName: string,
    nextInvoices: Invoice[],
    baseClients: Client[],
    fallbackInfo?: {
      email?: string;
      phone?: string;
      city?: string;
      address?: string;
      contactPerson?: string;
      nif?: string;
    }
  ): { nextClients: Client[]; matchedClient: Client | null } => {
    const normalized = clientName.trim().toLowerCase();
    if (!normalized) {
      return { nextClients: baseClients, matchedClient: null };
    }

    const clientInvs = nextInvoices.filter(
      (i) => i.clientName.trim().toLowerCase() === normalized
    );
    const totalBilled = clientInvs.reduce(
      (sum, i) => sum + (i.netToPay || i.totalTTC || 0),
      0
    );
    const invoicesCount = clientInvs.length;

    const existing = baseClients.find(
      (c) => c.name.trim().toLowerCase() === normalized
    );

    if (existing) {
      const updatedClient: Client = {
        ...existing,
        contactPerson: existing.contactPerson || fallbackInfo?.contactPerson || "",
        nif: existing.nif || fallbackInfo?.nif || undefined,
        email: existing.email || fallbackInfo?.email || "",
        phone: existing.phone || fallbackInfo?.phone || "",
        city: existing.city || fallbackInfo?.city || "",
        address: existing.address || fallbackInfo?.address || undefined,
        totalBilled,
        invoicesCount,
      };
      const nextClients = baseClients.map((c) =>
        c.id === existing.id ? updatedClient : c
      );
      return { nextClients, matchedClient: updatedClient };
    }

    if (fallbackInfo) {
      const createdClient: Client = {
        id: `cl-${Date.now()}`,
        name: clientName.trim(),
        contactPerson: fallbackInfo.contactPerson || "",
        nif: fallbackInfo.nif || undefined,
        email: fallbackInfo.email || "",
        phone: fallbackInfo.phone || "",
        address: fallbackInfo.address || undefined,
        city: fallbackInfo.city || "",
        country: activeCompany.country || "Niger",
        totalBilled,
        invoicesCount,
      };
      return {
        nextClients: [createdClient, ...baseClients],
        matchedClient: createdClient,
      };
    }

    return { nextClients: baseClients, matchedClient: null };
  };

  // 1. Enregistrer / Mettre à jour une facture dans Supabase
  const handleSaveInvoice = async (
    savedInv: Invoice,
    options?: SaveInvoiceOptions
  ): Promise<boolean> => {
    if (!authUser) return false;

    const enrichedInv: Invoice = {
      ...savedInv,
      company: savedInv.company || activeCompany,
      companyName: savedInv.companyName || activeCompany.name,
      paidAmount:
        savedInv.status === "payee"
          ? savedInv.paidAmount || savedInv.netToPay || savedInv.totalTTC
          : savedInv.paidAmount || 0,
    };

    const exists = invoices.some((i) => i.id === enrichedInv.id);
    const nextInvoices = exists
      ? invoices.map((i) => (i.id === enrichedInv.id ? enrichedInv : i))
      : [enrichedInv, ...invoices];

    setInvoices(nextInvoices);

    const { nextClients, matchedClient } = computeSyncedClient(
      enrichedInv.clientName,
      nextInvoices,
      clients,
      {
        email: enrichedInv.clientEmail,
        phone: enrichedInv.clientPhone,
        city: enrichedInv.clientCity,
        address: enrichedInv.clientAddress,
        contactPerson: (enrichedInv as any).clientContactPerson,
        nif: (enrichedInv as any).clientNif,
      }
    );
    setClients(nextClients);
    setSelectedInvoice(enrichedInv);

    setIsSyncing(true);
    try {
      // Sauvegarder le client d'abord pour garantir l'intégrité de la clé étrangère client_id
      let validClientId: string | null = null;
      if (matchedClient) {
        const clientSaved = await upsertClient(matchedClient, {
          userId: authUser.id,
          companyId: activeCompany.id,
        });
        if (clientSaved) {
          validClientId = matchedClient.id;
        }
      }

      const ok = await upsertInvoice(enrichedInv, {
        userId: authUser.id,
        companyId: activeCompany.id,
        clientId: validClientId,
      });

      if (ok) {
        showToast(
          `Facture ${enrichedInv.number} enregistrée (${formatFCFA(
            enrichedInv.netToPay || enrichedInv.totalTTC
          )})`
        );
      } else {
        showToast(
          `Attention : erreur de synchronisation Supabase pour ${enrichedInv.number}`
        );
      }

      const targetNav = options?.navigateTo ?? "invoices";
      if (targetNav !== "stay") {
        setEditingInvoice(null);
        setPreselectedClientId(null);
        handleTabChange(targetNav);
      }

      return ok;
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Supprimer une facture
  const handleDeleteInvoice = async (id: string) => {
    if (!authUser) return;
    const target = invoices.find((i) => i.id === id);
    const nextInvoices = invoices.filter((i) => i.id !== id);
    setInvoices(nextInvoices);

    if (target) {
      const { nextClients, matchedClient } = computeSyncedClient(
        target.clientName,
        nextInvoices,
        clients
      );
      setClients(nextClients);
      if (matchedClient) {
        upsertClient(matchedClient, {
          userId: authUser.id,
          companyId: activeCompany.id,
        }).catch(() => { });
      }
    }

    showToast(`Facture ${target?.number || id} supprimée.`);
    setSelectedInvoice(nextInvoices[0] || null);
    handleTabChange("invoices");

    setIsSyncing(true);
    await removeInvoiceFromDb(id, authUser.id);
    setIsSyncing(false);
  };

  // 3. Changer le statut d'une facture
  const handleUpdateStatus = async (id: string, newStatus: InvoiceStatus) => {
    if (!authUser) return;
    const target = invoices.find((inv) => inv.id === id);
    const updatedPaidAmount =
      newStatus === "payee" && target
        ? target.netToPay || target.totalTTC || 0
        : 0;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, status: newStatus, paidAmount: updatedPaidAmount }
          : inv
      )
    );
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice({
        ...selectedInvoice,
        status: newStatus,
        paidAmount: updatedPaidAmount,
      });
    }

    const statusLabels: Record<InvoiceStatus, string> = {
      payee: t.statusPaid || "Payée",
      envoyee: t.statusSent || "Envoyée",
      en_retard: t.statusOverdue || "En retard",
      brouillon: t.statusDraft || "Brouillon",
    };
    showToast(`Statut mis à jour : ${statusLabels[newStatus] || newStatus}`);

    setIsSyncing(true);
    await updateDbInvoiceStatus(id, newStatus, authUser.id, updatedPaidAmount);
    setIsSyncing(false);
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    handleTabChange("invoice-detail");
  };

  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setPreselectedClientId(null);
    handleTabChange("create-invoice");
  };

  const handleOpenNewInvoice = () => {
    setEditingInvoice(null);
    setPreselectedClientId(null);
    handleTabChange("create-invoice");
  };

  // Gestion Clients (Supabase)
  const handleAddClient = async (newClient: Client) => {
    if (!authUser) return;
    setClients((prev) => [newClient, ...prev]);
    showToast(`Client ${newClient.name} ajouté.`);
    setIsSyncing(true);
    await upsertClient(newClient, {
      userId: authUser.id,
      companyId: activeCompany.id,
    });
    setIsSyncing(false);
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    if (!authUser) return;
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    showToast(`Fiche client ${updatedClient.name} mise à jour.`);
    setIsSyncing(true);
    await upsertClient(updatedClient, {
      userId: authUser.id,
      companyId: activeCompany.id,
    });
    setIsSyncing(false);
  };

  const handleDeleteClient = async (id: string) => {
    if (!authUser) return;
    const cl = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    showToast(`Client ${cl?.name || id} supprimé.`);
    setIsSyncing(true);
    await removeClientFromDb(id, authUser.id);
    setIsSyncing(false);
  };

  const handleCreateInvoiceForClient = (client: Client) => {
    setEditingInvoice(null);
    setPreselectedClientId(client.id);
    handleTabChange("create-invoice");
  };

  // Sauvegarde Paramètres Entreprise (Supabase)
  const handleSaveCompany = async (updated: CompanyProfile) => {
    if (!authUser) return;
    const exists = companies.some((c) => c.id === updated.id);
    setCompanies(
      exists
        ? companies.map((c) => (c.id === updated.id ? updated : c))
        : [...companies, updated]
    );
    setActiveCompany(updated);
    setInvoices((prev) =>
      prev.map((inv) =>
        !inv.company || inv.company.id === updated.id
          ? { ...inv, company: updated, companyName: updated.name }
          : inv
      )
    );
    setIsSyncing(true);
    await upsertCompany(updated, authUser.id);
    setIsSyncing(false);
  };

  // Écran de vérification initiale de session (sécurisé avec styles inline + classes Tailwind)
  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#111522",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif",
        }}
        className="min-h-screen bg-[#111522] flex items-center justify-center p-6"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "12px 20px",
              boxShadow: "0 14px 36px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="bg-white rounded-2xl px-5 py-3 shadow-2xl border border-white/20 animate-pulse"
          >
            <img
              src="/logo-amomd.png"
              alt="AMOMD Facture"
              style={{ height: "54px", width: "auto", objectFit: "contain" }}
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </div>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#c4c7d1",
              letterSpacing: "0.05em",
              margin: 0,
            }}
            className="text-xs font-bold text-[#c4c7d1] tracking-wide"
          >
            Chargement d&apos;AMOMD FACTURE...
          </p>
        </div>
      </div>
    );
  }

  // Utilisateur non connecté -> Page d'accueil publique puis Se connecter / Créer un compte
  if (!authUser) {
    if (publicView === "landing") {
      return (
        <LandingPage
          onLogin={() => setPublicView("login")}
          onGetStarted={() => setPublicView("signup")}
        />
      );
    }
    return (
      <AuthPage
        initialMode={publicView === "signup" ? "signup" : "login"}
        onBack={() => setPublicView("landing")}
      />
    );
  }

  const userFullName =
    (typeof authUser.user_metadata?.full_name === "string" &&
      authUser.user_metadata.full_name.trim()) ||
    authUser.email?.split("@")[0] ||
    "Utilisateur";
  const firstName = userFullName.split(/\s+/)[0] || "Utilisateur";

  const DATE_FILTER_LABELS: Record<string, string> = {
    all: "Filtrer par date",
    today: "Aujourd'hui",
    month: "Ce mois",
    quarter: "Ce trimestre",
    year: "Cette année",
    day: "Jour précis",
  };



  // Calculs 100% réels des KPIs selon la période sélectionnée
  const totalBilledAmount = filteredInvoicesByDate.reduce(
    (sum, inv) => sum + (inv.netToPay || inv.totalTTC || 0),
    0
  );
  const totalPaidAmount = filteredInvoicesByDate
    .filter((inv) => inv.status === "payee")
    .reduce(
      (sum, inv) => sum + (inv.paidAmount || inv.netToPay || inv.totalTTC || 0),
      0
    );
  const pendingAmount = filteredInvoicesByDate
    .filter((inv) => inv.status === "envoyee")
    .reduce((sum, inv) => sum + (inv.netToPay || inv.totalTTC || 0), 0);
  const overdueAmount = filteredInvoicesByDate
    .filter((inv) => inv.status === "en_retard")
    .reduce((sum, inv) => sum + (inv.netToPay || inv.totalTTC || 0), 0);

  const paidCount = filteredInvoicesByDate.filter((i) => i.status === "payee").length;
  const pendingCount = filteredInvoicesByDate.filter((i) => i.status === "envoyee").length;
  const overdueCount = filteredInvoicesByDate.filter((i) => i.status === "en_retard").length;
  const recoveryRatePct =
    totalBilledAmount > 0
      ? Math.round((totalPaidAmount / totalBilledAmount) * 100)
      : 0;

  const recentInvoices = invoices.slice(0, 5);

  const formatDisplayDateFR = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.slice(0, 10).split("-");
      if (parts.length !== 3) return dateStr;
      const [y, m, d] = parts.map(Number);
      if (!y || !m || !d) return dateStr;
      const day = String(d).padStart(2, "0");
      const months = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
      ];
      return `${day} ${months[m - 1] || ""} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const hasDateRangeFilter = Boolean(dateFilterStart || dateFilterEnd);
  const displayInvoices = hasDateRangeFilter ? filteredInvoicesByDate : recentInvoices;

  const getHeaderTitle = () => {
    switch (currentTab) {
      case "dashboard":
        return t.dashboard || "Tableau de bord";
      case "invoices":
        return t.invoices || "Factures";
      case "create-invoice":
        return editingInvoice
          ? `${t.editInvoice || "Modifier"} ${editingInvoice.number}`
          : t.createInvoice || "Nouvelle facture";
      case "invoice-detail":
        return t.invoiceDetailsTitle || "Détail Facture";
      case "clients":
        return t.clientsDirectory || "Clients";
      case "products":
        return t.products || "Catalogue";
      case "payments":
        return t.payments || "Paiements";
      case "settings":
        return t.settings || "Paramètres";
      default:
        return t.dashboard || "Tableau de bord";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#111522] flex flex-col lg:flex-row font-sans print:min-h-0 print:bg-white print:block w-full max-w-full overflow-x-hidden">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111522] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#ffdc45]/30 animate-fade-in no-print">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffdc45] animate-ping" />
          <span className="text-xs font-bold font-sans">{toastMessage}</span>
        </div>
      )}

      {/* Navigation latérale */}
      <div className="no-print">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={handleTabChange}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onOpenNewInvoice={handleOpenNewInvoice}
          invoicesCount={invoices.length}
          clientsCount={clients.length}
          userName={userFullName}
          userEmail={authUser.email || ""}
          onLogout={handleLogout}
        />
      </div>

      {/* Conteneur principal lumineux */}
      <div className="flex-1 lg:pl-60 xl:pl-64 flex flex-col min-w-0 max-w-full w-full overflow-x-hidden print:pl-0 print:m-0 print:w-full print:block">
        <div className="no-print w-full max-w-full">
          <Header
            onToggleMobile={() => setMobileOpen(true)}
            onOpenNewInvoice={handleOpenNewInvoice}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={(q) => setSearchQuery(q)}
            title={getHeaderTitle()}
            subtitle={
              activeCompany.name && activeCompany.name !== "Mon Entreprise"
                ? activeCompany.name
                : undefined
            }
            invoices={invoices}
            clients={clients}
            onSelectInvoice={handleSelectInvoice}
            onSelectClient={(cl) => {
              handleTabChange("clients");
              showToast(`Fiche client : ${cl.name}`);
            }}
          />
        </div>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-28 sm:pb-12 max-w-7xl w-full min-w-0 mx-auto space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full box-border">
          {/* ========================================================= */}
          {/* 1. TABLEAU DE BORD LUMINEUX & AÉRÉ                        */}
          {/* ========================================================= */}
          {currentTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              {/* Message d'accueil lumineux + Sélecteur de date responsive */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#111522] tracking-tight">
                    Bonjour, {firstName}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5f6571] mt-1 flex items-center gap-2">
                    <span>
                      Suivez vos factures, encaissements et clients en temps réel.
                    </span>
                    {(isDbLoading || isSyncing) && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#332900] bg-[#fff0a6] px-2.5 py-0.5 rounded-full border border-[#ffe36a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111522] animate-ping" />
                        Synchronisation...
                      </span>
                    )}
                  </p>
                </div>

                {/* Sélecteur de période & calendrier interactif déplaçable */}
                <DateRangePicker
                  startDate={dateFilterStart}
                  endDate={dateFilterEnd}
                  onChange={(start, end) => {
                    setDateFilterStart(start);
                    setDateFilterEnd(end);
                    if (!start && !end) {
                      setSelectedDateRange("all");
                    } else if (start === end) {
                      setSelectedDateRange("day");
                    } else {
                      setSelectedDateRange("custom");
                    }
                  }}
                  onClear={() => {
                    setDateFilterStart("");
                    setDateFilterEnd("");
                    setSelectedDateRange("all");
                  }}
                  invoices={invoices}
                />
              </div>

              {/* ── BANNIÈRE DE RECHERCHE & RAPPROCHEMENT INTELLIGENT DU DASHBOARD ── */}
              {searchQuery.trim() && (
                <div className="p-4 sm:p-5 rounded-3xl bg-[#111522] text-white shadow-xl shadow-[#111522]/25 border border-white/10 space-y-4 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#ffdc45]/15 text-[#ffdc45] border border-[#ffdc45]/30">
                        🔍 Recherche Dashboard
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white">
                        Résultats pour &laquo; <strong className="text-[#ffdc45] font-mono">{searchQuery}</strong> &raquo;
                      </span>
                      {dashboardSearchAmount && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-[#191f30] text-[#ffdc45] border border-white/10">
                          Montant cible : {formatFCFA(dashboardSearchAmount)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="px-3 py-1.5 rounded-xl bg-[#191f30] hover:bg-[#1b253d] text-[#c4c7d1] hover:text-white text-xs font-bold transition active:scale-95 border border-white/10 self-start sm:self-auto cursor-pointer"
                    >
                      ✕ Effacer la recherche
                    </button>
                  </div>

                  {/* CAS 1 : Regroupement de 2 ou 3 factures trouvé (Demande expresse de l'utilisateur) */}
                  {dashboardCombinations.length > 0 && dashboardSearchAmount ? (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-[#191f30] rounded-2xl border border-[#ffdc45]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-[#e5e6ea] leading-relaxed">
                          <strong className="text-[#ffdc45] text-sm block font-extrabold">
                            ⚡ Regroupement intelligent de factures trouvé :
                          </strong>
                          <span>
                            {dashboardMatchingInvoices.length === 0
                              ? `Aucune facture unique ne fait ${formatFCFA(dashboardSearchAmount)}, mais ces factures cumulées font exactement la somme de :`
                              : `Ces factures combinées totalisent également la somme exacte de :`}
                          </span>
                        </div>
                        <span className="font-mono text-sm sm:text-base font-black text-[#ffdc45] shrink-0">
                          = {formatFCFA(dashboardSearchAmount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dashboardCombinations.map((combo, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-[#141a2b] border border-white/10 space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[#ffdc45] font-extrabold">Proposition {idx + 1}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#d0d3dc] font-bold">
                                  {combo.invoices.length} factures regroupées
                                </span>
                                {combo.label && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffdc45]/20 text-[#ffdc45] border border-[#ffdc45]/30 font-bold">
                                    {combo.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-black text-white text-xs">
                                  {combo.isApproximate ? "≈ " : "Total = "} {formatFCFA(combo.total)}
                                </span>
                                {combo.isApproximate && combo.difference !== undefined && combo.difference > 0 && (
                                  <span className="text-[10px] text-[#ffe879] block font-normal">
                                    (Écart : {formatFCFA(combo.difference)})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {combo.invoices.map((inv, invIdx) => (
                                <div key={inv.id} className="space-y-1">
                                  {invIdx > 0 && (
                                    <div className="flex items-center justify-center my-0.5">
                                      <span className="w-5 h-5 rounded-full bg-white/10 text-[#ffdc45] text-xs font-bold flex items-center justify-center">
                                        +
                                      </span>
                                    </div>
                                  )}
                                  <div
                                    onClick={() => handleSelectInvoice(inv)}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c111d] hover:bg-[#191f30] border border-white/10 hover:border-[#ffdc45]/60 cursor-pointer transition text-xs group"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-[#ffdc45] group-hover:underline">
                                          {inv.number}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-[#c4c7d1]">
                                          {inv.status === "payee" ? "Payée" : inv.status === "envoyee" ? "Envoyée" : "En retard"}
                                        </span>
                                      </div>
                                      <span className="text-[#d0d3dc] text-[11px] truncate block mt-0.5">
                                        {inv.clientName}
                                      </span>
                                    </div>
                                    <span className="font-mono font-extrabold text-white text-xs shrink-0">
                                      {formatFCFA(inv.paidAmount || inv.netToPay || inv.totalTTC)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-1 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTabChange("invoices")}
                                className="w-full py-2 px-3 rounded-xl bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs font-extrabold transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>📋 Voir ces factures dans la liste</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : dashboardMatchingInvoices.length > 0 ? (
                    /* CAS 2 : Factures uniques trouvées */
                    <div className="space-y-2">
                      <p className="text-xs text-[#d0d3dc] font-bold">
                        {dashboardMatchingInvoices.length} facture(s) trouvée(s) :
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {dashboardMatchingInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            onClick={() => handleSelectInvoice(inv)}
                            className="p-3 rounded-2xl bg-[#191f30] hover:bg-[#1b253d] border border-white/10 hover:border-[#ffdc45]/60 cursor-pointer transition flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-mono font-bold text-[#ffdc45] block">{inv.number}</span>
                              <span className="text-[#d0d3dc] text-[11px] truncate block">{inv.clientName}</span>
                            </div>
                            <span className="font-mono font-bold text-white shrink-0">
                              {formatFCFA(inv.paidAmount || inv.netToPay || inv.totalTTC)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* CAS 3 : Aucun résultat */
                    <div className="p-4 bg-[#141a2b] rounded-2xl border border-white/10 text-center text-xs text-[#a2a8b5] space-y-1">
                      <p>Aucune facture individuelle ni aucun regroupement de factures ne correspond au montant {dashboardSearchAmount ? formatFCFA(dashboardSearchAmount) : `« ${searchQuery} »`}.</p>
                    </div>
                  )}
                </div>
              )}

              {/* 4 Cartes KPIs avec inversion Noir Obsidienne au clic (Inspirées fidèlement du Dashboard utilisateur) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                <StatCard
                  type="paid"
                  title="Total Encaissé"
                  amount={totalPaidAmount}
                  variation={`${paidCount}`}
                  isPositive={true}
                  subtext="Sur la période sélectionnée"
                  count={paidCount}
                  isSelected={selectedKpi === "paid"}
                  onClick={() => setSelectedKpi("paid")}
                />
                <StatCard
                  type="pending"
                  title="Factures en Attente"
                  amount={pendingAmount}
                  variation={`${pendingCount}`}
                  isPositive={true}
                  subtext={`${pendingCount} facture(s) envoyée(s)`}
                  count={pendingCount}
                  isSelected={selectedKpi === "pending"}
                  onClick={() => setSelectedKpi("pending")}
                />
                <StatCard
                  type="overdue"
                  title="En Retard"
                  amount={overdueAmount}
                  variation={`${overdueCount}`}
                  isPositive={overdueAmount === 0}
                  subtext={`${overdueCount} facture(s) en retard`}
                  count={overdueCount}
                  isSelected={selectedKpi === "overdue"}
                  onClick={() => setSelectedKpi("overdue")}
                />
                <StatCard
                  type="clients"
                  title="Total Clients"
                  amount={clients.length}
                  unit=""
                  variation={`${clients.length}`}
                  isPositive={true}
                  subtext={`${clients.length} clients enregistrés`}
                  isSelected={selectedKpi === "clients"}
                  onClick={() => setSelectedKpi("clients")}
                />
              </div>

              {/* Section Factures Récentes claire et lumineuse */}
              <div className="bg-white rounded-3xl border border-[#e8e7e2] shadow-[0_12px_32px_rgba(17,21,34,0.05)] overflow-hidden">
                <div className="px-5 sm:px-7 py-5 border-b border-[#edece6] flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-lg sm:text-xl font-medium text-[#111522] tracking-tight flex items-center gap-2">
                      <span>Factures Récentes</span>
                    </h2>
                    <p className="text-xs text-[#697080] mt-0.5">
                      {dateFilterStart && dateFilterEnd
                        ? `Aperçu des ${displayInvoices.length} facture(s) du ${formatDisplayDateFR(dateFilterStart)} au ${formatDisplayDateFR(dateFilterEnd)}.`
                        : dateFilterStart
                          ? `Aperçu des ${displayInvoices.length} facture(s) à partir du ${formatDisplayDateFR(dateFilterStart)}.`
                          : dateFilterEnd
                            ? `Aperçu des ${displayInvoices.length} facture(s) jusqu'au ${formatDisplayDateFR(dateFilterEnd)}.`
                            : "Aperçu de vos 5 dernières factures générées."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange("invoices")}
                    className="px-3.5 py-2 rounded-full border border-[#e4e2d9] bg-[#f8f7f3] hover:bg-[#111522] hover:text-[#ffdc45] hover:border-[#111522] text-xs font-bold text-[#111522] transition active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tout voir ↗</span>
                  </button>
                </div>

                {displayInvoices.length === 0 ? (
                  <div className="p-10 sm:p-12 text-center space-y-2.5">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fff0a6] flex items-center justify-center text-[#332900] text-lg">
                      📄
                    </div>
                    <p className="text-sm font-bold text-[#111522]">
                      {hasDateRangeFilter
                        ? "Aucune facture trouvée pour la période sélectionnée."
                        : "Aucune facture récente."}
                    </p>
                    <p className="text-xs text-[#697080] max-w-sm mx-auto">
                      {hasDateRangeFilter
                        ? "Modifiez la plage de dates ci-dessus ou cliquez sur ✕ pour réinitialiser le filtre."
                        : "Vos 5 dernières factures générées apparaîtront automatiquement ici."}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenNewInvoice}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffdc45] hover:bg-[#ffe879] text-[#111522] text-xs font-bold shadow-[0_8px_20px_rgba(255,220,69,0.28)] transition active:scale-95 cursor-pointer mt-1"
                    >
                      <IconPlus className="w-3.5 h-3.5 text-[#111522]" />
                      <span>Créer une facture</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="text-[#697080] font-semibold border-b border-[#edece6] text-[11px] uppercase tracking-wider bg-[#f8f7f3]">
                          <th className="py-3.5 pl-6 pr-3">Client</th>
                          <th className="py-3.5 px-3">Numéro</th>
                          <th className="py-3.5 px-3">Date</th>
                          <th className="py-3.5 px-3">Statut</th>
                          <th className="py-3.5 pl-3 pr-6 text-right">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edece6]">
                        {displayInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            onClick={() => handleSelectInvoice(inv)}
                            className="hover:bg-[#f8f7f3]/90 transition cursor-pointer"
                          >
                            <td className="py-4 pl-6 pr-3">
                              <span className="font-bold text-[#111522] block">
                                {inv.clientName}
                              </span>
                              {inv.clientEmail && (
                                <span className="text-xs text-[#697080] block">
                                  {inv.clientEmail}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3 font-mono font-semibold text-[#5f6571] whitespace-nowrap">
                              {inv.number}
                            </td>
                            <td className="py-4 px-3 font-mono text-[#697080] whitespace-nowrap">
                              {formatDateFR(inv.issueDate)}
                            </td>
                            <td
                              className="py-4 px-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StatusSelector
                                currentStatus={inv.status}
                                onUpdateStatus={(s) =>
                                  handleUpdateStatus(inv.id, s)
                                }
                                variant="badge"
                              />
                            </td>
                            <td className="py-4 pl-3 pr-6 text-right font-mono font-extrabold text-[#111522] whitespace-nowrap">
                              {formatFCFA(inv.netToPay || inv.totalTTC)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Graphique d'évolution du Chiffre d'Affaires */}
              <div className="w-full">
                <RevenueChart invoices={invoices} />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. LISTE DES FACTURES                                     */}
          {/* ========================================================= */}
          {currentTab === "invoices" && (
            <InvoicesListPage
              invoices={invoices}
              onSelectInvoice={handleSelectInvoice}
              onOpenNewInvoice={handleOpenNewInvoice}
              onEditInvoice={handleEditInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onUpdateStatus={handleUpdateStatus}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery("")}
              onOpenAIAssistant={() => setIsAiAssistantOpen(true)}
            />
          )}

          {/* ========================================================= */}
          {/* 3. CRÉER / MODIFIER UNE FACTURE                           */}
          {/* ========================================================= */}
          {currentTab === "create-invoice" && (
            <CreateInvoicePage
              clients={clients}
              companies={companies}
              activeCompany={activeCompany}
              editingInvoice={editingInvoice}
              preselectedClientId={preselectedClientId}
              onSaveInvoice={handleSaveInvoice}
              onNavigateToInvoices={() => {
                setEditingInvoice(null);
                setPreselectedClientId(null);
                handleTabChange("invoices");
              }}
              onNavigateToDetail={(inv) => {
                setEditingInvoice(null);
                setPreselectedClientId(null);
                setSelectedInvoice(inv);
                handleTabChange("invoice-detail");
              }}
              onCancel={() => {
                setEditingInvoice(null);
                setPreselectedClientId(null);
                handleTabChange("invoices");
              }}
            />
          )}

          {/* ========================================================= */}
          {/* 4. VUE DÉTAIL D'UNE FACTURE                               */}
          {/* ========================================================= */}
          {currentTab === "invoice-detail" && selectedInvoice && (
            <InvoiceDetailPage
              invoice={selectedInvoice}
              allInvoices={invoices}
              activeCompany={activeCompany}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onBack={() => handleTabChange("invoices")}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {/* ========================================================= */}
          {/* 5. ANNUAIRE CLIENTS COMPLET                               */}
          {/* ========================================================= */}
          {currentTab === "clients" && (
            <ClientsPage
              clients={clients}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onCreateInvoiceForClient={handleCreateInvoiceForClient}
              globalSearchQuery={searchQuery}
            />
          )}

          {/* ========================================================= */}
          {/* 6. PARAMÈTRES ENTREPRISE & RÉGIONAL                       */}
          {/* ========================================================= */}
          {currentTab === "settings" && (
            <SettingsPage
              activeCompany={activeCompany}
              onSaveCompany={handleSaveCompany}
              showToast={showToast}
              onCreateInvoiceWithTemplate={(templateId) => {
                handleSaveCompany({
                  ...activeCompany,
                  invoiceTemplateId: templateId,
                });
                setEditingInvoice(null);
                handleTabChange("create-invoice");
              }}
            />
          )}
          {/* Déclencheur Flottant de l'Assistant IA (accessible de partout) */}
          <AIAssistantTrigger onClick={() => setIsAiAssistantOpen(true)} />

          {/* Modale interactive de l'Agent IA iziBot */}
          <AIAssistantModal
            isOpen={isAiAssistantOpen}
            onClose={() => setIsAiAssistantOpen(false)}
            activeCompany={activeCompany}
            clients={clients}
            invoices={invoices}
            onSaveGeneratedInvoice={(aiInvoice, newClient) => {
              if (newClient) {
                setClients((prev) => {
                  const exists = prev.some(
                    (c) => c.name.toLowerCase().trim() === newClient.name.toLowerCase().trim()
                  );
                  return exists ? prev : [newClient, ...prev];
                });
                showToast(`✨ Nouveau client "${newClient.name}" créé et ajouté à la liste des clients !`);
              }
              handleSaveInvoice(aiInvoice, { navigateTo: "stay" });
              showToast(`✅ Facture ${aiInvoice.number} enregistrée (Client : ${aiInvoice.clientName})`);
            }}
            onOpenInEditor={(aiInvoice, newClient) => {
              if (newClient) {
                setClients((prev) => {
                  const exists = prev.some(
                    (c) => c.name.toLowerCase().trim() === newClient.name.toLowerCase().trim()
                  );
                  return exists ? prev : [newClient, ...prev];
                });
              }
              setEditingInvoice(aiInvoice);
              handleTabChange("create-invoice");
            }}
            onSelectInvoice={(aiInvoice) => {
              setSelectedInvoice(aiInvoice);
              handleTabChange("invoice-detail");
            }}
            onShareWhatsApp={(aiInvoice) => {
              setSelectedInvoice(aiInvoice);
              handleTabChange("invoice-detail");
            }}
          />

          {/* Confirmation de déconnexion sécurisée */}
          <ConfirmDialog
            isOpen={showLogoutConfirm}
            title="Se déconnecter"
            message="Êtes-vous sûr de vouloir vous déconnecter de votre compte AMOMD FACTURE ?"
            confirmLabel="Se déconnecter"
            cancelLabel="Annuler"
            isDestructive={true}
            onConfirm={confirmLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        </main>
      </div>
    </div>
  );
}

const App: React.ComponentType<{
  params?: Record<string, string | string[]>;
  searchParams?: Record<string, string | string[] | undefined>;
  initialTab?: string;
}> = function App(props) {
  const initialTab =
    props.initialTab ||
    (typeof props.searchParams?.tab === "string"
      ? props.searchParams.tab
      : "dashboard");
  return (
    <LanguageProvider>
      <MainApp initialTab={initialTab} />
    </LanguageProvider>
  );
};

export default App as any;
