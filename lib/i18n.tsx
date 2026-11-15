"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "fr" | "en" | "ar" | "es" | "pt" | "de" | "ha" | "zh";

export interface Translations {
  // Navigation & General
  dashboard: string;
  invoices: string;
  clients: string;
  products: string;
  payments: string;
  settings: string;
  help: string;
  newInvoice: string;
  logout: string;
  liveSahel: string;
  allRightsReserved: string;
  sahelNigerBilling: string;
  dailyManagement: string;
  configuration: string;
  activeCompanyTitle: string;

  // Header
  searchPlaceholder: string;
  notifications: string;
  markAllRead: string;
  clearAll: string;
  noNotifications: string;
  currencyXOF: string;
  filterBtn: string;
  resultsFor: string;
  invoicesFoundGroup: string;
  clientsFoundGroup: string;
  noResultsFound: string;

  // Dashboard
  dashboardTitle: string;
  dashboardSubtitle: string;
  kpiTotalBilled: string;
  kpiTotalPaid: string;
  kpiPending: string;
  kpiOverdue: string;
  vsLastMonth: string;
  recoveryRate: string;
  invoicesToFollowUp: string;
  notDue: string;
  invoicesCountSuffix: string;
  revenueEvolution: string;
  realTime: string;
  month: string;
  quarter: string;
  year: string;
  collected: string;
  billed: string;
  topClients: string;
  topClientsSubtitle: string;
  majorClients: string;
  fiveCompanies: string;
  inGoodStanding: string;

  // Invoices Register
  invoicesRegistry: string;
  invoicesRegistrySubtitle: string;
  registeredInvoicesCount: string;
  allTab: string;
  paidTab: string;
  sentTab: string;
  overdueTab: string;
  draftsTab: string;
  invoiceNumberCol: string;
  clientRecipientCol: string;
  emissionDueCol: string;
  paymentModeCol: string;
  amountTTCCol: string;
  statusCol: string;
  actionsCol: string;
  searchInvoicesPlaceholder: string;
  clearFilterBtn: string;
  searchFilterNotice: string;
  viewDetailAction: string;
  editInvoiceAction: string;
  deleteInvoiceAction: string;
  noInvoicesFound: string;

  // Statuses
  statusPaid: string;
  statusSent: string;
  statusOverdue: string;
  statusDraft: string;
  changeStatusAction: string;
  changeStatusTitle: string;

  // Create & Edit Invoice
  createInvoice: string;
  editInvoice: string;
  newEmissionBadge: string;
  editEmissionBadge: string;
  invoiceSubtitleDesc: string;
  cancel: string;
  saveDraft: string;
  emitInvoice: string;
  saveChanges: string;
  editFormTab: string;
  livePreviewTab: string;
  clientRecipient: string;
  issueDate: string;
  dueDate: string;
  paymentMode: string;
  paymentDetailLabel: string;
  invoiceObjectLabel: string;
  invoiceLinesTitle: string;
  descriptionCol: string;
  qtyCol: string;
  unitPriceHTCol: string;
  totalHTCol: string;
  addLineBtn: string;
  subtotalHT: string;
  commercialDiscount: string;
  netCommercial: string;
  financialDiscount: string;
  netFinancier: string;
  advanceDeducted: string;
  taxableHT: string;
  vatRate: string;
  totalTTC: string;
  precompteRate: string;
  precompteISB: string;
  netToPay: string;
  mobileMoney: string;
  bankCard: string;
  creditCard: string;
  cashPayment: string;
  stoppedSum: string;
  certifiedStamp: string;
  forDirection: string;
  officialStampTitle: string;
  uploadStampBtn: string;
  removeStampBtn: string;
  consignationLabel: string;

  // Invoice Detail Page
  invoiceDetailsTitle: string;
  backToInvoices: string;
  previousInvoice: string;
  nextInvoice: string;
  printInvoice: string;
  downloadPDF: string;
  sendWhatsApp: string;
  deleteInvoice: string;
  modify: string;
  previous: string;
  next: string;

  // Clients Page
  clientsDirectory: string;
  clientsSubtitle: string;
  newClient: string;
  totalClients: string;
  totalPortfolio: string;
  cumulativeBilled: string;
  clientNameCol: string;
  contactCol: string;
  phoneCol: string;
  emailCol: string;
  cityCol: string;
  addressCol: string;
  totalBilledCol: string;
  searchClientPlaceholder: string;
  editClient: string;
  deleteClient: string;
  createInvoiceForClient: string;
  addClientTitle: string;
  editClientTitle: string;
  saveClientBtn: string;
  clientNifLabel: string;
  whatsappLabel: string;

  // Settings Page
  settingsTitle: string;
  settingsSubtitle: string;
  saveSettings: string;
  tabCompanyProfile: string;
  tabRegionCalendar: string;
  tabInvoiceTemplates: string;
  tabTeamAccess: string;
  companyIdentityTitle: string;
  companyIdentityDesc: string;
  legalNameLabel: string;
  rcNineaLabel: string;
  headquartersAddressLabel: string;
  contactDetailsTitle: string;
  contactDetailsDesc: string;
  billingEmailLabel: string;
  businessPhoneLabel: string;
  visualsTitle: string;
  visualsDesc: string;
  companyLogoLabel: string;
  uploadLogoBtn: string;
  removeLogoBtn: string;
  officialStampLabel: string;
  uploadStampActionBtn: string;
  removeStampActionBtn: string;
  regionalSettingsTitle: string;
  regionalSettingsDesc: string;
  countryLabel: string;
  cityLabel: string;
  languageLabel: string;
  mainCurrencyLabel: string;
  timezoneLabel: string;
  languageActiveNotice: string;
  switchLanguageBtn: string;
  invoiceTemplatesTitle: string;
  invoiceTemplatesDesc: string;
  teamAccessTitle: string;
  teamAccessDesc: string;
  inviteMemberBtn: string;
  importInvoiceTemplateBtn: string;
  invoiceTemplateImportDesc: string;

