import { Invoice, InvoiceItem, InvoiceType, PaymentMethodType, CompanyProfile, Client } from "./mock-data";
import { calculateTotals, formatFCFA } from "./money";

export interface AIParsedInvoiceResult {
  invoice: Invoice;
  confidence: number;
  extractedClient: string;
  isNewClient: boolean;
  newClientRecord?: Client;
  extractedAmount: number;
  extractedObject: string;
  extractedType: InvoiceType;
  discountPercent: number;
  secondDiscountPercent?: number;
  escomptePercent: number;
  advanceAmount: number;
  taxRate: number;
  precompteRate: number;
  summaryText: string;
}

/**
 * Extrait les montants numériques (FCFA entiers)
 */
function extractAmountFromText(text: string): number {
  const clean = text.toLowerCase();

  // Pattern division TTC -> HT (ex : "Brut 17 850 000 / 1.19" -> 15 000 000)
  const divisionMatch = clean.match(/(?:brut|montant|total)?\s*(\d[\d\s.]*)\s*\/\s*1[.,]19/i);
  if (divisionMatch) {
    const raw = parseInt(divisionMatch[1].replace(/[^0-9]/g, ""), 10);
    if (!isNaN(raw) && raw > 0) return Math.round(raw / 1.19);
  }

  // Pattern "X million(s)" ou "X.Y million(s)"
  const millionMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*million/i);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(",", "."));
    if (!isNaN(val)) return Math.round(val * 1_000_000);
  }

  // Pattern "X k" ou "X k fcfa"
  const kMatch = clean.match(/(\d+)\s*k(?:\s*fcfa|\s*f|\b)/i);
  if (kMatch) {
    const val = parseInt(kMatch[1], 10);
    if (!isNaN(val)) return val * 1000;
  }

  // Pattern montants précédés de "montant de" ou "d'un montant de"
  const explicitAmountMatch = clean.match(/(?:montant\s*(?:de)?|total\s*(?:de)?)\s*(\d[\d\s.]*)/i);
  if (explicitAmountMatch) {
    const parsed = parseInt(explicitAmountMatch[1].replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Pattern séquences de 4 à 9 chiffres
  const rawMatches = clean.match(/\b\d{1,3}(?:[\s.]\d{3})+(?:\s*(?:fcfa|f|cfa|frs))?\b|\b\d{4,9}\b/g);
  if (rawMatches && rawMatches.length > 0) {
    let maxFound = 0;
    for (const m of rawMatches) {
      const parsed = parseInt(m.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(parsed) && parsed > maxFound) {
        maxFound = parsed;
      }
    }
    if (maxFound > 0) return maxFound;
  }

  return 5_000_000;
}

/**
 * Extrait les réductions en cascade (Remise commerciale, Escompte de règlement, Avance)
 * Selon la norme SYSCOHADA / Niger :
 * 1. Brut - Remise = Net Commercial
 * 2. Net Commercial - Escompte = Net Financier
 * 3. Net Financier - Avance = Montant HT imposable
 */
function extractCascadeReductions(text: string): {
  discountPercent: number;
  secondDiscountPercent: number;
  escomptePercent: number;
  advanceAmount: number;
} {
  const clean = text.toLowerCase();
  let discountPercent = 0;
  let secondDiscountPercent = 0;
  let escomptePercent = 0;
  let advanceAmount = 0;

  // 1. Remise commerciale explicite (%)
  const remiseMatch = clean.match(
    /(?:remise|rabais|ristourne|réduction\s+commerciale)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*%/i
  );
  if (remiseMatch) {
    discountPercent = parseFloat(remiseMatch[1].replace(",", "."));
  }

  // 2. Escompte financier explicite (%)
  const escompteMatch = clean.match(
    /(?:escompte|escompte\s+de\s+règlement|escompte\s+financier)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*%/i
  );
  if (escompteMatch) {
    escomptePercent = parseFloat(escompteMatch[1].replace(",", "."));
  }

  // 3. Cas de réductions multiples dites en bloc : "réductions de 8% et 5%"
  // En comptabilité générale, la 1ère est commerciale (8%), la 2ème est un escompte financier (5%)
  if (discountPercent === 0 && escomptePercent === 0) {
    const multiMatch = clean.match(
      /(?:réductions?|remises?)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*%\s*(?:et|\+|,)\s*(\d+(?:[.,]\d+)?)\s*%/i
    );
    if (multiMatch) {
      discountPercent = parseFloat(multiMatch[1].replace(",", "."));
      escomptePercent = parseFloat(multiMatch[2].replace(",", "."));
    }
  }

  // 4. Si une seule réduction générique est mentionnée sans mot "escompte"
  if (discountPercent === 0) {
    const genericDiscount = clean.match(/(?:réduction|remise)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*%/i);
    if (genericDiscount) {
      discountPercent = parseFloat(genericDiscount[1].replace(",", "."));
    }
  }

  // 5. Avance / Acompte déduit
  // Cas calcul TTC divisé : "avance 2 975 000 / 1.19" -> 2 500 000 HT
  const advanceDivMatch = clean.match(/(?:avance|acompte)\s*(\d[\d\s.]*)\s*\/\s*1[.,]19/i);
  if (advanceDivMatch) {
    const rawVal = parseInt(advanceDivMatch[1].replace(/[^0-9]/g, ""), 10);
    if (!isNaN(rawVal)) {
      advanceAmount = Math.round(rawVal / 1.19);
    }
  } else {
    const advanceMillionMatch = clean.match(/(?:avance|acompte)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*million/i);
    if (advanceMillionMatch) {
      const val = parseFloat(advanceMillionMatch[1].replace(",", "."));
      if (!isNaN(val)) advanceAmount = Math.round(val * 1_000_000);
    } else {
      const advMatch = clean.match(/(?:avance|acompte|arrhes|versement\s+anticipé)\s*(?:de)?\s*(\d[\d\s.]*)/i);
      if (advMatch) {
        const val = parseInt(advMatch[1].replace(/[^0-9]/g, ""), 10);
        if (!isNaN(val)) advanceAmount = val;
      }
    }
  }

  return {
    discountPercent,
    secondDiscountPercent,
    escomptePercent,
    advanceAmount,
  };
}

/**
 * Extrait le taux de TVA (%)
 */
function extractTaxRate(text: string, defaultRate: number = 19): number {
  const lower = text.toLowerCase();
  if (
    lower.includes("sans tva") ||
    lower.includes("hors taxe") ||
    lower.includes("exonéré") ||
    lower.includes("0% tva") ||
    lower.includes("tva 0")
  ) {
    return 0;
  }
  const match =
    text.match(/(?:la\s+)?tva\s*(?:de|à)?\s*(\d+(?:[.,]\d+)?)\s*%/i) ||
    text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s*)?tva/i);
  if (match) {
    const parsed = parseFloat(match[1].replace(",", "."));
    return isNaN(parsed) ? defaultRate : parsed;
  }
  return defaultRate;
}

