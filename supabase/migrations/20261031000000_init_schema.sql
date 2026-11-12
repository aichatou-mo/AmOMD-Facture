-- ==============================================================================
-- SCHEMA OFFICIEL iziFACTURE POUR SUPABASE (POSTGRESQL 17)
-- Norme OHADA / UEMOA / Sahel (FCFA stricts, RLS activé, Relations & Index)
-- ==============================================================================

-- 1. Table: companies (Profils d'entreprises émettrices)
CREATE TABLE IF NOT EXISTS public.companies (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    short_name text,
    tagline text,
    logo_url text,
    stamp_url text,
    nif text,
    rccm text,
    phone text,
    email text,
    address text,
    city text,
    country text DEFAULT 'Niger',
    bank_account text,
    signatory text,
    show_stamp boolean DEFAULT true,
    invoice_template_id text DEFAULT 'tpl-1',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);

-- 2. Table: clients (Annuaire CRM des clients)
CREATE TABLE IF NOT EXISTS public.clients (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id text REFERENCES public.companies(id) ON DELETE SET NULL,
    name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    address text,
    city text DEFAULT 'Niamey',
    country text DEFAULT 'Niger',
    total_billed bigint DEFAULT 0 NOT NULL,
    invoices_count int DEFAULT 0 NOT NULL,
    nif text,
    whatsapp text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- 3. Table: invoices (Factures de Doit, Avoir, Proforma)
CREATE TABLE IF NOT EXISTS public.invoices (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id text REFERENCES public.companies(id) ON DELETE SET NULL,
    client_id text REFERENCES public.clients(id) ON DELETE SET NULL,
    number text NOT NULL,
    invoice_type text NOT NULL DEFAULT 'doit', -- 'doit', 'avoir', 'proforma'
    template_id text DEFAULT 'tpl-1',
    original_invoice_ref text,
    avoir_reason text,
    proforma_validity_days int,
    company_name text,
    client_name text NOT NULL,
    client_email text,
    client_phone text,
    client_city text,
    client_address text,
    object text,
    issue_date text NOT NULL,
    due_date text NOT NULL,
    status text NOT NULL DEFAULT 'brouillon', -- 'payee', 'envoyee', 'en_retard', 'brouillon'
    po_number text,
    contract_number text,
    vendor_number text,
    lti_number text,
    bank_account_ref text,
    subtotal_ht bigint DEFAULT 0 NOT NULL,
    discount_percent numeric,
    discount_amount bigint DEFAULT 0,
    net_commercial bigint DEFAULT 0,
    escompte_percent numeric,
    escompte_amount bigint DEFAULT 0,
    net_financier bigint DEFAULT 0,
    advance_amount bigint DEFAULT 0,
    taxable_ht bigint DEFAULT 0,
    tax_rate numeric DEFAULT 19,
    tax_amount bigint DEFAULT 0,
    total_ttc bigint DEFAULT 0 NOT NULL,
    precompte_rate numeric,
    precompte_amount bigint DEFAULT 0,
    isb_rate numeric,
    isb_amount bigint DEFAULT 0,
    consignation_amount bigint DEFAULT 0,
    net_to_pay bigint DEFAULT 0 NOT NULL,
    paid_amount bigint DEFAULT 0,
    payment_method text DEFAULT 'Mobile Money',
    payment_detail text,
    items jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- 4. Table: invoice_items (Lignes d'articles et prestations normalisées)
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    invoice_id text NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity numeric NOT NULL DEFAULT 1,
    unit_price bigint NOT NULL DEFAULT 0,
    total_ht bigint NOT NULL DEFAULT 0,
    unit text DEFAULT 'ITEM',
    currency text DEFAULT 'FCFA',
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- ==============================================================================
-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS) & DROITS D'ACCÈS
-- ==============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Attribution des droits d'accès aux rôles Supabase
GRANT ALL ON TABLE public.companies TO anon, authenticated;
GRANT ALL ON TABLE public.clients TO anon, authenticated;
GRANT ALL ON TABLE public.invoices TO anon, authenticated;
GRANT ALL ON TABLE public.invoice_items TO anon, authenticated;

-- Politiques RLS multi-utilisateurs :
-- Les utilisateurs connectés ont un accès exclusif à leurs propres lignes (auth.uid() = user_id)
-- Les lignes avec user_id NULL sont accessibles pour le mode espace de travail par défaut
DROP POLICY IF EXISTS "companies_user_isolation" ON public.companies;
CREATE POLICY "companies_user_isolation" ON public.companies
    FOR ALL TO anon, authenticated
    USING (user_id IS NULL OR auth.uid() = user_id)
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_user_isolation" ON public.clients;
CREATE POLICY "clients_user_isolation" ON public.clients
    FOR ALL TO anon, authenticated
    USING (user_id IS NULL OR auth.uid() = user_id)
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_user_isolation" ON public.invoices;
CREATE POLICY "invoices_user_isolation" ON public.invoices
    FOR ALL TO anon, authenticated
    USING (user_id IS NULL OR auth.uid() = user_id)
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "invoice_items_user_isolation" ON public.invoice_items;
CREATE POLICY "invoice_items_user_isolation" ON public.invoice_items
    FOR ALL TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE public.invoices.id = public.invoice_items.invoice_id
            AND (public.invoices.user_id IS NULL OR auth.uid() = public.invoices.user_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE public.invoices.id = public.invoice_items.invoice_id
            AND (public.invoices.user_id IS NULL OR auth.uid() = public.invoices.user_id)
        )
    );