  // Help & Support
  supportTitle: string;
  supportSubtitle: string;
  supportWhatsApp: string;
  supportCall: string;
  supportHours: string;

  // Optional convenience aliases
  editForm?: string;
  livePreview?: string;
  invoiceNumber?: string;
  object?: string;
  invoiceLines?: string;
  addLine?: string;
  quantity?: string;
}

const baseTranslations = {
  fr: {
    // Navigation & General
    dashboard: "Tableau de bord",
    invoices: "Factures",
    clients: "Clients",
    products: "Catalogue & Tarifs",
    payments: "Paiements & Trésorerie",
    settings: "Paramètres",
    help: "Aide & Support",
    newInvoice: "Nouvelle facture",
    logout: "Se déconnecter",
    liveSahel: "Espace Certifié Sahel",
    allRightsReserved: "Tous droits réservés",
    sahelNigerBilling: "Facturation Sahel & Niger",
    dailyManagement: "Gestion Quotidienne",
    configuration: "Configuration",
    activeCompanyTitle: "Entreprise active",

    // Header
    searchPlaceholder: "Rechercher par montant, client, entreprise, N°...",
    notifications: "Notifications",
    markAllRead: "Tout marquer comme lu",
    clearAll: "Effacer tout",
    noNotifications: "Aucune notification active.",
    currencyXOF: "Devise XOF (FCFA)",
    filterBtn: "Filtrer",
    resultsFor: "Résultats pour",
    invoicesFoundGroup: "Factures trouvées",
    clientsFoundGroup: "Clients trouvés",
    noResultsFound: "Aucune facture ni client ne correspond à cette recherche.",

    // Dashboard
    dashboardTitle: "Tableau de bord",
    dashboardSubtitle: "Gestion financière & facturation en temps réel",
    kpiTotalBilled: "Total facturé",
    kpiTotalPaid: "Montant encaissé",
    kpiPending: "En attente",
    kpiOverdue: "En retard",
    vsLastMonth: "vs mois dernier",
    recoveryRate: "Taux de recouvrement",
    invoicesToFollowUp: "factures à relancer",
    notDue: "factures non échues",
    invoicesCountSuffix: "factures",
    revenueEvolution: "Évolution du Chiffre d'Affaires",
    realTime: "Temps réel",
    month: "Mois",
    quarter: "Trimestre",
    year: "Année",
    collected: "Encaissé",
    billed: "Facturé",
    topClients: "Top 3 du portefeuille",
    topClientsSubtitle: "Classement par volume de facturation cumulé en FCFA",
    majorClients: "Clients Majeurs",
    fiveCompanies: "3 Entreprises",
    inGoodStanding: "En règle",

    // Invoices Register
    invoicesRegistry: "Registre des Factures",
    invoicesRegistrySubtitle: "Consultez, filtrez et gérez l'ensemble de vos factures clients en FCFA",
    registeredInvoicesCount: "factures enregistrées",
    allTab: "Toutes",
    paidTab: "Payées",
    sentTab: "Envoyées",
    overdueTab: "En retard",
    draftsTab: "Brouillons",
    invoiceNumberCol: "N° Facture",
    clientRecipientCol: "Client Destinataire",
    emissionDueCol: "Émission / Échéance",
    paymentModeCol: "Mode de Paiement",
    amountTTCCol: "Montant TTC",
    statusCol: "Statut",
    actionsCol: "Actions",
    searchInvoicesPlaceholder: "Rechercher client, N°, ville, montant...",
    clearFilterBtn: "Effacer le filtre",
    searchFilterNotice: "facture(s) trouvée(s)",
    viewDetailAction: "Voir le détail",
    editInvoiceAction: "Modifier la facture",
    deleteInvoiceAction: "Supprimer la facture",
    noInvoicesFound: "Aucune facture trouvée pour ce filtre.",

    // Statuses
    statusPaid: "Payée",
    statusSent: "Envoyée",
    statusOverdue: "En retard",
    statusDraft: "Brouillon",
    changeStatusAction: "Changer de statut",
    changeStatusTitle: "Changer le statut",

    // Create & Edit Invoice
    createInvoice: "Créer une Facture",
    editInvoice: "Modifier la Facture",
    newEmissionBadge: "Nouvelle Émission",
    editEmissionBadge: "Modification",
    invoiceSubtitleDesc: "Émettez votre facture certifiée. Décompte financier OHADA & calculs automatiques.",
    cancel: "Annuler",
    saveDraft: "Sauvegarder brouillon",
    emitInvoice: "Émettre la facture",
    saveChanges: "Enregistrer les modifications",
    editFormTab: "Formulaire de Saisie",
    livePreviewTab: "Aperçu de la Facture",
    clientRecipient: "Client destinataire",
    issueDate: "Date d'émission",
    dueDate: "Date d'échéance",
    paymentMode: "Mode de règlement",
    paymentDetailLabel: "Détail du paiement (N° compte, opérateur...)",
    invoiceObjectLabel: "Objet de la prestation / facture",
    invoiceLinesTitle: "Lignes de facturation",
    descriptionCol: "Désignation de la prestation ou marchandise",
    qtyCol: "Quantité",
    unitPriceHTCol: "Prix Unit. HT",
    totalHTCol: "Total HT",
    addLineBtn: "Ajouter une ligne",
    subtotalHT: "Sous-total HT",
    commercialDiscount: "Remise commerciale",
    netCommercial: "Net Commercial",
    financialDiscount: "Escompte financier",
    netFinancier: "Net Financier",
    advanceDeducted: "Avance / Acompte déduit",
    taxableHT: "Montant HT imposable",
    vatRate: "TVA légale",
    totalTTC: "Total TTC",
    precompteRate: "Précompte fiscal",
    precompteISB: "Précompte fiscal (Retenue)",
    netToPay: "Net à payer",
    mobileMoney: "Airtel Money, Moov Money, MyNita, Amanata",
    bankCard: "Carte Bancaire (Visa, Mastercard, GIM-UEMOA)",
    creditCard: "Carte de Crédit",
    cashPayment: "Espèces (Cash / Liquidités)",
    stoppedSum: "Arrêté la présente facture à la somme de :",
    certifiedStamp: "Cachet & Signature",
    forDirection: "Pour la Direction Générale",
    officialStampTitle: "Cachet / Tampon Officiel",
    uploadStampBtn: "Importer votre cachet officiel",
    removeStampBtn: "Retirer le cachet",
    consignationLabel: "Consignation (emballages)",

    // Invoice Detail Page
    invoiceDetailsTitle: "Détail Facture",
    backToInvoices: "Retour aux factures",
    previousInvoice: "Facture précédente",
    nextInvoice: "Facture suivante",
    printInvoice: "Imprimer",
    downloadPDF: "Télécharger PDF",
    sendWhatsApp: "Envoyer par WhatsApp",
    deleteInvoice: "Supprimer la facture",
    modify: "Modifier",
    previous: "Précédente",
    next: "Suivante",

    // Clients Page
    clientsDirectory: "Annuaire des Clients",
    clientsSubtitle: "Gérez vos comptes clients, partenaires et coordonnées au Niger et dans l'UEMOA",
    newClient: "Nouveau client",
    totalClients: "Total Clients",
    totalPortfolio: "Total Portefeuille",
    cumulativeBilled: "Facturation Cumulée",
    clientNameCol: "Client",
    contactCol: "Contact",
    phoneCol: "Téléphone",
    emailCol: "Email",
    cityCol: "Ville",
    addressCol: "Adresse",
    totalBilledCol: "Total Facturé",
    searchClientPlaceholder: "Rechercher par nom, ville, contact, email...",
    editClient: "Modifier la fiche client",
    deleteClient: "Supprimer le client",
    createInvoiceForClient: "Créer une facture pour ce client",
    addClientTitle: "Ajouter un nouveau client",
    editClientTitle: "Modifier le client",
    saveClientBtn: "Enregistrer le client",
    clientNifLabel: "NIF Client (optionnel)",
    whatsappLabel: "WhatsApp de facturation",

    // Settings Page
    settingsTitle: "Paramètres",
    settingsSubtitle: "Gérez les configurations générales de votre espace de travail.",
    saveSettings: "Enregistrer",
    tabCompanyProfile: "Profil de l'entreprise",
    tabRegionCalendar: "Régional & Devises",
    tabInvoiceTemplates: "Modèles de facturation",
    tabTeamAccess: "Équipe & Accès",
    companyIdentityTitle: "Identité de l'entreprise",
    companyIdentityDesc: "Les informations officielles de votre société.",
    legalNameLabel: "Nom légal",
    rcNineaLabel: "RCCM (Registre du Commerce et du Crédit Mobilier)",
    headquartersAddressLabel: "Adresse du siège social",
    contactDetailsTitle: "Coordonnées de contact",
    contactDetailsDesc: "Visibles publiquement sur vos documents.",
    billingEmailLabel: "Email de facturation",
    businessPhoneLabel: "Téléphone pro",
    visualsTitle: "Visuels & Cachet Officiel",
    visualsDesc: "Importez votre logo et votre cachet physique pour apposition automatique sur les factures.",
    companyLogoLabel: "Logo de l'entreprise",
    uploadLogoBtn: "Importer logo",
    removeLogoBtn: "Retirer",
    officialStampLabel: "Cachet / Tampon Officiel",
    uploadStampActionBtn: "Importer mon cachet",
    removeStampActionBtn: "Retirer",
    regionalSettingsTitle: "Régional & Devises",
    regionalSettingsDesc: "Configurez le pays d'exercice, la langue et les paramètres régionaux.",
    countryLabel: "Pays d'exercice",
    cityLabel: "Ville principale",
    languageLabel: "Langue de l'interface",
    mainCurrencyLabel: "Devise principale",
    timezoneLabel: "Fuseau Horaire (auto-détecté)",
    languageActiveNotice: "Langue active : Français (OHADA / UEMOA)",
    switchLanguageBtn: "Basculer en Anglais",
    invoiceTemplatesTitle: "Modèles de facturation",
    invoiceTemplatesDesc: "Choisissez ou importez votre propre modèle de facture personnalisé.",
    teamAccessTitle: "Équipe & Accès",
    teamAccessDesc: "Gestion des collaborateurs autorisés sur votre espace de facturation.",
    inviteMemberBtn: "Inviter un collaborateur",
    importInvoiceTemplateBtn: "Importer mon modèle de facture",
    invoiceTemplateImportDesc: "Importez un PDF de facture existant pour l'utiliser comme modèle automatique.",

    // Help & Support
    supportTitle: "Aide & Support AMOMD FACTURE",
    supportSubtitle: "Assistance rapide par des experts de la facturation au Sahel",
    supportWhatsApp: "Assistance WhatsApp Directe",
    supportCall: "Assistance Téléphonique",
    supportHours: "7j/7 de 8h à 20h (Heure de Niamey / GMT+1)",
  },

  en: {
    // Navigation & General
    dashboard: "Dashboard",
    invoices: "Invoices",
    clients: "Clients",
    products: "Catalog & Pricing",
    payments: "Payments & Treasury",
    settings: "Settings",
    help: "Help & Support",
    newInvoice: "New invoice",
    logout: "Sign out",
    liveSahel: "Sahel Certified Space",
    allRightsReserved: "All rights reserved",
    sahelNigerBilling: "Sahel & Niger Invoicing",
    dailyManagement: "Daily Management",
    configuration: "Configuration",
    activeCompanyTitle: "Active company",

    // Header
    searchPlaceholder: "Search by amount, client, company, No...",
    notifications: "Notifications",
    markAllRead: "Mark all as read",
    clearAll: "Clear all",
    noNotifications: "No active notifications.",
    currencyXOF: "Currency XOF (FCFA)",
    filterBtn: "Filter",
    resultsFor: "Results for",
    invoicesFoundGroup: "Invoices found",
    clientsFoundGroup: "Clients found",
    noResultsFound: "No invoices or clients match this search.",

    // Dashboard
    dashboardTitle: "Dashboard",
    dashboardSubtitle: "Real-time billing & financial management",
    kpiTotalBilled: "Total billed",
    kpiTotalPaid: "Total collected",
    kpiPending: "Pending",
    kpiOverdue: "Overdue",
    vsLastMonth: "vs last month",
    recoveryRate: "Collection rate",
    invoicesToFollowUp: "invoices to follow up",
    notDue: "invoices not due",
    invoicesCountSuffix: "invoices",
    revenueEvolution: "Revenue Growth",
    realTime: "Real-time",
    month: "Month",
    quarter: "Quarter",
    year: "Year",
    collected: "Collected",
    billed: "Billed",
    topClients: "Top 3 Clients Portfolio",
    topClientsSubtitle: "Ranking by cumulative billed volume in FCFA",
    majorClients: "Major Clients",
    fiveCompanies: "3 Companies",
    inGoodStanding: "In good standing",

    // Invoices Register
    invoicesRegistry: "Invoices Register",
    invoicesRegistrySubtitle: "View, filter and manage all your client invoices in FCFA",
    registeredInvoicesCount: "registered invoices",
    allTab: "All",
    paidTab: "Paid",
    sentTab: "Sent",
    overdueTab: "Overdue",
    draftsTab: "Drafts",
    invoiceNumberCol: "Invoice No.",
    clientRecipientCol: "Client Recipient",
    emissionDueCol: "Issued / Due Date",
    paymentModeCol: "Payment Method",
    amountTTCCol: "Total Incl. Tax",
    statusCol: "Status",
    actionsCol: "Actions",
    searchInvoicesPlaceholder: "Search client, No., city, amount...",
    clearFilterBtn: "Clear filter",
    searchFilterNotice: "invoice(s) found",
    viewDetailAction: "View details",
    editInvoiceAction: "Edit invoice",
    deleteInvoiceAction: "Delete invoice",
    noInvoicesFound: "No invoices found for this filter.",

    // Statuses
    statusPaid: "Paid",
    statusSent: "Sent",
    statusOverdue: "Overdue",
    statusDraft: "Draft",
    changeStatusAction: "Change status",
    changeStatusTitle: "Change status",

    // Create & Edit Invoice
    createInvoice: "Create Invoice",
    editInvoice: "Edit Invoice",
    newEmissionBadge: "New Emission",
    editEmissionBadge: "Editing",
    invoiceSubtitleDesc: "Issue your certified invoice. OHADA financial accounting & automatic calculations.",
    cancel: "Cancel",
    saveDraft: "Save draft",
    emitInvoice: "Issue invoice",
    saveChanges: "Save changes",
    editFormTab: "Entry Form",
    livePreviewTab: "Live Preview",
    clientRecipient: "Client recipient",
    issueDate: "Issue date",
    dueDate: "Due date",
    paymentMode: "Payment method",
    paymentDetailLabel: "Payment details (account number, carrier...)",
    invoiceObjectLabel: "Object of service / invoice",
    invoiceLinesTitle: "Invoice line items",
    descriptionCol: "Description of service or goods",
    qtyCol: "Qty",
    unitPriceHTCol: "Unit Price Excl. Tax",
    totalHTCol: "Total Excl. Tax",
    addLineBtn: "Add line item",
    subtotalHT: "Subtotal Excl. Tax",
    commercialDiscount: "Commercial discount",
    netCommercial: "Net Commercial",
    financialDiscount: "Financial discount",
    netFinancier: "Net Financial",
    advanceDeducted: "Advance / Deposit deducted",
    taxableHT: "Taxable Amount (HT)",
    vatRate: "Statutory VAT",
    totalTTC: "Total Incl. Tax",
    precompteRate: "Tax withholding",
    precompteISB: "Tax withholding (ISB)",
    netToPay: "Net to pay",
    mobileMoney: "Airtel Money, Moov Money, MyNita, Amanata",
    bankCard: "Bank Card (Visa, Mastercard, GIM-UEMOA)",
    creditCard: "Credit Card",
    cashPayment: "Cash (Liquid Currency)",
    stoppedSum: "Certified this invoice to the total amount of:",
    certifiedStamp: "Stamp & Signature",
    forDirection: "For Executive Management",
    officialStampTitle: "Official Stamp & Seal",
    uploadStampBtn: "Upload official stamp",
    removeStampBtn: "Remove stamp",
    consignationLabel: "Consignment (packaging)",

    // Invoice Detail Page
    invoiceDetailsTitle: "Invoice Details",
    backToInvoices: "Back to invoices",
    previousInvoice: "Previous invoice",
    nextInvoice: "Next invoice",
    printInvoice: "Print",
    downloadPDF: "Download PDF",
    sendWhatsApp: "Send via WhatsApp",
    deleteInvoice: "Delete invoice",
    modify: "Edit",
    previous: "Previous",
    next: "Next",

    // Clients Page
    clientsDirectory: "Clients Directory",
    clientsSubtitle: "Manage client accounts, partners, and contact details across West Africa",
    newClient: "New client",
    totalClients: "Total Clients",
    totalPortfolio: "Total Portfolio",
    cumulativeBilled: "Cumulative Billing",
    clientNameCol: "Client",
    contactCol: "Contact",
    phoneCol: "Phone",
    emailCol: "Email",
    cityCol: "City",
    addressCol: "Address",
    totalBilledCol: "Total Billed",
    searchClientPlaceholder: "Search by name, city, contact, email...",
    editClient: "Edit client profile",
    deleteClient: "Delete client",
    createInvoiceForClient: "Create invoice for this client",
    addClientTitle: "Add a new client",
    editClientTitle: "Edit client",
    saveClientBtn: "Save client",
    clientNifLabel: "Client NIF (optional)",
    whatsappLabel: "Billing WhatsApp",

    // Settings Page
    settingsTitle: "Settings",
    settingsSubtitle: "Manage general workspace configurations.",
    saveSettings: "Save",
    tabCompanyProfile: "Company Profile",
    tabRegionCalendar: "Regional & Currency",
    tabInvoiceTemplates: "Invoice Templates",
    tabTeamAccess: "Team & Access",
    companyIdentityTitle: "Company Identity",
    companyIdentityDesc: "Official information about your company.",
    legalNameLabel: "Legal Name",
    rcNineaLabel: "RC or NINEA",
    headquartersAddressLabel: "Headquarters Address",
    contactDetailsTitle: "Contact Details",
    contactDetailsDesc: "Publicly visible on your documents.",
    billingEmailLabel: "Billing Email",
    businessPhoneLabel: "Business Phone",
    visualsTitle: "Visuals & Official Stamp",
    visualsDesc: "Upload your company logo and official physical stamp for automated affixing.",
    companyLogoLabel: "Company Logo",
    uploadLogoBtn: "Upload logo",
    removeLogoBtn: "Remove",
    officialStampLabel: "Official Stamp / Seal",
    uploadStampActionBtn: "Upload stamp",
    removeStampActionBtn: "Remove",
    regionalSettingsTitle: "Regional & Currency",
    regionalSettingsDesc: "Configure your country of operation, language, and regional parameters.",
    countryLabel: "Country of operation",
    cityLabel: "Main city",
    languageLabel: "Interface Language",
    mainCurrencyLabel: "Main Currency",
    timezoneLabel: "Timezone (auto-detected)",
    languageActiveNotice: "Active language: English (International)",
    switchLanguageBtn: "Switch to French",
    invoiceTemplatesTitle: "Invoice Templates",
    invoiceTemplatesDesc: "Choose or import your own custom invoice template.",
    teamAccessTitle: "Team & Access",
    teamAccessDesc: "Management of team members authorized on your billing workspace.",
    inviteMemberBtn: "Invite a team member",
    importInvoiceTemplateBtn: "Import my invoice template",
    invoiceTemplateImportDesc: "Import an existing invoice PDF to use as an automatic template.",

    // Help & Support
    supportTitle: "AMOMD FACTURE Help & Support",
    supportSubtitle: "Fast assistance from Sahel billing & tax specialists",
    supportWhatsApp: "Direct WhatsApp Support",
    supportCall: "Phone Support",
    supportHours: "7d/7 from 8:00 AM to 8:00 PM (Niamey time / GMT+1)",
  },

  ar: {
    // Navigation & General
    dashboard: "لوحة القيادة",
    invoices: "الفواتير",
    clients: "العملاء",
    products: "الكتالوج والأسعار",
    payments: "المدفوعات والخزينة",
    settings: "الإعدادات",
    help: "المساعدة والدعم",
    newInvoice: "فاتورة جديدة",
    logout: "تسجيل الخروج",
    liveSahel: "فضاء الساحل المعتمد",
    allRightsReserved: "جميع الحقوق محفوظة",
    sahelNigerBilling: "فوترة الساحل والنيجر",
    dailyManagement: "الإدارة اليومية",
    configuration: "الإعداد",
    activeCompanyTitle: "الشركة النشطة",

    // Header
    searchPlaceholder: "بحث بالمبلغ أو العميل أو الشركة...",
    notifications: "الإشعارات",
    markAllRead: "تحديد الكل كمقروء",
    clearAll: "مسح الكل",
    noNotifications: "لا توجد إشعارات نشطة.",
    currencyXOF: "العملة: فرنك أفريقي (FCFA)",
    filterBtn: "تصفية",
    resultsFor: "نتائج لـ",
    invoicesFoundGroup: "الفواتير الموجودة",
    clientsFoundGroup: "العملاء الموجودون",
    noResultsFound: "لا توجد فواتير أو عملاء يطابقون هذا البحث.",

    // Dashboard
    dashboardTitle: "لوحة القيادة",
    dashboardSubtitle: "الإدارة المالية والفوترة في الوقت الفعلي",
    kpiTotalBilled: "إجمالي الفواتير",
    kpiTotalPaid: "المبلغ المحصّل",
    kpiPending: "قيد الانتظار",
    kpiOverdue: "متأخر",
    vsLastMonth: "مقارنة بالشهر الماضي",
    recoveryRate: "معدل التحصيل",
    invoicesToFollowUp: "فواتير للمتابعة",
    notDue: "فواتير غير مستحقة",
    invoicesCountSuffix: "فواتير",
    revenueEvolution: "تطور رقم الأعمال",
    realTime: "وقت فعلي",
    month: "شهر",
    quarter: "ربع سنوي",
    year: "سنة",
    collected: "محصّل",
    billed: "مفوتر",
    topClients: "أفضل 3 عملاء",
    topClientsSubtitle: "ترتيب حسب حجم الفوترة المتراكمة بالفرنك الأفريقي",
    majorClients: "العملاء الرئيسيون",
    fiveCompanies: "3 شركات",
    inGoodStanding: "في وضع جيد",

    // Invoices Register
    invoicesRegistry: "سجل الفواتير",
    invoicesRegistrySubtitle: "عرض وتصفية وإدارة جميع فواتير عملائك",
    registeredInvoicesCount: "فاتورة مسجلة",
    allTab: "الكل",
    paidTab: "مدفوعة",
    sentTab: "مرسلة",
    overdueTab: "متأخرة",
    draftsTab: "مسودات",
    invoiceNumberCol: "رقم الفاتورة",
    clientRecipientCol: "العميل المستلم",
    emissionDueCol: "تاريخ الإصدار / الاستحقاق",
    paymentModeCol: "طريقة الدفع",
    amountTTCCol: "المبلغ شامل الضريبة",
    statusCol: "الحالة",
    actionsCol: "الإجراءات",
    searchInvoicesPlaceholder: "بحث عن عميل، رقم، مدينة، مبلغ...",
    clearFilterBtn: "مسح الفلتر",
    searchFilterNotice: "فاتورة/فواتير موجودة",
    viewDetailAction: "عرض التفاصيل",
    editInvoiceAction: "تعديل الفاتورة",
    deleteInvoiceAction: "حذف الفاتورة",
    noInvoicesFound: "لم يتم العثور على فواتير لهذا الفلتر.",

    // Statuses
    statusPaid: "مدفوعة",
    statusSent: "مرسلة",
    statusOverdue: "متأخرة",
    statusDraft: "مسودة",
    changeStatusAction: "تغيير الحالة",
    changeStatusTitle: "تغيير الحالة",

    // Create & Edit Invoice
    createInvoice: "إنشاء فاتورة",
    editInvoice: "تعديل الفاتورة",
    newEmissionBadge: "إصدار جديد",
    editEmissionBadge: "تعديل",
    invoiceSubtitleDesc: "أصدر فاتورتك المعتمدة. الحسابات المالية تلقائية.",
    cancel: "إلغاء",
    saveDraft: "حفظ كمسودة",
    emitInvoice: "إصدار الفاتورة",
    saveChanges: "حفظ التعديلات",
    editFormTab: "نموذج الإدخال",
    livePreviewTab: "معاينة الفاتورة",
    clientRecipient: "العميل المستلم",
    issueDate: "تاريخ الإصدار",
    dueDate: "تاريخ الاستحقاق",
    paymentMode: "طريقة الدفع",
    paymentDetailLabel: "تفاصيل الدفع (رقم الحساب، المشغل...)",
    invoiceObjectLabel: "موضوع الخدمة / الفاتورة",
    invoiceLinesTitle: "بنود الفاتورة",
    descriptionCol: "وصف الخدمة أو البضاعة",
    qtyCol: "الكمية",
    unitPriceHTCol: "سعر الوحدة (بدون ضريبة)",
    totalHTCol: "الإجمالي (بدون ضريبة)",
    addLineBtn: "إضافة بند",
    subtotalHT: "المجموع الفرعي بدون ضريبة",
    commercialDiscount: "خصم تجاري",
    netCommercial: "صافي تجاري",
    financialDiscount: "خصم مالي",
    netFinancier: "صافي مالي",
    advanceDeducted: "سلفة / دفعة مقدمة",
    taxableHT: "المبلغ الخاضع للضريبة",
    vatRate: "معدل الضريبة",
    totalTTC: "الإجمالي شامل الضريبة",
    precompteRate: "الاستقطاع الضريبي",
    precompteISB: "الاستقطاع الضريبي (ISB)",
    netToPay: "صافي المبلغ المستحق",
    mobileMoney: "Airtel Money, Moov Money, MyNita, Amanata",
    bankCard: "بطاقة بنكية (Visa, Mastercard, GIM-UEMOA)",
    creditCard: "بطاقة ائتمان",
    cashPayment: "نقداً",
    stoppedSum: "تم إعداد هذه الفاتورة بمبلغ:",
    certifiedStamp: "الختم والتوقيع",
    forDirection: "للإدارة العامة",
    officialStampTitle: "الختم الرسمي",
    uploadStampBtn: "استيراد الختم الرسمي",
    removeStampBtn: "إزالة الختم",
    consignationLabel: "وديعة (التعبئة والتغليف)",

    // Invoice Detail Page
    invoiceDetailsTitle: "تفاصيل الفاتورة",
    backToInvoices: "العودة للفواتير",
    previousInvoice: "الفاتورة السابقة",
    nextInvoice: "الفاتورة التالية",
    printInvoice: "طباعة",
    downloadPDF: "تنزيل PDF",
    sendWhatsApp: "إرسال عبر واتساب",
    deleteInvoice: "حذف الفاتورة",
    modify: "تعديل",
    previous: "السابق",
    next: "التالي",

    // Clients Page
    clientsDirectory: "دليل العملاء",
    clientsSubtitle: "إدارة حسابات العملاء والشركاء عبر غرب أفريقيا",
    newClient: "عميل جديد",
    totalClients: "إجمالي العملاء",
    totalPortfolio: "إجمالي المحفظة",
    cumulativeBilled: "إجمالي الفوترة",
    clientNameCol: "العميل",
    contactCol: "جهة الاتصال",
    phoneCol: "الهاتف",
    emailCol: "البريد الإلكتروني",
    cityCol: "المدينة",
    addressCol: "العنوان",
    totalBilledCol: "إجمالي الفواتير",
    searchClientPlaceholder: "بحث بالاسم، المدينة، جهة الاتصال...",
    editClient: "تعديل ملف العميل",
    deleteClient: "حذف العميل",
    createInvoiceForClient: "إنشاء فاتورة لهذا العميل",
    addClientTitle: "إضافة عميل جديد",
    editClientTitle: "تعديل العميل",
    saveClientBtn: "حفظ العميل",
    clientNifLabel: "رقم تعريف العميل الضريبي (اختياري)",
    whatsappLabel: "واتساب الفوترة",

    // Settings Page
    settingsTitle: "الإعدادات",
    settingsSubtitle: "إدارة الإعدادات العامة لمساحة العمل.",
    saveSettings: "حفظ",
    tabCompanyProfile: "ملف الشركة",
    tabRegionCalendar: "الإقليمي والعملة",
    tabInvoiceTemplates: "قوالب الفواتير",
    tabTeamAccess: "الفريق والوصول",
    companyIdentityTitle: "هوية الشركة",
    companyIdentityDesc: "المعلومات الرسمية لشركتك.",
    legalNameLabel: "الاسم القانوني",
    rcNineaLabel: "RC أو NINEA",
    headquartersAddressLabel: "عنوان المقر الرئيسي",
    contactDetailsTitle: "تفاصيل الاتصال",
    contactDetailsDesc: "مرئية على مستنداتك.",
    billingEmailLabel: "بريد الفوترة",
    businessPhoneLabel: "هاتف العمل",
    visualsTitle: "الشعار والختم الرسمي",
    visualsDesc: "قم بتحميل شعار شركتك وختمك الرسمي.",
    companyLogoLabel: "شعار الشركة",
    uploadLogoBtn: "تحميل الشعار",
    removeLogoBtn: "إزالة",
    officialStampLabel: "الختم الرسمي",
    uploadStampActionBtn: "تحميل الختم",
    removeStampActionBtn: "إزالة",
    regionalSettingsTitle: "الإقليمي والعملة",
    regionalSettingsDesc: "تكوين بلد التشغيل واللغة والمعايير الإقليمية.",
    countryLabel: "بلد التشغيل",
    cityLabel: "المدينة الرئيسية",
    languageLabel: "لغة الواجهة",
    mainCurrencyLabel: "العملة الرئيسية",
    timezoneLabel: "المنطقة الزمنية (تلقائي)",
    languageActiveNotice: "اللغة النشطة: العربية",
    switchLanguageBtn: "التبديل إلى الفرنسية",
    invoiceTemplatesTitle: "قوالب الفواتير",
    invoiceTemplatesDesc: "اختر أو استورد قالب فاتورتك المخصص.",
    teamAccessTitle: "الفريق والوصول",
    teamAccessDesc: "إدارة أعضاء الفريق المصرح لهم في مساحة الفوترة.",
    inviteMemberBtn: "دعوة عضو",
    importInvoiceTemplateBtn: "استيراد قالب فاتورتي",
    invoiceTemplateImportDesc: "استورد ملف PDF فاتورة موجود لاستخدامه كقالب تلقائي.",

    // Help & Support
    supportTitle: "مساعدة ودعم AMOMD FACTURE",
    supportSubtitle: "مساعدة سريعة من متخصصي الفوترة في الساحل",
    supportWhatsApp: "دعم واتساب المباشر",
    supportCall: "دعم هاتفي",
    supportHours: "7أيام/7 من 8 صباحاً إلى 8 مساءً (نيامي GMT+1)",
  },
};

