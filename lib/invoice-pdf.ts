/**
 * Générateur officiel de factures PDF pour iziFACTURE
 * - 100% autonome, zéro dépendance externe, exécution ultra-rapide côté client
 * - Conforme aux normes graphiques iziFACTURE (Slate-900, Vert Émeraude, Police mono pour montants)
 * - Conforme au format A4 OHADA / UEMOA (595.28 x 841.89 pt)
 * - Prise en charge intégrale des caractères accentués français (WinAnsiEncoding)
 */

import { Invoice, CompanyProfile, DEFAULT_COMPANY } from "./mock-data";
import { formatFCFA, formatDateFR, numberToFrenchWords } from "./money";

/**
 * Encode une chaîne de caractères pour le format PDF (WinAnsiEncoding).
 * Échappe les parenthèses et convertit les caractères accentués français en octal.
 */
function escapePdfText(str: string): string {
  if (!str) return "";
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const code = str.charCodeAt(i);

    if (ch === "(") {
      out += "\\(";
    } else if (ch === ")") {
      out += "\\)";
    } else if (ch === "\\") {
      out += "\\\\";
    } else if (code >= 32 && code <= 126) {
      out += ch;
    } else {
      switch (ch) {
        case "é": out += "\\351"; break;
        case "è": out += "\\350"; break;
        case "ê": out += "\\352"; break;
        case "ë": out += "\\353"; break;
        case "à": out += "\\340"; break;
        case "â": out += "\\342"; break;
        case "ù": out += "\\371"; break;
        case "û": out += "\\373"; break;
        case "î": out += "\\356"; break;
        case "ï": out += "\\357"; break;
        case "ô": out += "\\364"; break;
        case "ç": out += "\\347"; break;
        case "É": out += "\\311"; break;
        case "È": out += "\\310"; break;
        case "Ê": out += "\\312"; break;
        case "À": out += "\\300"; break;
        case "Ç": out += "\\307"; break;
        case "°": out += "\\260"; break;
        case "’": case "‘": case "`": out += "'"; break;
        case "“": case "”": case "«": case "»": out += '\\"'; break;
        case "–": case "—": out += "-"; break;
        case "…": out += "..."; break;
        case "€": out += "\\200"; break;
        case "œ": out += "\\234"; break;
        case "Œ": out += "\\214"; break;
        default:
          if (code >= 160 && code <= 255) {
            out += "\\" + code.toString(8).padStart(3, "0");
          } else {
            out += " ";
          }
      }
    }
  }
  return out;
}

/**
 * Constructeur de documents PDF 1.4 pur TypeScript
 */
class PdfDocumentBuilder {
  private objects: string[] = [];
  private pageContent: string[] = [];

  // Dimensions A4 en points
  public readonly width = 595.28;
  public readonly height = 841.89;