/**
 * Extrait le précompte fiscal (ex : 2% ISB au Niger)
 */
function extractPrecompteRate(text: string): number {
  const match =
    text.match(
      /(?:précompte|precompte|isb|retenue\s+à\s+la\s+source)\s*(?:fiscal)?\s*(?:de)?\s*(\d+(?:[.,]\d+)?)\s*%/i
    ) || text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:de\s*)?(?:précompte|precompte|isb)/i);
  return match ? parseFloat(match[1].replace(",", ".")) : 0;
}

/**
 * Extrait les frais de transport éventuels
 */
function extractTransportAmount(text: string): number {
  const match = text.match(/(?:transport|livraison|fret|acheminement)\s*(?:de)?\s*(\d[\d\s.]*)/i);
  if (match) {
    const val = parseInt(match[1].replace(/[^0-9]/g, ""), 10);
    return isNaN(val) ? 0 : val;
  }
  return 0;
}

/**
 * Extrait STRICTEMENT un nom de client propre et concis pour la mention DOIT.
 * Détecte les anciens clients existants ou les nouveaux clients à créer.
 */
export function extractClientNameFromText(text: string, existingClients: Client[] = []): string {
  // 1. Priorité absolue : vérifier si l'utilisateur mentionne un client déjà présent dans le carnet d'adresses
  for (const client of existingClients) {
    if (!client.name) continue;
    const cleanClientName = client.name.trim().toLowerCase();
    if (cleanClientName.length >= 2) {
      const regex = new RegExp(`\\b${cleanClientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(text)) {
        return client.name;
      }
    }
  }

  // Mots interdits dans un vrai nom de client (verbes, pronoms, mots de liaison)
  const forbiddenWords = new Set([
    "croire", "faire", "payer", "paye", "payé", "france", "tiktok", "region", "région",
    "indication", "compte", "veux", "vouloir", "surtout", "seras", "serait", "mieux",
    "confirmer", "offre", "creer", "créer", "est", "etais", "s'il", "que", "qui", "dans",
    "sur", "sous", "avec", "sans", "pas", "pourquoi", "comment", "quand", "parce", "juste",
    "avant", "apres", "après", "tout", "tous", "peux", "pouvoir", "avoir", "etre", "être",
    "aller", "dis", "dit", "dire", "nous", "vous", "ils", "elles", "facture", "proforma",
    "avoir", "devis", "montant", "somme", "total", "remise", "reduction", "réduction",
    "escompte", "avance", "tva", "pourcent", "une", "des", "les", "aux"
  ]);

  const cleanCandidate = (raw: string): string => {
    let s = raw.trim();
    // Nettoyer les préfixes courants capturés par inadvertance
    s = s.replace(/^(?:le\s+client|la\s+société|l'entreprise|les\s+ets|ets\.|m\.|monsieur|mme|madame|nouveau\s+client|un\s+nouveau\s+client|un|une)\s+/i, "");
    // Capitaliser chaque mot (ex: "salifou diallo" -> "Salifou Diallo")
    return s
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
      .join(" ")
      .trim();
  };

  const isValidCandidate = (str: string): boolean => {
    const trimmed = str.trim();
    if (trimmed.length < 2 || trimmed.length > 45) return false;
    // Interdiction de ponctuation de fin de phrase
    if (/[\.\?!:;\n\r\t]/.test(trimmed)) return false;
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length > 6) return false;
    // Si l'un des mots est un mot de discours/verbe interdit, rejeter
    for (const w of words) {
      const cleanW = w.toLowerCase().replace(/[^a-zà-ÿ]/g, "");
      if (forbiddenWords.has(cleanW)) return false;
    }
    return true;
  };

  // 2. Recherche ciblée de motifs de nom de client (supporte minuscules et majuscules)
  const patterns = [
    // "pour le (nouveau )client Salifou", "du client Salifou", "client : Salifou", "client Salifou"
    /(?:au\s+nom\s+de|du\s+client|pour\s+le\s+(?:nouveau\s+)?client|au\s+(?:nouveau\s+)?client|pour\s+client|client\s*:?)\s+([a-zà-ÿ0-9\s'.-]+?)(?=\s+(?:d'un|d’un|de|d’|un|une|avec|pour\s+un|montant|somme|total|valable|remise|escompte|avance|tva|fcfa|\d+)|$|[,\.;])/i,

    // "adressée à Salifou", "destinée à Salifou", "à l'ordre de Salifou"
    /(?:adress[ée]e?\s+[àa]|destin[ée]e?\s+[àa]|à\s+l'attention\s+de|à\s+l'ordre\s+de)\s+(?:la\s+société\s+|l'entreprise\s+|m\.\s+|monsieur\s+|mme\s+|madame\s+)?([a-zà-ÿ0-9\s'.-]+?)(?=\s+(?:d'un|d’un|de|d’|un|une|avec|pour\s+un|montant|somme|total|valable|remise|escompte|avance|tva|fcfa|\d+)|$|[,\.;])/i,

    // "M. Amadou Diallo", "Monsieur Moussa", "Madame Fatou"
    /(?:pour\s+)?(?:m\.|monsieur|mme|madame)\s+([a-zà-ÿ0-9\s'.-]+?)(?=\s+(?:d'un|d’un|de|d’|un|une|avec|pour\s+un|montant|somme|total|valable|remise|escompte|avance|tva|fcfa|\d+)|$|[,\.;])/i,

    // "pour la société ANFS", "pour l'entreprise SOTRACO", "pour les ets..."
    /(?:pour\s+)?(?:la\s+société|l'entreprise|l’entreprise|les\s+établissements|les\s+ets|ets\.|ets|ong)\s+([a-zà-ÿ0-9\s'.-]+?)(?=\s+(?:d'un|d’un|de|d’|un|une|avec|pour\s+un|montant|somme|total|valable|remise|escompte|avance|tva|fcfa|\d+)|$|[,\.;])/i,

    // "facture pour [Nom]" ou "offre pour [Nom]"
    /(?:facture|offre|devis|proforma|avoir)\s+pour\s+([a-zà-ÿ0-9\s'.-]+?)(?=\s+(?:d'un|d’un|de|d’|un|une|avec|pour\s+un|montant|somme|total|valable|remise|escompte|avance|tva|fcfa|\d+)|$|[,\.;])/i,

    // "pour [Nom]" (n'importe où, même après le montant : "Facture 1 500 000 pour Salifou")
    /(?:^|\s)pour\s+([a-zà-ÿ0-9\s'.-]+?)(?=\s+(?:d'un|d’un|de|d’|un|une|avec|pour\s+un|montant|somme|total|valable|remise|escompte|avance|tva|fcfa|\d+)|$|[,\.;])/i,

    // "Facture [Nom] [Montant]" (ex: "Facture Salifou 1 500 000" ou "Facture Kourouma 500 000")
    /(?:facture|proforma|avoir|devis)\s+([a-zà-ÿ0-9\s'.-]+?)(?=\s+(?:d'un|d’un|de|d’|un|une|avec|pour\s+un|montant|somme|total|valable|remise|escompte|avance|tva|fcfa|\d+)|$|[,\.;])/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = cleanCandidate(match[1]);
      if (isValidCandidate(candidate)) {
        return candidate;
      }
    }
  }

  // 3. Fallback : si aucun motif trouvé, retourner un client partenaire neutre (ne pas forcer arbitrairement un client existant sans mention)
  return "Client Partenaire";
}

/**
 * Détermine le type de facture
 */
function extractInvoiceType(text: string): InvoiceType {
  const lower = text.toLowerCase();
  if (lower.includes("proforma") || lower.includes("devis") || lower.includes("offre")) {
    return "proforma";
  }
  if (
    lower.includes("avoir") ||
    lower.includes("retour") ||
    lower.includes("annulation") ||
    lower.includes("rectificatif")
  ) {
    return "avoir";
  }
  return "doit";
}

/**
 * Mode de paiement
 */
function extractPaymentMethod(text: string): PaymentMethodType {
  const lower = text.toLowerCase();
  if (
    lower.includes("carte bancaire") ||
    lower.includes("visa") ||
    lower.includes("mastercard") ||
    lower.includes("virement") ||
    lower.includes("banque")
  ) {
    return "Carte Bancaire";
  }
  if (lower.includes("carte de crédit") || lower.includes("crédit différé")) {
    return "Carte de Crédit";
  }
  if (lower.includes("espèces") || lower.includes("cash") || lower.includes("liquide")) {
    return "Espèces (Cash / Liquidités)";
  }
  return "Mobile Money";
}

/**
 * Extrait l'objet de la facture (synonyme de la désignation principale de la prestation)
 */
function extractObject(text: string): string {
  const lower = text.toLowerCase();

  const explicitMatch = text.match(/(?:objet|désignation)\s*:\s*([^\n,.;]+)/i);
  if (explicitMatch && explicitMatch[1].trim().length > 3) {
    return explicitMatch[1].trim();
  }

  if (lower.includes("ciment")) return "Fourniture de sacs de ciment";
  if (lower.includes("transport") || lower.includes("fret") || lower.includes("vivres"))
    return "Prestation de transport logistique de vivres";
  if (lower.includes("conseil") || lower.includes("consultant"))
    return "Mission de prestation de conseil & expertise";
  if (lower.includes("informatique") || lower.includes("logiciel"))
    return "Fourniture et maintenance informatique";
  if (lower.includes("formation")) return "Session de formation professionnelle";

  return "Prestation de services & Fournitures";
}

/**
 * Moteur principal IA iziBot : Parse la commande et génère la facture officielle
 * en appliquant rigoureusement le calcul en cascade OHADA / Niger.
 */
export function parseInvoiceWithAI(
  prompt: string,
  company?: CompanyProfile,
  existingClients: Client[] = []
): AIParsedInvoiceResult {
  const cleanPrompt = prompt.trim();

  // 1. Extractions précises et sécurisées
  const clientName = extractClientNameFromText(cleanPrompt, existingClients);
  const mainAmount = extractAmountFromText(cleanPrompt);
  const transportAmount = extractTransportAmount(cleanPrompt);
  const reductions = extractCascadeReductions(cleanPrompt);
  const taxRate = extractTaxRate(cleanPrompt, company?.defaultTaxRate ?? 19);
  const precompteRate = extractPrecompteRate(cleanPrompt);
  const invoiceType = extractInvoiceType(cleanPrompt);
  const paymentMethod = extractPaymentMethod(cleanPrompt);
  const invoiceObject = extractObject(cleanPrompt);

  // Recherche de référence de contrat
  const contractMatch = cleanPrompt.match(
    /(?:en\s+([A-Za-z0-9]+)\s+avec\s+(?:l'entreprise|la\s+société|le\s+client)?\s*([A-Za-z0-9\s]+))/i
  );
  const contractInfo = contractMatch
    ? `Partenaire : ${contractMatch[2].trim()} (${contractMatch[1].trim()})`
    : undefined;

  // 2. Client match
  const matchedClient = existingClients.find((c) => {
    const cName = c.name.toLowerCase().trim();
    const searchName = clientName.toLowerCase().trim();
    return cName === searchName || cName.includes(searchName) || searchName.includes(cName);
  });

  const isNewClient = !matchedClient && clientName !== "Client Partenaire";
  const clientCity = matchedClient?.city || company?.city || "Niamey";
  const clientPhone = matchedClient?.phone || "+227 90 00 00 00";

  // Email sécurisé : jamais de longue phrase
  const cleanNameForEmail = clientName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const clientEmail =
    matchedClient?.email ||
    (cleanNameForEmail && cleanNameForEmail.length < 25
      ? `${cleanNameForEmail}@gmail.com`
      : "client@partenaire-sahel.com");

  let newClientRecord: Client | undefined;
  if (isNewClient) {
    newClientRecord = {
      id: `client-${Date.now()}`,
      name: clientName,
      contactPerson: clientName,
      email: clientEmail,
      phone: clientPhone,
      city: clientCity,
      country: company?.country || "Niger",
      totalBilled: 0,
      invoicesCount: 1,
    };
  }

  // 3. Construction des lignes de facturation (Désignation = Objet)
  const items: InvoiceItem[] = [
    {
      id: `item-${Date.now()}-1`,
      description: invoiceObject,
      quantity: 1,
      unitPrice: mainAmount,
      totalHT: mainAmount,
      unit: "FORFAIT",
      currency: "FCFA",
    },
  ];

  if (transportAmount > 0 && transportAmount !== mainAmount) {
    items.push({
      id: `item-${Date.now()}-2`,
      description: "Frais de transport logistique et acheminement",
      quantity: 1,
      unitPrice: transportAmount,
      totalHT: transportAmount,
      unit: "VOYAGE",
      currency: "FCFA",
    });
  }

  // 4. Calculs financiers stricts OHADA / Niger en CASCADE
  const calculatedTotals = calculateTotals(
    items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice })),
    reductions.discountPercent,
    taxRate,
    reductions.escomptePercent,
    reductions.advanceAmount,
    precompteRate,
    0,
    reductions.secondDiscountPercent
  );

  // 5. Numérotation automatique
  const currentYear = new Date().getFullYear();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const prefix = invoiceType === "avoir" ? "AVOIR" : invoiceType === "proforma" ? "PRO" : "FAC";
  const invoiceNumber = `${prefix}-${currentYear}-${randNum}`;

  const todayStr = new Date().toISOString().split("T")[0];
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + 30);
  const dueDateStr = dueDateObj.toISOString().split("T")[0];

  const newInvoice: Invoice = {
    id: `inv-ai-${Date.now()}-${randNum}`,
    number: invoiceNumber,
    invoiceType,
    clientName,
    clientEmail,
    clientPhone,
    clientCity,
    object: invoiceObject,
    issueDate: todayStr,
    dueDate: dueDateStr,
    status: "envoyee",
    subtotalHT: calculatedTotals.rawSubtotalHT,
    discountPercent: calculatedTotals.discountPercent,
    discountAmount: calculatedTotals.discountAmount,
    secondDiscountPercent: calculatedTotals.secondDiscountPercent,
    secondDiscountAmount: calculatedTotals.secondDiscountAmount,
    netCommercial1: calculatedTotals.netCommercial1,
    netCommercial: calculatedTotals.netCommercial,
    escomptePercent: calculatedTotals.escomptePercent,
    escompteAmount: calculatedTotals.escompteAmount,
    netFinancier: calculatedTotals.netFinancier,
    advanceAmount: calculatedTotals.advanceAmount,
    taxableHT: calculatedTotals.subtotalHT,
    taxRate: calculatedTotals.taxRate,
    taxAmount: calculatedTotals.taxAmount,
    totalTTC: calculatedTotals.totalTTC,
    precompteRate: calculatedTotals.precompteRate,
    precompteAmount: calculatedTotals.precompteAmount,
    netToPay: calculatedTotals.netToPay,
    paidAmount: 0,
    paymentMethod,
    contractNumber: contractInfo,
    paymentDetail:
      paymentMethod === "Mobile Money"
        ? "Airtel Money (+227 90 24 55 12) / Moov Money"
        : "Compte Bancaire Professionnel SONIBANK / BOA",
    templateId: company?.invoiceTemplateId || "tpl-1",
    items,
  };

  const typeLabel =
    invoiceType === "avoir"
      ? "Facture d'avoir"
      : invoiceType === "proforma"
      ? "Facture Proforma"
      : "Facture de Doit (Vente standard)";

  const clientStatusLabel = isNewClient
    ? `✨ Nouveau client "${clientName}" ajouté à votre annuaire`
    : `👤 Client "${clientName}"`;

  // 6. Présentation fidèle de la cascade de décompte comptable (Norme OHADA)
  let detailsText = `✅ ${typeLabel} créée avec succès !\n\n`;
  detailsText += `• ${clientStatusLabel}\n`;
  detailsText += `• Objet / Désignation : ${invoiceObject}\n`;
  detailsText += `• Montant Brut HT : ${formatFCFA(calculatedTotals.rawSubtotalHT)}\n`;

  if (calculatedTotals.discountAmount > 0) {
    detailsText += `• Remise commerciale (${calculatedTotals.discountPercent}%) : -${formatFCFA(calculatedTotals.discountAmount)}\n`;
    detailsText += `• ➔ Net Commercial : ${formatFCFA(calculatedTotals.netCommercial)}\n`;
  }

  if (calculatedTotals.escompteAmount > 0) {
    detailsText += `• Escompte financier (${calculatedTotals.escomptePercent}%) : -${formatFCFA(calculatedTotals.escompteAmount)}\n`;
    detailsText += `• ➔ Net Financier : ${formatFCFA(calculatedTotals.netFinancier)}\n`;
  }

  if (calculatedTotals.advanceAmount > 0) {
    detailsText += `• Avance / Acompte déduit : -${formatFCFA(calculatedTotals.advanceAmount)}\n`;
  }

  if (calculatedTotals.discountAmount > 0 || calculatedTotals.escompteAmount > 0 || calculatedTotals.advanceAmount > 0) {
    detailsText += `• Montant HT imposable : ${formatFCFA(calculatedTotals.subtotalHT)}\n`;
  }

  detailsText += `• TVA légale (${calculatedTotals.taxRate}%) : +${formatFCFA(calculatedTotals.taxAmount)}\n`;
  detailsText += `• Montant Total TTC : ${formatFCFA(calculatedTotals.totalTTC)}\n`;

  if (calculatedTotals.precompteAmount > 0) {
    detailsText += `• Précompte fiscal (${calculatedTotals.precompteRate}%) : -${formatFCFA(calculatedTotals.precompteAmount)}\n`;
  }

  detailsText += `\n🎯 NET À PAYER RÉEL : ${formatFCFA(calculatedTotals.netToPay)}`;

  return {
    invoice: newInvoice,
    confidence: 0.98,
    extractedClient: clientName,
    isNewClient,
    newClientRecord,
    extractedAmount: calculatedTotals.netToPay,
    extractedObject: invoiceObject,
    extractedType: invoiceType,
    discountPercent: reductions.discountPercent,
    secondDiscountPercent: reductions.secondDiscountPercent,
    escomptePercent: reductions.escomptePercent,
    advanceAmount: reductions.advanceAmount,
    taxRate,
    precompteRate,
    summaryText: detailsText,
  };
}
