import type { Invoice } from "./mock-data";

/**
 * Utilitaires financiers pour iziFACTURE
 * - Règle stricte : montants entiers (pas de flottants pour éviter les erreurs d'arrondi)
 * - Devise par défaut : FCFA (XOF/XAF)
 * - Taux de TVA standard UEMOA / Niger : 18%
 */

export function formatFCFA(amount: number | bigint): string {
  const numericAmount = typeof amount === "bigint" ? Number(amount) : Math.round(amount);
  return `${numericAmount.toLocaleString("fr-FR")} FCFA`;
}

export function formatShortFCFA(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(".", ",")} M FCFA`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} k FCFA`;
  }
  return `${amount} FCFA`;
}

export interface TaxCalculation {
  rawSubtotalHT: number; // Montant brut des lignes HT
  discountPercent: number; // 1ère Remise commerciale %
  discountAmount: number; // Montant 1ère Remise FCFA
  secondDiscountPercent?: number; // 2ème Remise en cascade %
  secondDiscountAmount?: number; // Montant 2ème Remise FCFA (sur 1er Net Commercial)
  netCommercial1?: number; // 1er Net commercial intermédiaire
  netCommercial: number; // Net commercial final = Brut - Remise(s)
  escomptePercent: number; // Escompte de règlement %
  escompteAmount: number; // Escompte FCFA (sur Net Commercial)
  netFinancier: number; // Net Financier = Net Commercial - Escompte
  advanceAmount: number; // Acompte / Avance déduite en FCFA
  subtotalHT: number; // Montant HT imposable = Net Financier - Avance
  taxRate: number; // Taux de TVA (ex: 18% ou 19%)
  taxAmount: number; // Montant TVA
  totalTTC: number; // Montant TTC = HT + TVA
  precompteRate: number; // Précompte fiscal % (ex: 2%) sur TTC
  precompteAmount: number; // Montant précompte
  isbRate: number; // Alias pour compatibilité
  isbAmount: number; // Alias pour compatibilité
  consignationAmount: number;
  netToPay: number; // Net à payer = TTC - Précompte
}

