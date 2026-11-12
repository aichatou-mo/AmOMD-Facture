import { supabase } from "./supabase";
import {
  Invoice,
  InvoiceStatus,
  Client,
  CompanyProfile,
} from "./mock-data";

const COMPANY_EXT_PREFIX = "izifacture_company_ext_";

type CompanyExtendedPrefs = Pick<
  CompanyProfile,
  | "invoiceAccentColor"
  | "showStampOnInvoice"
  | "showBankDetailsOnInvoice"
  | "showLegalMentionsOnInvoice"
  | "defaultPaymentMethod"
  | "defaultPaymentDetail"
  | "defaultTaxRate"
  | "customTemplateFileName"
  | "customTemplateMime"
  | "customTemplateUrl"
  | "customInvoiceData"
>;

function readCompanyExtendedPrefs(companyId: string): CompanyExtendedPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${COMPANY_EXT_PREFIX}${companyId}`);
    return raw ? (JSON.parse(raw) as CompanyExtendedPrefs) : {};
  } catch {
    return {};
  }
}

function writeCompanyExtendedPrefs(company: CompanyProfile): void {
  if (typeof window === "undefined") return;
  try {
    const ext: CompanyExtendedPrefs = {
      invoiceAccentColor: company.invoiceAccentColor,
      showStampOnInvoice: company.showStampOnInvoice,
      showBankDetailsOnInvoice: company.showBankDetailsOnInvoice,
      showLegalMentionsOnInvoice: company.showLegalMentionsOnInvoice,
      defaultPaymentMethod: company.defaultPaymentMethod,
      defaultPaymentDetail: company.defaultPaymentDetail,
      defaultTaxRate: company.defaultTaxRate,
      customTemplateFileName: company.customTemplateFileName,
      customTemplateMime: company.customTemplateMime,
      customTemplateUrl: company.customTemplateUrl,
      customInvoiceData: company.customInvoiceData,
    };
    window.localStorage.setItem(`${COMPANY_EXT_PREFIX}${company.id}`, JSON.stringify(ext));
  } catch {
    // Ignore storage quota errors
  }
}

function toNumberOrUndefined(val: unknown): number | undefined {
  if (val === null || val === undefined || val === "") return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

function mapDbToInvoice(row: any): Invoice {
  const taxRate =
    row.tax_rate !== null && row.tax_rate !== undefined ? Number(row.tax_rate) : 0;
  const totalTTC = Math.round(Number(row.total_ttc) || 0);
  const netToPay =
    row.net_to_pay !== null && row.net_to_pay !== undefined
      ? Math.round(Number(row.net_to_pay))
      : totalTTC;

  return {
    id: row.id,
    number: row.number,
    invoiceType: row.invoice_type || "doit",
    templateId: row.template_id || "tpl-1",
    originalInvoiceRef: row.original_invoice_ref || undefined,
    avoirReason: row.avoir_reason || undefined,
    proformaValidityDays: toNumberOrUndefined(row.proforma_validity_days),
    companyName: row.company_name || undefined,
    clientName: row.client_name,
    clientEmail: row.client_email || "",
    clientPhone: row.client_phone || "",
    clientCity: row.client_city || "",
    clientAddress: row.client_address || undefined,
    object: row.object || undefined,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: (row.status as InvoiceStatus) || "brouillon",
    poNumber: row.po_number || undefined,
    contractNumber: row.contract_number || undefined,
    vendorNumber: row.vendor_number || undefined,
    ltiNumber: row.lti_number || undefined,
    bankAccountRef: row.bank_account_ref || undefined,
    subtotalHT: Math.round(Number(row.subtotal_ht) || 0),
    discountPercent: toNumberOrUndefined(row.discount_percent),
    discountAmount: Math.round(Number(row.discount_amount) || 0),
    netCommercial: Math.round(Number(row.net_commercial) || 0),
    escomptePercent: toNumberOrUndefined(row.escompte_percent),
    escompteAmount: Math.round(Number(row.escompte_amount) || 0),
    netFinancier: Math.round(Number(row.net_financier) || 0),
    advanceAmount: Math.round(Number(row.advance_amount) || 0),
    taxableHT: Math.round(Number(row.taxable_ht) || 0),
    taxRate,
    taxAmount: Math.round(Number(row.tax_amount) || 0),
    totalTTC,
    precompteRate: toNumberOrUndefined(row.precompte_rate),
    precompteAmount: Math.round(Number(row.precompte_amount) || 0),
    isbRate: toNumberOrUndefined(row.isb_rate),
    isbAmount: Math.round(Number(row.isb_amount) || 0),
    consignationAmount: Math.round(Number(row.consignation_amount) || 0),
    netToPay,
    paidAmount: Math.round(Number(row.paid_amount) || 0),
    paymentMethod: row.payment_method || "Mobile Money",
    paymentDetail: row.payment_detail || undefined,
    items: Array.isArray(row.items) ? row.items : [],
  };
}

function mapInvoiceToDb(
  inv: Invoice,
  meta: { userId: string; companyId?: string | null; clientId?: string | null }
): Record<string, any> {
  const payload: Record<string, any> = {
    id: inv.id,
    user_id: meta.userId,
    number: inv.number,
    invoice_type: inv.invoiceType || "doit",
    template_id: inv.templateId || "tpl-1",
    original_invoice_ref: inv.originalInvoiceRef || null,
    avoir_reason: inv.avoirReason || null,
    proforma_validity_days: inv.proformaValidityDays ?? null,
    company_name: inv.companyName || inv.company?.name || null,
    client_name: inv.clientName,
    client_email: inv.clientEmail || null,
    client_phone: inv.clientPhone || null,
    client_city: inv.clientCity || null,
    client_address: inv.clientAddress || null,
    object: inv.object || null,
    issue_date: inv.issueDate,
    due_date: inv.dueDate,
    status: inv.status,
    po_number: inv.poNumber || null,
    contract_number: inv.contractNumber || null,
    vendor_number: inv.vendorNumber || null,
    lti_number: inv.ltiNumber || null,
    bank_account_ref: inv.bankAccountRef || null,
    subtotal_ht: Math.round(inv.subtotalHT || 0),
    discount_percent: inv.discountPercent ?? null,
    discount_amount: Math.round(inv.discountAmount || 0),
    net_commercial: Math.round(inv.netCommercial || 0),
    escompte_percent: inv.escomptePercent ?? null,
    escompte_amount: Math.round(inv.escompteAmount || 0),
    net_financier: Math.round(inv.netFinancier || 0),
    advance_amount: Math.round(inv.advanceAmount || 0),
    taxable_ht: Math.round(inv.taxableHT || 0),
    tax_rate: inv.taxRate ?? 0,
    tax_amount: Math.round(inv.taxAmount || 0),
    total_ttc: Math.round(inv.totalTTC || 0),
    precompte_rate: inv.precompteRate ?? null,
    precompte_amount: Math.round(inv.precompteAmount || 0),
    isb_rate: inv.isbRate ?? null,
    isb_amount: Math.round(inv.isbAmount || 0),
    consignation_amount: Math.round(inv.consignationAmount || 0),
    net_to_pay: Math.round(inv.netToPay ?? inv.totalTTC ?? 0),
    paid_amount: Math.round(inv.paidAmount || 0),
    payment_method: inv.paymentMethod || "Mobile Money",
    payment_detail: inv.paymentDetail || null,
    items: inv.items || [],
    updated_at: new Date().toISOString(),
  };

  if (meta.companyId !== undefined) {
    payload.company_id = meta.companyId;
  } else if (inv.company?.id) {
    payload.company_id = inv.company.id;
  }

  if (meta.clientId !== undefined) {
    payload.client_id = meta.clientId;
  }

  return payload;
}

async function syncInvoiceItems(invoice: Invoice): Promise<void> {
  try {
    await supabase.from("invoice_items").delete().eq("invoice_id", invoice.id);
    if (!invoice.items || invoice.items.length === 0) return;

    const itemRows = invoice.items.map((it, idx) => ({
      id: `${invoice.id}__${it.id || idx + 1}`,
      invoice_id: invoice.id,
      description: it.description || "Prestation",
      quantity: Number(it.quantity) || 1,
      unit_price: Math.round(Number(it.unitPrice) || 0),
      total_ht: Math.round(
        Number(it.totalHT ?? (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)) || 0
      ),
      unit: it.unit || "UNITE",
      currency: it.currency || "FCFA",
    }));

    const { error } = await supabase.from("invoice_items").upsert(itemRows);
    if (error) {
      console.warn("Warning syncing invoice_items:", error.message);
    }
  } catch (err) {
    console.warn("syncInvoiceItems error:", err);
  }
}

// ==========================================
// 1. FACTURES (INVOICES + INVOICE_ITEMS)
// ==========================================

export async function fetchInvoices(userId: string): Promise<Invoice[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("fetchInvoices error:", error?.message);
      return [];
    }
    return data.map(mapDbToInvoice);
  } catch (err) {
    console.warn("fetchInvoices error:", err);
    return [];
  }
}

export async function upsertInvoice(
  invoice: Invoice,
  meta: { userId: string; companyId?: string | null; clientId?: string | null }
): Promise<boolean> {
  if (!meta.userId) return false;
  try {
    const payload = mapInvoiceToDb(invoice, meta);
    const { error } = await supabase.from("invoices").upsert(payload);
    if (error) {
      console.error("Error upserting invoice to Supabase:", error);
      return false;
    }
    await syncInvoiceItems(invoice);
    return true;
  } catch (err) {
    console.error("Failed to upsert invoice:", err);
    return false;
  }
}

export async function deleteInvoice(id: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error("Error deleting invoice from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to delete invoice:", err);
    return false;
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  userId: string,
  paidAmount?: number
): Promise<boolean> {
  if (!userId) return false;
  try {
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (paidAmount !== undefined) {
      updatePayload.paid_amount = Math.round(paidAmount);
    }
    const { error } = await supabase
      .from("invoices")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error("Error updating invoice status:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to update status:", err);
    return false;
  }
}

// ==========================================
// 2. CLIENTS (CRM)
// ==========================================

export async function fetchClients(userId: string): Promise<Client[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("fetchClients error:", error?.message);
      return [];
    }

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      contactPerson: c.contact_person || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || undefined,
      city: c.city || "",
      country: c.country || "",
      totalBilled: Math.round(Number(c.total_billed) || 0),
      invoicesCount: Number(c.invoices_count) || 0,
      nif: c.nif || undefined,
      whatsapp: c.whatsapp || undefined,
    }));
  } catch (err) {
    console.warn("fetchClients error:", err);
    return [];
  }
}

export async function upsertClient(
  client: Client,
  meta: { userId: string; companyId?: string | null }
): Promise<boolean> {
  if (!meta.userId) return false;
  try {
    const payload: Record<string, any> = {
      id: client.id,
      user_id: meta.userId,
      name: client.name,
      contact_person: client.contactPerson || null,
      email: client.email || null,
      phone: client.phone || null,
      address: client.address || null,
      city: client.city || null,
      country: client.country || null,
      total_billed: Math.round(client.totalBilled || 0),
      invoices_count: client.invoicesCount || 0,
      nif: client.nif || null,
      whatsapp: client.whatsapp || null,
      updated_at: new Date().toISOString(),
    };
    if (meta.companyId) {
      payload.company_id = meta.companyId;
    }
    const { error } = await supabase.from("clients").upsert(payload);
    if (error) {
      console.error("Error upserting client to Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to upsert client:", err);
    return false;
  }
}

export async function deleteClient(id: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.error("Error deleting client from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to delete client:", err);
    return false;
  }
}

// ==========================================
// 3. ENTREPRISE (COMPANIES)
// ==========================================

export async function fetchCompanies(userId: string): Promise<CompanyProfile[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      console.warn("fetchCompanies error:", error?.message);
      return [];
    }

    return data.map((c) => {
      const ext = readCompanyExtendedPrefs(c.id);
      const showStampVal = c.show_stamp ?? false;
      return {
        id: c.id,
        name: c.name,
        shortName: c.short_name || undefined,
        tagline: c.tagline || undefined,
        logoUrl: c.logo_url || undefined,
        stampUrl: c.stamp_url || undefined,
        nif: c.nif || undefined,
        rccm: c.rccm || undefined,
        phone: c.phone || undefined,
        email: c.email || undefined,
        address: c.address || undefined,
        city: c.city || undefined,
        country: c.country || "Niger",
        bankAccount: c.bank_account || undefined,
        signatory: c.signatory || undefined,
        showStamp: showStampVal,
        showStampOnInvoice: ext.showStampOnInvoice ?? showStampVal,
        invoiceTemplateId: c.invoice_template_id || "tpl-1",
        invoiceAccentColor: ext.invoiceAccentColor,
        showBankDetailsOnInvoice: ext.showBankDetailsOnInvoice,
        showLegalMentionsOnInvoice: ext.showLegalMentionsOnInvoice,
        defaultPaymentMethod: ext.defaultPaymentMethod,
        defaultPaymentDetail: ext.defaultPaymentDetail,
        defaultTaxRate: ext.defaultTaxRate,
        customTemplateFileName: ext.customTemplateFileName,
        customTemplateMime: ext.customTemplateMime,
        customTemplateUrl: ext.customTemplateUrl,
        customInvoiceData: ext.customInvoiceData,
      };
    });
  } catch (err) {
    console.warn("fetchCompanies error:", err);
    return [];
  }
}

export async function upsertCompany(
  company: CompanyProfile,
  userId: string
): Promise<boolean> {
  if (!userId) return false;
  try {
    writeCompanyExtendedPrefs(company);
    const payload = {
      id: company.id,
      user_id: userId,
      name: company.name,
      short_name: company.shortName || null,
      tagline: company.tagline || null,
      logo_url: company.logoUrl || null,
      stamp_url: company.stampUrl || null,
      nif: company.nif || null,
      rccm: company.rccm || null,
      phone: company.phone || null,
      email: company.email || null,
      address: company.address || null,
      city: company.city || null,
      country: company.country || "Niger",
      bank_account: company.bankAccount || null,
      signatory: company.signatory || null,
      show_stamp: company.showStampOnInvoice ?? company.showStamp ?? false,
      invoice_template_id: company.invoiceTemplateId || "tpl-1",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("companies").upsert(payload);
    if (error) {
      console.error("Error upserting company to Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to upsert company:", err);
    return false;
  }
}

export async function ensureUserCompany(
  userId: string,
  companyName?: string,
  email?: string
): Promise<CompanyProfile[]> {
  const existing = await fetchCompanies(userId);
  if (existing.length > 0) return existing;

  const initialCompany: CompanyProfile = {
    id: `comp-${userId.slice(0, 8)}`,
    name: companyName?.trim() || "Mon Entreprise",
    email: email || "",
    country: "Niger",
    city: "",
    defaultTaxRate: 19,
    defaultPaymentMethod: "Mobile Money",
    invoiceTemplateId: "tpl-1",
    showStamp: false,
    showStampOnInvoice: false,
  };

  await upsertCompany(initialCompany, userId);
  return [initialCompany];
}
