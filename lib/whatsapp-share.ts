/**
 * Moteur de partage WhatsApp officiel avec envoi direct de la Facture PDF
 * - Conforme au système d'exploitation mobile (Android Chrome, iOS Safari) via Web Share API
 * - Transfère le véritable fichier PDF joint (Facture_...pdf) directement dans le chat WhatsApp
 * - Fallback intelligent pour ordinateur de bureau : téléchargement automatique du PDF + ouverture de WhatsApp Web
 */

import { Invoice, CompanyProfile } from "./mock-data";
import { formatFCFA } from "./money";
import { generateInvoicePdfFile, downloadInvoicePdf } from "./invoice-pdf";

export interface ShareResult {
  success: boolean;
  mode: "native_share_with_pdf" | "desktop_download_and_whatsapp" | "whatsapp_web_only" | "aborted" | "error";
  message: string;
}

/**
 * Génère le message d'accompagnement texte officiel de la facture
 */
export function buildInvoiceWhatsAppMessage(invoice: Invoice): string {
  const amountStr = formatFCFA(invoice.netToPay || invoice.totalTTC);
  const typeLabel =
    invoice.invoiceType === "avoir"
      ? "facture d'avoir"
      : invoice.invoiceType === "proforma"
      ? "facture proforma"
      : "facture";

  return `Bonjour ${invoice.clientName}, voici votre ${typeLabel} ${invoice.number} d'un montant de ${amountStr}. R\\u00e8glement disponible par ${invoice.paymentMethod}. Merci.`
    .replace("\\u00e8", "è");
}

/**
 * Nettoie le numéro de téléphone pour WhatsApp
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  // Si le numéro a 8 chiffres (standard Niger/UEMOA sans préfixe pays), on ajoute l'indicatif 227 par défaut
  if (cleaned.length === 8) {
    return `227${cleaned}`;
  }
  return cleaned;
}

/**
 * Construit l'URL WhatsApp directe (wa.me)
 */
export function buildWhatsAppWebUrl(invoice: Invoice, customText?: string): string {
  const phone = cleanPhoneNumberForWhatsApp(invoice.clientPhone);
  const text = customText || buildInvoiceWhatsAppMessage(invoice);
  if (phone) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Partage la facture directement avec son fichier PDF attaché
 */
export async function shareInvoiceViaWhatsApp(
  invoice: Invoice,
  company?: CompanyProfile
): Promise<ShareResult> {
  const messageText = buildInvoiceWhatsAppMessage(invoice);

  // 1. Génération du fichier PDF physique (File object)
  let pdfFile: File;
  try {
    pdfFile = generateInvoicePdfFile(invoice, company);
  } catch (err) {
    console.error("Erreur de génération du PDF :", err);
    // Fallback immédiat vers l'URL WhatsApp si la génération PDF échoue
    if (typeof window !== "undefined") {
      window.open(buildWhatsAppWebUrl(invoice, messageText), "_blank");
    }
    return {
      success: false,
      mode: "whatsapp_web_only",
      message: "Impossible de compiler le PDF. Le message texte WhatsApp a été ouvert.",
    };
  }

  // 2. Vérification de la prise en charge du partage de fichier natif (Mobile Safari, Chrome Mobile, etc.)
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  ) {
    const shareData = {
      files: [pdfFile],
      title: `Facture ${invoice.number}`,
      text: messageText,
    };

    try {
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return {
          success: true,
          mode: "native_share_with_pdf",
          message: "Facture PDF partagée directement avec succès !",
        };
      }
    } catch (shareError: unknown) {
      const err = shareError as { name?: string; message?: string };
      // Si l'utilisateur a annulé la feuille de partage, ne pas afficher d'erreur alarmiste
      if (err.name === "AbortError") {
        return {
          success: false,
          mode: "aborted",
          message: "Partage annulé par l'utilisateur.",
        };
      }
      console.warn("Échec du partage de fichier Web Share, activation du repli :", shareError);
    }
  }

  // 3. Repli pour Desktop / Navigateurs sans Web Share de fichier :
  // Téléchargement automatique de la facture PDF + Ouverture de WhatsApp Web avec le texte pré-rempli
  if (typeof window !== "undefined") {
    downloadInvoicePdf(invoice, company);
    const waUrl = buildWhatsAppWebUrl(invoice, messageText);
    window.open(waUrl, "_blank", "noopener,noreferrer");

    return {
      success: true,
      mode: "desktop_download_and_whatsapp",
      message: "Facture PDF téléchargée ! Glissez-la simplement dans le chat WhatsApp qui vient de s'ouvrir.",
    };
  }

  return {
    success: false,
    mode: "error",
    message: "Environnement d'exécution non supporté.",
  };
}