export function calculateTotals(
  items: Array<{ quantity: number; unitPrice: number; taxRate?: number }>,
  globalDiscountPercent: number = 0,
  defaultTaxRate: number = 19,
  escomptePercent: number = 0,
  advanceAmount: number = 0,
  precompteRate: number = 0,
  consignationAmount: number = 0,
  secondDiscountPercent: number = 0
): TaxCalculation {
  let rawSubtotalHT = 0;
  for (const item of items) {
    const lineHT = Math.round((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
    rawSubtotalHT += lineHT;
  }

  // 1. Réductions commerciales en cascade (Norme comptable SYSCOHADA / Niger)
  // En comptabilité générale, les réductions commerciales s'appliquent successivement par cascade et ne s'additionnent jamais !
  const safeDiscount1 = Math.max(0, Number(globalDiscountPercent) || 0);
  const safeDiscount2 = Math.max(0, Number(secondDiscountPercent) || 0);

  const discount1Amount = safeDiscount1 > 0 ? Math.round((rawSubtotalHT * safeDiscount1) / 100) : 0;
  const netCommercial1 = Math.max(0, rawSubtotalHT - discount1Amount);

  let discount2Amount = 0;
  let netCommercial = netCommercial1;
  if (safeDiscount2 > 0) {
    // La 2ème réduction s'applique sur le premier net commercial, JAMAIS sur le brut !
    discount2Amount = Math.round((netCommercial1 * safeDiscount2) / 100);
    netCommercial = Math.max(0, netCommercial1 - discount2Amount);
  }

  const totalDiscountAmount = discount1Amount + discount2Amount;

  // 2. Réduction financière : Escompte de règlement (calculé sur le Net Commercial !)
  const safeEscomptePercent = Math.max(0, Number(escomptePercent) || 0);
  const escompteAmount = safeEscomptePercent > 0 ? Math.round((netCommercial * safeEscomptePercent) / 100) : 0;
  const netFinancier = Math.max(0, netCommercial - escompteAmount);

  // 3. Avance / Acompte déduit
  const safeAdvance = Math.max(0, Math.round(Number(advanceAmount) || 0));
  const subtotalHT = Math.max(0, netFinancier - safeAdvance);

  // 4. TVA sur Montant HT imposable
  const safeTaxRate = Number(defaultTaxRate) || 0;
  const taxAmount = safeTaxRate > 0 ? Math.round((subtotalHT * safeTaxRate) / 100) : 0;
  const totalTTC = subtotalHT + taxAmount;

  // 5. Précompte fiscal (ex : 2% ISB sur Total TTC selon la norme de décompte OHADA)
  const safePrecompteRate = Math.max(0, Number(precompteRate) || 0);
  const precompteAmount = safePrecompteRate > 0 ? Math.round((totalTTC * safePrecompteRate) / 100) : 0;

  // 6. Net à payer réel
  const safeConsignation = Math.round(Number(consignationAmount) || 0);
  const netToPay = Math.max(0, totalTTC - precompteAmount + safeConsignation);

  return {
    rawSubtotalHT,
    discountPercent: safeDiscount1,
    discountAmount: totalDiscountAmount,
    secondDiscountPercent: safeDiscount2 > 0 ? safeDiscount2 : undefined,
    secondDiscountAmount: discount2Amount > 0 ? discount2Amount : undefined,
    netCommercial1: safeDiscount2 > 0 ? netCommercial1 : undefined,
    netCommercial,
    escomptePercent: safeEscomptePercent,
    escompteAmount,
    netFinancier,
    advanceAmount: safeAdvance,
    subtotalHT,
    taxRate: safeTaxRate,
    taxAmount,
    totalTTC,
    precompteRate: safePrecompteRate,
    precompteAmount,
    isbRate: safePrecompteRate,
    isbAmount: precompteAmount,
    consignationAmount: safeConsignation,
    netToPay,
  };
}

/**
 * Formatage de date au format jour/mois/année (ex: 12/10/2026)
 */
export function formatDateFR(dateInput: string | Date): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Convertit un montant en FCFA en toutes lettres (Norme comptable OHADA / Niger)
 * Ex: 161721 -> "cent soixante et un mille sept cent vingt et un"
 */
export function numberToFrenchWords(num: number): string {
  const n = Math.round(Math.abs(num));
  if (n === 0) return "zéro";

  const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const teens = [
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];
  const tens = [
    "",
    "dix",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingt",
    "quatre-vingt-dix",
  ];

  function convertBelow100(val: number): string {
    if (val < 10) return units[val];
    if (val >= 10 && val < 20) return teens[val - 10];
    const tenDigit = Math.floor(val / 10);
    const unitDigit = val % 10;

    if (tenDigit === 7) {
      if (unitDigit === 1) return "soixante et onze";
      return `soixante-${teens[unitDigit]}`;
    }
    if (tenDigit === 8) {
      if (unitDigit === 0) return "quatre-vingts";
      return `quatre-vingt-${units[unitDigit]}`;
    }
    if (tenDigit === 9) {
      return `quatre-vingt-${teens[unitDigit]}`;
    }

    if (unitDigit === 0) return tens[tenDigit];
    if (unitDigit === 1) return `${tens[tenDigit]} et un`;
    return `${tens[tenDigit]}-${units[unitDigit]}`;
  }

  function convertBelow1000(val: number): string {
    if (val < 100) return convertBelow100(val);
    const hundredDigit = Math.floor(val / 100);
    const rem = val % 100;
    let res = "";

    if (hundredDigit === 1) {
      res = "cent";
    } else {
      res = `${units[hundredDigit]} cent${rem === 0 ? "s" : ""}`;
    }

    if (rem > 0) {
      res += ` ${convertBelow100(rem)}`;
    }
    return res;
  }

  if (n < 1000) return convertBelow1000(n);

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1000;

  let parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) parts.push("un milliard");
    else parts.push(`${convertBelow1000(billions)} milliards`);
  }

  if (millions > 0) {
    if (millions === 1) parts.push("un million");
    else parts.push(`${convertBelow1000(millions)} millions`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push("mille");
    else parts.push(`${convertBelow1000(thousands)} mille`);
  }

  if (remainder > 0) {
    parts.push(convertBelow1000(remainder));
  }

  return parts.join(" ");
}

/**
 * Convertit un montant en toutes lettres en anglais
 * Ex: 161721 -> "one hundred sixty-one thousand seven hundred twenty-one"
 */
export function numberToEnglishWords(num: number): string {
  const n = Math.round(Math.abs(num));
  if (n === 0) return "zero";

  const units = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "ten",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  function convertBelow100(val: number): string {
    if (val < 10) return units[val];
    if (val >= 10 && val < 20) return teens[val - 10];
    const tenDigit = Math.floor(val / 10);
    const unitDigit = val % 10;
    return `${tens[tenDigit]}${unitDigit > 0 ? `-${units[unitDigit]}` : ""}`;
  }

  function convertBelow1000(val: number): string {
    if (val < 100) return convertBelow100(val);
    const hundredDigit = Math.floor(val / 100);
    const rem = val % 100;
    let res = `${units[hundredDigit]} hundred`;
    if (rem > 0) res += ` ${convertBelow100(rem)}`;
    return res;
  }

  if (n < 1000) return convertBelow1000(n);

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1000;

  let parts: string[] = [];

  if (billions > 0) {
    parts.push(`${convertBelow1000(billions)} billion`);
  }
  if (millions > 0) {
    parts.push(`${convertBelow1000(millions)} million`);
  }
  if (thousands > 0) {
    parts.push(`${convertBelow1000(thousands)} thousand`);
  }
  if (remainder > 0) {
    parts.push(convertBelow1000(remainder));
  }

  return parts.join(" ");
}

/**
 * Formatage de date multilingue
 */
export function formatLocalizedDate(dateInput: string | Date, lang: "fr" | "en" = "fr"): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  if (lang === "en") {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Structure de résultat pour le rapprochement de factures par montant cumulé
 */
export interface InvoiceAmountCombination {
  invoices: Invoice[];
  total: number;
  label?: string;
  isApproximate?: boolean;
  difference?: number;
}

/**
 * Extrait un montant numérique propre d'une requête de recherche (ex: "1 500 000", "1500000", "1.5M", "1,5 million", "700k", "856205")
 */
export function parseSearchAmount(query: string): number | null {
  if (!query) return null;
  const clean = query.toLowerCase().trim();

  // Pattern "X million(s)" ou "X.Y million(s)" ou "X,Y M"
  const millionMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:m|million|millions)/i);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(",", "."));
    if (!isNaN(val) && val > 0) return Math.round(val * 1_000_000);
  }

  // Pattern "X k" ou "X k fcfa"
  const kMatch = clean.match(/(\d+)\s*k(?:\s*fcfa|\s*f|\b)/i);
  if (kMatch) {
    const val = parseInt(kMatch[1], 10);
    if (!isNaN(val) && val > 0) return val * 1000;
  }

  // Chiffres uniquement (au moins 3 chiffres pour éviter les faux positifs)
  const digitsOnly = clean.replace(/[^0-9]/g, "");
  if (digitsOnly.length >= 3) {
    const parsed = parseInt(digitsOnly, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
}

/**
 * Trouve des combinaisons de 2, 3 ou 4 factures dont la somme égale le montant recherché (avec tolérance fiscale/arrondi de 2 FCFA).
 */
export function findInvoiceCombinations(
  invoices: Invoice[],
  targetAmount: number,
  maxResults: number = 6
): InvoiceAmountCombination[] {
  if (!targetAmount || targetAmount <= 0 || !invoices || invoices.length === 0) return [];

  const results: InvoiceAmountCombination[] = [];
  const seenCombos = new Set<string>();

  const addCombination = (
    comboInvoices: Invoice[],
    total: number,
    label?: string,
    isApproximate = false,
    difference = 0
  ) => {
    const key = comboInvoices
      .map((i) => i.id)
      .sort()
      .join("|");
    if (seenCombos.has(key)) return;
    seenCombos.add(key);
    results.push({
      invoices: comboInvoices,
      total,
      label,
      isApproximate,
      difference,
    });
  };

  const getInvoiceAmounts = (inv: Invoice): number[] => {
    const list: number[] = [];
    const pushIfValid = (val?: number | null) => {
      if (val !== undefined && val !== null && !isNaN(val)) {
        const rounded = Math.round(Number(val));
        if (rounded > 0 && !list.includes(rounded)) {
          list.push(rounded);
        }
      }
    };
    pushIfValid(inv.paidAmount);
    pushIfValid(inv.netToPay);
    pushIfValid(inv.totalTTC);
    pushIfValid(inv.taxableHT);
    pushIfValid(inv.subtotalHT);
    return list;
  };

  const getPrimaryAmount = (inv: Invoice): number => {
    if (inv.status === "payee" && inv.paidAmount && inv.paidAmount > 0) {
      return Math.round(inv.paidAmount);
    }
    return Math.round(Number(inv.netToPay || inv.paidAmount || inv.totalTTC || 0));
  };

  const paidInvoices = invoices.filter((i) => i.status === "payee");
  if (paidInvoices.length >= 2) {
    const sumPaid = paidInvoices.reduce((acc, inv) => acc + getPrimaryAmount(inv), 0);
    if (Math.abs(sumPaid - targetAmount) <= 2) {
      addCombination(paidInvoices, targetAmount, "Total Encaissé (Factures Payées)");
    }
  }

  const pendingInvoices = invoices.filter((i) => i.status === "envoyee");
  if (pendingInvoices.length >= 2) {
    const sumPending = pendingInvoices.reduce((acc, inv) => acc + getPrimaryAmount(inv), 0);
    if (Math.abs(sumPending - targetAmount) <= 2) {
      addCombination(pendingInvoices, targetAmount, "Factures en Attente");
    }
  }

  const n = invoices.length;

  for (let i = 0; i < n; i++) {
    const invA = invoices[i];
    const amountsA = getInvoiceAmounts(invA);

    for (let j = i + 1; j < n; j++) {
      const invB = invoices[j];
      const amountsB = getInvoiceAmounts(invB);

      let found = false;
      for (const a of amountsA) {
        for (const b of amountsB) {
          const sum = a + b;
          if (Math.abs(sum - targetAmount) <= 2) {
            addCombination([invA, invB], targetAmount);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (results.length >= maxResults) return results;
    }
  }

  for (let i = 0; i < n; i++) {
    const invA = invoices[i];
    const a = getPrimaryAmount(invA);
    if (a <= 0 || a >= targetAmount) continue;

    for (let j = i + 1; j < n; j++) {
      const invB = invoices[j];
      const b = getPrimaryAmount(invB);
      if (b <= 0 || a + b >= targetAmount) continue;

      for (let k = j + 1; k < n; k++) {
        const invC = invoices[k];
        const c = getPrimaryAmount(invC);
        if (c <= 0) continue;

        const sum3 = a + b + c;
        if (Math.abs(sum3 - targetAmount) <= 2) {
          addCombination([invA, invB, invC], targetAmount);
          if (results.length >= maxResults) return results;
        }
      }
    }
  }

  if (n <= 25) {
    for (let i = 0; i < n; i++) {
      const a = getPrimaryAmount(invoices[i]);
      if (a <= 0 || a >= targetAmount) continue;
      for (let j = i + 1; j < n; j++) {
        const b = getPrimaryAmount(invoices[j]);
        if (b <= 0 || a + b >= targetAmount) continue;
        for (let k = j + 1; k < n; k++) {
          const c = getPrimaryAmount(invoices[k]);
          if (c <= 0 || a + b + c >= targetAmount) continue;
          for (let l = k + 1; l < n; l++) {
            const d = getPrimaryAmount(invoices[l]);
            if (d <= 0) continue;
            if (Math.abs(a + b + c + d - targetAmount) <= 2) {
              addCombination([invoices[i], invoices[j], invoices[k], invoices[l]], targetAmount);
              if (results.length >= maxResults) return results;
            }
          }
        }
      }
    }
  }

  if (results.length === 0) {
    let closestCombo: Invoice[] | null = null;
    let closestDiff = Infinity;
    let closestSum = 0;

    for (let i = 0; i < n; i++) {
      const a = getPrimaryAmount(invoices[i]);
      if (a <= 0) continue;
      for (let j = i + 1; j < n; j++) {
        const b = getPrimaryAmount(invoices[j]);
        if (b <= 0) continue;
        const sum = a + b;
        const diff = Math.abs(sum - targetAmount);
        const maxAcceptableDiff = Math.max(10000, targetAmount * 0.05);
        if (diff <= maxAcceptableDiff && diff < closestDiff) {
          closestDiff = diff;
          closestSum = sum;
          closestCombo = [invoices[i], invoices[j]];
        }
      }
    }

    if (n >= 3) {
      for (let i = 0; i < n; i++) {
        const a = getPrimaryAmount(invoices[i]);
        if (a <= 0) continue;
        for (let j = i + 1; j < n; j++) {
          const b = getPrimaryAmount(invoices[j]);
          if (b <= 0) continue;
          for (let k = j + 1; k < n; k++) {
            const c = getPrimaryAmount(invoices[k]);
            if (c <= 0) continue;
            const sum = a + b + c;
            const diff = Math.abs(sum - targetAmount);
            const maxAcceptableDiff = Math.max(10000, targetAmount * 0.05);
            if (diff <= maxAcceptableDiff && diff < closestDiff) {
              closestDiff = diff;
              closestSum = sum;
              closestCombo = [invoices[i], invoices[j], invoices[k]];
            }
          }
        }
      }
    }

    if (closestCombo && closestCombo.length > 0) {
      addCombination(
        closestCombo,
        closestSum,
        `Regroupement le plus proche (~${formatFCFA(closestSum)})`,
        true,
        closestDiff
      );
    }
  }

  return results;
}