export const translations: Record<Language, Translations> = {
  ...baseTranslations,
  es: {
    ...baseTranslations.fr,
    dashboard: "Panel de control",
    invoices: "Facturas",
    clients: "Clientes",
    products: "Productos",
    payments: "Pagos",
    settings: "Configuración",
    help: "Ayuda y Soporte",
    newInvoice: "Nueva Factura",
    newClient: "Nuevo cliente",
    clientsDirectory: "Directorio de Clientes",
    totalPortfolio: "Cartera Total",
    statusPaid: "Pagada",
    statusSent: "Enviada",
    statusOverdue: "Vencida",
    statusDraft: "Borrador",
    searchPlaceholder: "Buscar por importe, cliente, número...",
    currencyXOF: "Moneda XOF (FCFA)",
    saveSettings: "Guardar",
    languageActiveNotice: "Idioma activo: Español",
    dashboardTitle: "Panel de Control",
    dashboardSubtitle: "Gestión de facturación y cobros para empresas del Sahel",
    kpiTotalBilled: "TOTAL FACTURADO",
    kpiTotalPaid: "TOTAL COBRADO",
    kpiPending: "PENDIENTE",
    kpiOverdue: "VENCIDO",
    vsLastMonth: "vs mes anterior",
    recoveryRate: "Tasa de cobro",
    invoicesToFollowUp: "facturas a reclamar",
    notDue: "facturas no vencidas",
    invoicesCountSuffix: "facturas",
    revenueEvolution: "Evolución de Ingresos",
    realTime: "Tiempo real",
    month: "Mes",
    quarter: "Trimestre",
    year: "Año",
    collected: "Cobrado",
    billed: "Facturado",
    topClients: "Top 3 Clientes",
    topClientsSubtitle: "Clasificación por volumen de facturación en FCFA",
    majorClients: "Clientes Principales",
    fiveCompanies: "3 Empresas",
    inGoodStanding: "Al día",
    activeCompanyTitle: "Empresa activa",
  },
  pt: {
    ...baseTranslations.fr,
    dashboard: "Painel de controlo",
    invoices: "Faturas",
    clients: "Clientes",
    products: "Produtos",
    payments: "Pagamentos",
    settings: "Definições",
    help: "Ajuda e Suporte",
    newInvoice: "Nova Fatura",
    newClient: "Novo cliente",
    clientsDirectory: "Diretório de Clientes",
    totalPortfolio: "Carteira Total",
    statusPaid: "Paga",
    statusSent: "Enviada",
    statusOverdue: "Em atraso",
    statusDraft: "Rascunho",
    searchPlaceholder: "Pesquisar por montante, cliente, número...",
    currencyXOF: "Moeda XOF (FCFA)",
    saveSettings: "Guardar",
    languageActiveNotice: "Idioma ativo: Português",
    dashboardTitle: "Painel de Controlo",
    dashboardSubtitle: "Gestão de faturação e tesouraria no Sahel",
    kpiTotalBilled: "TOTAL FATURADO",
    kpiTotalPaid: "MONTANTE RECEBIDO",
    kpiPending: "PENDENTE",
    kpiOverdue: "EM ATRASO",
    vsLastMonth: "vs mês anterior",
    recoveryRate: "Taxa de recuperação",
    invoicesToFollowUp: "faturas a cobrar",
    notDue: "faturas não vencidas",
    invoicesCountSuffix: "faturas",
    revenueEvolution: "Evolução do Volume de Negócios",
    realTime: "Tempo real",
    month: "Mês",
    quarter: "Trimestre",
    year: "Ano",
    collected: "Recebido",
    billed: "Faturado",
    topClients: "Top 3 Clientes",
    topClientsSubtitle: "Classificação por volume de faturação em FCFA",
    majorClients: "Principais Clientes",
    fiveCompanies: "3 Empresas",
    inGoodStanding: "Regularizado",
    activeCompanyTitle: "Empresa ativa",
  },
  de: {
    ...baseTranslations.fr,
    dashboard: "Dashboard",
    invoices: "Rechnungen",
    clients: "Kunden",
    products: "Produkte",
    payments: "Zahlungen",
    settings: "Einstellungen",
    help: "Hilfe & Support",
    newInvoice: "Neue Rechnung",
    newClient: "Neuer Kunde",
    clientsDirectory: "Kundenverzeichnis",
    totalPortfolio: "Gesamtportfolio",
    statusPaid: "Bezahlt",
    statusSent: "Gesendet",
    statusOverdue: "Überfällig",
    statusDraft: "Entwurf",
    searchPlaceholder: "Nach Betrag, Kunde, Nummer suchen...",
    currencyXOF: "Währung XOF (FCFA)",
    saveSettings: "Speichern",
    languageActiveNotice: "Aktive Sprache: Deutsch",
    dashboardTitle: "Dashboard",
    dashboardSubtitle: "Rechnungs- und Zahlungsmanagement für Unternehmen",
    kpiTotalBilled: "GESAMT IN RECHNUNG",
    kpiTotalPaid: "EINGEGANGENER BETRAG",
    kpiPending: "AUSSTEHEND",
    kpiOverdue: "ÜBERFÄLLIG",
    vsLastMonth: "ggü. Vormonat",
    recoveryRate: "Einholungsquote",
    invoicesToFollowUp: "anzumahnende Rechnungen",
    notDue: "noch nicht fällig",
    invoicesCountSuffix: "Rechnungen",
    revenueEvolution: "Umsatzentwicklung",
    realTime: "Echtzeit",
    month: "Monat",
    quarter: "Quartal",
    year: "Jahr",
    collected: "Eingezogen",
    billed: "Fakturiert",
    topClients: "Top 3 Kunden",
    topClientsSubtitle: "Rangliste nach Abrechnungsvolumen in FCFA",
    majorClients: "Hauptkunden",
    fiveCompanies: "3 Unternehmen",
    inGoodStanding: "Beglichen",
    activeCompanyTitle: "Aktives Unternehmen",
  },
  ha: {
    ...baseTranslations.fr,
    dashboard: "Shafin Farko",
    invoices: "Takardun Kudi (Rasit)",
    clients: "Abokan Ciniki (Kastoma)",
    products: "Kayan Aiki",
    payments: "Biyan Kudi",
    settings: "Saituna",
    help: "Taimako da Bayani",
    newInvoice: "Sabuwar Takarda",
    newClient: "Sabuwar Kastoma",
    clientsDirectory: "Jerin Abokan Ciniki",
    totalPortfolio: "Jimillar Kastoma",
    statusPaid: "An biya",
    statusSent: "An aika",
    statusOverdue: "Ya wuce lokaci",
    statusDraft: "Shiri",
    searchPlaceholder: "Nemi ta kudi, kastoma, lamba...",
    currencyXOF: "Kudi FCFA (CFA)",
    saveSettings: "Ajiye",
    languageActiveNotice: "Yaren aiki: Harshen Hausa",
    dashboardTitle: "Shafin Farko na Kudi",
    dashboardSubtitle: "Duba kudaden shiga, rasit da abokan ciniki a Sahel",
    kpiTotalBilled: "JIMILLAR RASIT",
    kpiTotalPaid: "KUDIN DA AKA KARBA",
    kpiPending: "WADANDA AKE JIRA",
    kpiOverdue: "WADANDA SUKA WUCE LOKACI",
    vsLastMonth: "idan aka kwatanta da watan jiya",
    recoveryRate: "Kason karbar kudi",
    invoicesToFollowUp: "takardun da za a biya",
    notDue: "takardun da ba su cika ba",
    invoicesCountSuffix: "rasit",
    revenueEvolution: "Ci Gaban Hadahadar Kudi",
    realTime: "Kai tsaye",
    month: "Wata",
    quarter: "Watan Uku",
    year: "Shekara",
    collected: "An Karba",
    billed: "An Buga Rasit",
    topClients: "Top 3 na Abokan Ciniki",
    topClientsSubtitle: "Jerin abokan ciniki mafi girman hada-hada a FCFA",
    majorClients: "Manya Abokan Ciniki",
    fiveCompanies: "Kamfanoni 3",
    inGoodStanding: "Kudi ya cika",
    activeCompanyTitle: "Kamfani mai aiki",
    liveSahel: "Shaidar Sahel ta Gaskiya",
  },
  zh: {
    ...baseTranslations.en,
    dashboard: "仪表盘",
    invoices: "发票管理",
    clients: "客户名录",
    products: "产品与服务",
    payments: "付款追踪",
    settings: "系统设置",
    help: "帮助与支持",
    newInvoice: "开具新发票",
    newClient: "新建客户",
    clientsDirectory: "客户档案中心",
    totalPortfolio: "总客户群",
    statusPaid: "已支付",
    statusSent: "已发出",
    statusOverdue: "已逾期",
    statusDraft: "草稿",
    searchPlaceholder: "按金额、客户、发票号搜索...",
    currencyXOF: "法定货币 XOF (西非法郎)",
    saveSettings: "保存设置",
    languageActiveNotice: "当前界面语言：中文",
    dashboardTitle: "综合财务看板",
    dashboardSubtitle: "萨赫勒地区企业全流程账单与资金追踪",
    kpiTotalBilled: "已开票总额",
    kpiTotalPaid: "实收总金额",
    kpiPending: "待收款项",
    kpiOverdue: "已逾期账目",
    vsLastMonth: "较上月相比",
    recoveryRate: "资金回收率",
    invoicesToFollowUp: "待催款发票",
    notDue: "未到期发票",
    invoicesCountSuffix: "张发票",
    revenueEvolution: "营收走势动态",
    realTime: "实时更新",
    month: "本月",
    quarter: "本季度",
    year: "全年",
    collected: "已入账",
    billed: "已开票",
    topClients: "前三大核心客户",
    topClientsSubtitle: "西非法郎开票总额排行",
    majorClients: "主要合作伙伴",
    fiveCompanies: "3家企业",
    inGoodStanding: "信誉良好",
    activeCompanyTitle: "当前执业企业",
  },
};

const SUPPORTED_LANGUAGES: Language[] = ["fr", "en", "ar", "es", "pt", "de", "ha", "zh"];

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "fr",
  setLang: () => {},
  t: translations.fr,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("izifacture_lang") as Language;
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        setLangState(saved);
        document.documentElement.lang = saved;
        document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("izifacture_lang", newLang);
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    }
  };

  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] || translations.fr, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