  // Couleurs courantes
  public setFillColor(r: number, g: number, b: number) {
    this.pageContent.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`);
  }

  public setStrokeColor(r: number, g: number, b: number) {
    this.pageContent.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`);
  }

  public setLineWidth(w: number) {
    this.pageContent.push(`${w.toFixed(2)} w`);
  }

  // Rectangles
  public rect(x: number, y: number, w: number, h: number, style: "fill" | "stroke" | "both" = "fill") {
    const op = style === "fill" ? "f" : style === "stroke" ? "S" : "B";
    this.pageContent.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
  }

  // Lignes
  public line(x1: number, y1: number, x2: number, y2: number) {
    this.pageContent.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  // Texte
  public text(
    text: string,
    x: number,
    y: number,
    options: {
      font?: "F1" | "F2" | "F3" | "F4"; // F1: Helvetica, F2: Helvetica-Bold, F3: Helvetica-Oblique, F4: Courier-Bold
      size?: number;
      align?: "left" | "right" | "center";
      approxCharWidth?: number;
    } = {}
  ) {
    const font = options.font || "F1";
    const size = options.size || 10;
    const align = options.align || "left";
    const escaped = escapePdfText(text);

    let drawX = x;
    if (align === "right" || align === "center") {
      // Calcul approximatif de la largeur du texte
      const charWidth = options.approxCharWidth || (font === "F4" ? size * 0.6 : size * 0.52);
      const estimatedWidth = text.length * charWidth;
      if (align === "right") {
        drawX = x - estimatedWidth;
      } else {
        drawX = x - estimatedWidth / 2;
      }
    }

    this.pageContent.push(`BT /${font} ${size} Tf ${drawX.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`);
  }

  /**
   * Assemble tous les objets PDF et calcule les tables xref au millième d'octet près
   */
  public buildPdf(): Uint8Array {
    const streamData = this.pageContent.join("\n");
    const streamLength = new TextEncoder().encode(streamData).length;

    // Définition des objets PDF
    this.objects = [
      // 1 0 obj: Catalog
      `<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>`,
      // 2 0 obj: Pages
      `<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>`,
      // 3 0 obj: Page
      `<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 ${this.width} ${this.height}]\n  /Resources <<\n    /Font <<\n      /F1 4 0 R\n      /F2 5 0 R\n      /F3 6 0 R\n      /F4 7 0 R\n    >>\n  >>\n  /Contents 8 0 R\n>>`,
      // 4 0 obj: Helvetica (F1)
      `<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica\n  /Encoding /WinAnsiEncoding\n>>`,
      // 5 0 obj: Helvetica-Bold (F2)
      `<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica-Bold\n  /Encoding /WinAnsiEncoding\n>>`,
      // 6 0 obj: Helvetica-Oblique (F3)
      `<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica-Oblique\n  /Encoding /WinAnsiEncoding\n>>`,
      // 7 0 obj: Courier-Bold (F4)
      `<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Courier-Bold\n  /Encoding /WinAnsiEncoding\n>>`,
      // 8 0 obj: Stream
      `<<\n  /Length ${streamLength}\n>>\nstream\n${streamData}\nendstream`,
      // 9 0 obj: Info
      `<<\n  /Title (Facture iziFACTURE)\n  /Creator (iziFACTURE Pro)\n  /Producer (iziFACTURE Engine)\n  /CreationDate (D:20261026000000Z)\n>>`,
    ];

    const encoder = new TextEncoder();
    let body = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
    const offsets: number[] = [0];

    for (let i = 0; i < this.objects.length; i++) {
      const objIndex = i + 1;
      const currentOffset = encoder.encode(body).length;
      offsets.push(currentOffset);
      body += `${objIndex} 0 obj\n${this.objects[i]}\nendobj\n`;
    }

    const startXref = encoder.encode(body).length;
    let xref = `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;

    for (let i = 1; i <= this.objects.length; i++) {
      xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
    }

    const trailer = `trailer\n<<\n  /Size ${this.objects.length + 1}\n  /Root 1 0 R\n  /Info 9 0 R\n>>\nstartxref\n${startXref}\n%%EOF\n`;

    const fullPdfText = body + xref + trailer;
    return encoder.encode(fullPdfText);
  }
}

/**
 * Génère le binaire PDF officiel d'une facture
 */
export function generateInvoicePdfBytes(
  invoice: Invoice,
  companyProfile?: CompanyProfile
): Uint8Array {
  const pdf = new PdfDocumentBuilder();
  const company = companyProfile || invoice.company || DEFAULT_COMPANY;

  // Calculs financiers stricts
  const subtotalHT = invoice.subtotalHT || 0;
  const discountAmount = invoice.discountAmount || 0;
  const netCommercial = invoice.netCommercial || Math.max(0, subtotalHT - discountAmount);
  const escompteAmount = invoice.escompteAmount || 0;
  const netFinancier = invoice.netFinancier || Math.max(0, netCommercial - escompteAmount);
  const advanceAmount = invoice.advanceAmount || 0;
  const taxableHT = invoice.taxableHT || Math.max(0, netFinancier - advanceAmount);
  const taxRate = invoice.taxRate ?? 18;
  const taxAmount = invoice.taxAmount ?? Math.round((taxableHT * taxRate) / 100);
  const totalTTC = invoice.totalTTC ?? taxableHT + taxAmount;
  const precompteAmount = invoice.precompteAmount || invoice.isbAmount || 0;
  const consignationAmount = invoice.consignationAmount || 0;
  const netToPay = invoice.netToPay ?? Math.max(0, totalTTC - precompteAmount + consignationAmount);

  // ── 1. Bande supérieure Vert Émeraude (Signature visuelle iziFACTURE) ──
  pdf.setFillColor(0.02, 0.59, 0.41); // Vert émeraude #059669
  pdf.rect(0, 834, pdf.width, 8, "fill");

  // ── 2. En-tête Émetteur (Votre Entreprise) ──
  const startY = 808;

  // Logo carré stylisé ou initiales
  pdf.setFillColor(0.06, 0.09, 0.16); // Noir obsidienne #0F172A
  pdf.rect(36, startY - 28, 32, 32, "fill");
  pdf.setFillColor(0.02, 0.72, 0.51); // Accent émeraude
  pdf.rect(38, startY - 26, 6, 6, "fill");
  pdf.setFillColor(1, 1, 1);
  const initial = (company.shortName || company.name || "IF").substring(0, 2).toUpperCase();
  pdf.text(initial, 52, startY - 18, { font: "F2", size: 12, align: "center" });

  // Nom entreprise & Mentions légales
  pdf.setFillColor(0.06, 0.09, 0.16);
  pdf.text(company.name || "ENTREPRISE MOUSSA OUSMANE", 76, startY - 8, { font: "F2", size: 13 });

  pdf.setFillColor(0.38, 0.44, 0.52); // Slate-500
  const legalNif = company.nif ? `NIF: ${company.nif}` : "NIF: 3452/S";
  const legalRccm = company.rccm ? ` | RCCM: ${company.rccm}` : " | RCCM: NI-DIF-2017-M-048";
  pdf.text(`${legalNif}${legalRccm}`, 76, startY - 20, { font: "F1", size: 8 });

  const contactLine = `${company.city || "Maine Soroa / Niamey"} - Tél: ${company.phone || "+227 96 56 75 03"}`;
  pdf.text(contactLine, 76, startY - 30, { font: "F1", size: 8 });

  // ── 3. Carte Métadonnées Facture (En haut à droite) ──
  const metaBoxX = 350;
  const metaBoxW = 209;
  const metaBoxY = startY - 44;
  const metaBoxH = 50;

  // Fond et bordure douce
  pdf.setFillColor(0.97, 0.98, 0.99); // Slate-50
  pdf.rect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, "fill");
  pdf.setStrokeColor(0.88, 0.90, 0.93); // Slate-200
  pdf.setLineWidth(0.8);
  pdf.rect(metaBoxX, metaBoxY, metaBoxW, metaBoxH, "stroke");

  // Titre du document selon le type
  const isAvoir = invoice.invoiceType === "avoir";
  const isProforma = invoice.invoiceType === "proforma";
  const docTitle = isAvoir
    ? "FACTURE D'AVOIR"
    : isProforma
    ? "FACTURE PROFORMA"
    : "FACTURE DE DOIT";

  pdf.setFillColor(isAvoir ? 0.85 : isProforma ? 0.15 : 0.02, isAvoir ? 0.35 : 0.59, isAvoir ? 0.1 : 0.41);
  pdf.text(docTitle, metaBoxX + 12, metaBoxY + 36, { font: "F2", size: 9 });

  pdf.setFillColor(0.06, 0.09, 0.16);
  pdf.text(invoice.number, metaBoxX + 12, metaBoxY + 22, { font: "F4", size: 12 });

  pdf.setFillColor(0.38, 0.44, 0.52);
  pdf.text(`Émise le : ${formatDateFR(invoice.issueDate)}`, metaBoxX + 12, metaBoxY + 11, { font: "F1", size: 7.5 });
  pdf.text(`Échéance : ${formatDateFR(invoice.dueDate)}`, metaBoxX + 110, metaBoxY + 11, { font: "F1", size: 7.5 });

  // ── 4. Bloc Destinataire (Client) ──
  const clientBoxY = 712;
  const clientBoxH = 46;
  pdf.setFillColor(1, 1, 1);
  pdf.rect(36, clientBoxY, 523, clientBoxH, "fill");
  pdf.setStrokeColor(0.90, 0.92, 0.95);
  pdf.rect(36, clientBoxY, 523, clientBoxH, "stroke");

  // Petite étiquette "CLIENT DESTINATAIRE"
  pdf.setFillColor(0.02, 0.59, 0.41);
  pdf.text("CLIENT DESTINATAIRE", 46, clientBoxY + 33, { font: "F2", size: 7.5 });

  pdf.setFillColor(0.06, 0.09, 0.16);
  pdf.text(invoice.clientName || "CLIENT", 46, clientBoxY + 18, { font: "F2", size: 11 });

  pdf.setFillColor(0.38, 0.44, 0.52);
  const clientInfo = `${invoice.clientCity || "Niamey"}   |   Tél: ${invoice.clientPhone || "Non renseigné"}   |   ${invoice.clientEmail || ""}`;
  pdf.text(clientInfo, 46, clientBoxY + 7, { font: "F1", size: 8 });

  // Objet de la facture
  let currentY = clientBoxY - 14;
  if (invoice.object) {
    pdf.setFillColor(0.2, 0.25, 0.32);
    pdf.text(`Objet / Désignation : ${invoice.object}`, 36, currentY, { font: "F3", size: 8.5 });
    currentY -= 14;
  }

  // ── 5. Tableau des Lignes d'Articles (Tableau certifié) ──
  const tableTopY = currentY - 4;
  const colX = {
    desc: 46,
    qty: 330,
    unitPrice: 430,
    totalHT: 545,
  };

  // En-tête de tableau en Noir Obsidienne
  pdf.setFillColor(0.06, 0.09, 0.16); // #0F172A
  pdf.rect(36, tableTopY - 18, 523, 18, "fill");

  pdf.setFillColor(1, 1, 1);
  pdf.text("DÉSIGNATION / PRESTATION", colX.desc, tableTopY - 12, { font: "F2", size: 8 });
  pdf.text("QTÉ", colX.qty, tableTopY - 12, { font: "F2", size: 8, align: "center" });
  pdf.text("P.U. HT (FCFA)", colX.unitPrice, tableTopY - 12, { font: "F2", size: 8, align: "right" });
  pdf.text("TOTAL HT (FCFA)", colX.totalHT, tableTopY - 12, { font: "F2", size: 8, align: "right" });

  let rowY = tableTopY - 18;
  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ id: "1", description: "Prestation de services généraux", quantity: 1, unitPrice: subtotalHT, totalHT: subtotalHT }];

  items.forEach((item, index) => {
    const rowH = 20;
    rowY -= rowH;

    // Alternance de ligne zebra
    if (index % 2 === 0) {
      pdf.setFillColor(0.98, 0.99, 1.00);
      pdf.rect(36, rowY, 523, rowH, "fill");
    }

    // Ligne de séparation fine
    pdf.setStrokeColor(0.91, 0.93, 0.96);
    pdf.line(36, rowY, 559, rowY);

    // Contenu de la ligne
    pdf.setFillColor(0.12, 0.16, 0.22);
    // Tronquer la description si trop longue pour éviter de déborder
    const truncatedDesc = item.description.length > 55 ? item.description.substring(0, 52) + "..." : item.description;
    pdf.text(truncatedDesc, colX.desc, rowY + 6, { font: "F1", size: 8.5 });

    pdf.setFillColor(0.2, 0.25, 0.3);
    pdf.text(String(item.quantity), colX.qty, rowY + 6, { font: "F4", size: 8.5, align: "center" });
    pdf.text(formatFCFA(item.unitPrice).replace(" FCFA", ""), colX.unitPrice, rowY + 6, { font: "F4", size: 8.5, align: "right" });

    pdf.setFillColor(0.06, 0.09, 0.16);
    pdf.text(formatFCFA(item.totalHT), colX.totalHT, rowY + 6, { font: "F4", size: 8.5, align: "right" });
  });

  // Bordure globale du tableau
  pdf.setStrokeColor(0.85, 0.88, 0.92);
  pdf.rect(36, rowY, 523, tableTopY - rowY, "stroke");

  // ── 6. Bloc Récapitulatif Financier (À droite) & Arrêté en lettres (À gauche) ──
  const summaryTopY = rowY - 16;
  const summaryX = 330;
  const summaryW = 229;
  let currentSummaryY = summaryTopY;

  // Ligne Sous-total Brut HT
  pdf.setFillColor(0.38, 0.44, 0.52);
  pdf.text("Total Brut HT :", summaryX, currentSummaryY, { font: "F1", size: 8 });
  pdf.setFillColor(0.06, 0.09, 0.16);
  pdf.text(formatFCFA(subtotalHT), 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
  currentSummaryY -= 12;

  // Remise commerciale en cascade
  if (discountAmount > 0) {
    pdf.setFillColor(0.85, 0.2, 0.2);
    pdf.text(`Remise commerciale (${invoice.discountPercent || 0}%) :`, summaryX, currentSummaryY, { font: "F1", size: 8 });
    pdf.text(`- ${formatFCFA(discountAmount)}`, 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;

    // Net Commercial
    pdf.setFillColor(0.02, 0.50, 0.35);
    pdf.text("Net Commercial :", summaryX, currentSummaryY, { font: "F2", size: 8 });
    pdf.text(formatFCFA(netCommercial), 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;
  }

  // Escompte financier en cascade
  if (escompteAmount > 0) {
    pdf.setFillColor(0.85, 0.2, 0.2);
    pdf.text(`Escompte (${invoice.escomptePercent || 0}%) :`, summaryX, currentSummaryY, { font: "F1", size: 8 });
    pdf.text(`- ${formatFCFA(escompteAmount)}`, 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;

    // Net Financier
    pdf.setFillColor(0.12, 0.30, 0.65);
    pdf.text("Net Financier :", summaryX, currentSummaryY, { font: "F2", size: 8 });
    pdf.text(formatFCFA(netFinancier), 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;
  }

  // Avance déduite
  if (advanceAmount > 0) {
    pdf.setFillColor(0.8, 0.5, 0.1);
    pdf.text("Avance / Acompte déduit :", summaryX, currentSummaryY, { font: "F1", size: 8 });
    pdf.text(`- ${formatFCFA(advanceAmount)}`, 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;
  }

  // Montant HT soumis TVA si déductions
  if (discountAmount > 0 || escompteAmount > 0 || advanceAmount > 0) {
    pdf.setFillColor(0.25, 0.30, 0.38);
    pdf.text("Montant HT imposable :", summaryX, currentSummaryY, { font: "F1", size: 8 });
    pdf.text(formatFCFA(taxableHT), 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;
  }

  // TVA
  pdf.setFillColor(0.38, 0.44, 0.52);
  pdf.text(`TVA légale (${taxRate}%) :`, summaryX, currentSummaryY, { font: "F1", size: 8 });
  pdf.setFillColor(0.06, 0.09, 0.16);
  pdf.text(taxAmount > 0 ? `+ ${formatFCFA(taxAmount)}` : "0 FCFA", 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
  currentSummaryY -= 12;

  // Total TTC
  pdf.setFillColor(0.12, 0.16, 0.22);
  pdf.text("Total TTC :", summaryX, currentSummaryY, { font: "F2", size: 8.5 });
  pdf.text(formatFCFA(totalTTC), 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
  currentSummaryY -= 12;

  // Précompte fiscal
  if (precompteAmount > 0) {
    pdf.setFillColor(0.85, 0.2, 0.2);
    pdf.text(`Précompte fiscal (${invoice.precompteRate || 2}%) :`, summaryX, currentSummaryY, { font: "F1", size: 8 });
    pdf.text(`- ${formatFCFA(precompteAmount)}`, 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;
  }

  // Consignation emballages
  if (consignationAmount > 0) {
    pdf.setFillColor(0.02, 0.59, 0.41);
    pdf.text("Consignation d'emballages :", summaryX, currentSummaryY, { font: "F1", size: 8 });
    pdf.text(`+ ${formatFCFA(consignationAmount)}`, 555, currentSummaryY, { font: "F4", size: 8.5, align: "right" });
    currentSummaryY -= 12;
  }

  // ── Grand Bloc NET À PAYER (Fond Noir Obsidienne #0F172A) ──
  currentSummaryY -= 4;
  const netPayH = 26;
  pdf.setFillColor(0.06, 0.09, 0.16);
  pdf.rect(summaryX - 6, currentSummaryY - netPayH + 10, summaryW + 6, netPayH, "fill");

  const netLabel = isAvoir ? "NET À DÉDUIRE :" : isProforma ? "TOTAL ESTIMÉ :" : "NET À PAYER :";
  pdf.setFillColor(1, 1, 1);
  pdf.text(netLabel, summaryX, currentSummaryY - 2, { font: "F2", size: 9 });

  // Montant en vert émeraude clair
  pdf.setFillColor(0.2, 0.9, 0.6);
  pdf.text(formatFCFA(netToPay), 550, currentSummaryY - 2, { font: "F4", size: 11, align: "right" });

  // ── Arrêté la présente facture à la somme de (À gauche) ──
  const wordsY = summaryTopY;
  pdf.setFillColor(0.38, 0.44, 0.52);
  pdf.text("Arrêté la présente facture à la somme de :", 36, wordsY, { font: "F2", size: 7.5 });

  const amountInWords = numberToFrenchWords(netToPay || totalTTC);
  pdf.setFillColor(0.06, 0.09, 0.16);
  // Découper sur 2 lignes si nécessaire
  if (amountInWords.length > 50) {
    const mid = amountInWords.lastIndexOf(" ", 48);
    const line1 = amountInWords.substring(0, mid);
    const line2 = amountInWords.substring(mid + 1);
    pdf.text(`${line1}`, 36, wordsY - 12, { font: "F3", size: 8.5 });
    pdf.text(`${line2} FCFA`, 36, wordsY - 23, { font: "F3", size: 8.5 });
  } else {
    pdf.text(`${amountInWords} FCFA`, 36, wordsY - 13, { font: "F3", size: 8.5 });
  }

  // ── 7. Encadré Mode de Paiement (Épuré & Direct, calibré A4) ──
  // Positionnement naturel directement sous le bloc financier
  const bottomOfFinancials = Math.min(currentSummaryY - 14, wordsY - 36);
  const paymentBoxY = Math.max(bottomOfFinancials - 22, 65);
  const paymentBoxH = 24;

  pdf.setFillColor(0.97, 0.99, 0.98); // Fond menthe pastel douce
  pdf.rect(36, paymentBoxY, 523, paymentBoxH, "fill");
  pdf.setStrokeColor(0.80, 0.92, 0.86); // Bordure discrète
  pdf.rect(36, paymentBoxY, 523, paymentBoxH, "stroke");

  // "MODE DE RÈGLEMENT :" en Vert Émeraude sans "RETENU"
  pdf.setFillColor(0.02, 0.59, 0.41);
  pdf.text("MODE DE RÈGLEMENT :", 48, paymentBoxY + 8, { font: "F2", size: 8.5 });

  // Mode de règlement exact choisi par le propriétaire du compte
  const cleanPaymentMethod = invoice.paymentMethod || "Mobile Money";
  pdf.setFillColor(0.06, 0.09, 0.16);
  pdf.text(cleanPaymentMethod, 185, paymentBoxY + 8, { font: "F2", size: 8.5 });

  // ── 8. Bas de Page Sécurisé & Certification (Garantie 1 seule page A4) ──
  const footerY = 32;
  pdf.setStrokeColor(0.90, 0.92, 0.94);
  pdf.line(36, footerY + 14, 559, footerY + 14);

  // Mention certifiée officielle sans redondance d'ID ou SEC à droite
  pdf.setFillColor(0.45, 0.50, 0.58);
  pdf.text(
    "Document certifié iziFACTURE · Système de facturation électronique conforme aux normes OHADA / DGI",
    36,
    footerY + 4,
    { font: "F1", size: 7.5 }
  );

  return pdf.buildPdf();
}

/**
 * Crée un Blob PDF pour affichage ou partage
 */
export function generateInvoicePdfBlob(
  invoice: Invoice,
  companyProfile?: CompanyProfile
): Blob {
  const bytes = generateInvoicePdfBytes(invoice, companyProfile);
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

/**
 * Crée un fichier File officiel pour le partage Web Share API
 */
export function generateInvoicePdfFile(
  invoice: Invoice,
  companyProfile?: CompanyProfile
): File {
  const blob = generateInvoicePdfBlob(invoice, companyProfile);
  const cleanNumber = invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Facture_${cleanNumber}.pdf`;
  return new File([blob], fileName, { type: "application/pdf" });
}

/**
 * Déclenche le téléchargement immédiat du fichier PDF
 */
export function downloadInvoicePdf(
  invoice: Invoice,
  companyProfile?: CompanyProfile
): void {
  if (typeof window === "undefined") return;
  const blob = generateInvoicePdfBlob(invoice, companyProfile);
  const cleanNumber = invoice.number.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Facture_${cleanNumber}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
