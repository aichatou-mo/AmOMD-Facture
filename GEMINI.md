# 📄 ARCHITECTURE & DOCUMENTATION GLOBALE DU PROJET iziFACTURE

> Ce document constitue la référence centrale, exhaustive et faisant autorité pour le projet **iziFACTURE**.  
> Tout développeur ou modèle d'IA intervenant sur cette base de code **DOIT** lire, respecter et appliquer rigoureusement les directives, principes d'architecture et règles métier consignés ici.

---

## 1. 🌐 Ce que l'application fait (Vision & Contexte Métier)

**iziFACTURE** est une plateforme SaaS moderne, ultra-rapide et intuitive de facturation et de gestion commerciale spécialement conçue et calibrée pour les entreprises, PME, entrepreneurs et organisations de l'espace **OHADA / UEMOA / Sahel** (Niger, Burkina Faso, Mali, Côte d'Ivoire, Sénégal, Bénin, Togo, Cameroun, Guinée, etc.).

### Objectifs Principaux
1. **Émission Instantanée & Conforme** : Créer en quelques secondes des factures de vente (Doit), factures d'avoir et factures proforma respectant scrupuleusement les exigences fiscales et comptables locales (NIF, RCCM, TVA, précomptes fiscaux/ISB, acomptes, escomptes et arrêté de somme en toutes lettres).
2. **Gestion en Devises Locales & Multi-Pays** : Utilisation native du **FCFA (XOF/XAF)** avec gestion de montants entiers stricts (zéro décimale) et compatibilité multi-pays africains.
3. **Paiements & Recouvrement Adaptés au Marché Africain** : Intégration prioritaire des canaux réels d'encaissement : **Mobile Money** (Airtel Money, Moov Money, MyNita, Amanata), **Carte Bancaire** (Visa, Mastercard, GIM-UEMOA) et **Carte de Crédit**.
4. **Distribution Ultra-Rapide (WhatsApp & PDF Autonome)** : Génération 100% côté client de fichiers PDF A4 vectoriels sans latence serveur, et envoi direct du fichier PDF par **WhatsApp** via l'API Web Share native sur smartphone ou WhatsApp Web sur ordinateur.
5. **Ergonomie Mobile-First d'Excellence** : Interface ultra-réactive calibrée pour une utilisation fluide dès 360 px de largeur (smartphones d'entrée de gamme courants en Afrique subsaharienne), avec rebonds tactiles et animations fluides.

---

## 2. ⚡ Toutes les fonctionnalités implémentées

L'application regroupe un ensemble riche et complet de fonctionnalités prêtes à l'emploi :

### 📊 A. Tableau de Bord Exécutif (Dashboard)
- **4 Cartes d'Indicateurs Clés (KPIs)** interactives :
  - *Total Facturé* : Chiffre d'affaires global cumulé avec indicateur de progression mensuelle.
  - *Montant Encaissé* : Trésorerie effectivement perçue avec taux de recouvrement (ex: 79%).
  - *En Attente* : Montants facturés sur des factures envoyées et non échues.
  - *En Retard* : Créances échues nécessitant une relance client immédiate.
- **Comportement Signature d'Inversion au Clic** : Cliquer sur un KPI l'illumine en **Noir Obsidienne (`bg-slate-900 text-white`)** avec accents émeraude tandis que les autres restent blancs.
- **Graphique d'Évolution du Chiffre d'Affaires** : Visualisation mensuelle comparative (Facturé vs Encaissé) avec filtres temporels (*Mois*, *Trimestre*, *Année*).
- **Top 5 des Meilleurs Clients** : Classement dynamique du portefeuille client avec barres de progression relatives et montants cumulés en FCFA.
- **Indicateur d'Entreprise Active** : Bandeau d'en-tête rappelant la raison sociale active, la ville et le badge *"Espace Certifié Sahel"*.

---

### 📑 B. Gestion Complète du Cycle de Facturation (Invoices)
- **3 Types de Factures Supportés** :
  - 🟢 **Facture de Doit** : Vente standard de produits ou prestations de services.
  - 🔵 **Facture d'Avoir** : Document rectificatif avec saisie du numéro de facture d'origine et du motif légal (retour de marchandise, remise commerciale a posteriori).
  - 🟣 **Facture Proforma** : Devis / offre commerciale chiffrée avec sélection de la durée de validité en jours.
- **Workflow de Création Intuitif en 2 Étapes** :
  - *Étape 1* : Choix animé et guidé du type de facture (Doit, Avoir, Proforma).
  - *Étape 2* : Formulaire complet de saisie avec mise à jour et aperçu en temps réel en miroir.
- **Calculs Fiscaux & Financiers OHADA Révélés & Rigoureux** :
  - Calcul automatique par ligne : `Quantité × Prix Unitaire = Total HT`.
  - Unités de mesure personnalisables par ligne (*MT, KG, ITEM, FORFAIT, VOYAGE, SAC, HEURE, etc.*).
  - Remise commerciale globale en pourcentage (%) avec déduction automatique.
  - Calcul du **Net Commercial**.
  - Escompte financier pour paiement anticipé (%) avec calcul du **Net Financier**.
  - Déduction des **Acomptes / Avances** déjà versés.
  - Taux de TVA personnalisable (19% Niger, 18% standard UEMOA, 0% exonéré).
  - Calcul du **Précompte Fiscal (ISB)** déductible (ex: 2%, 5%).
  - Montant de **Consignation** d'emballages.
  - **Net à Payer Réel** rigoureusement calculé : `Total TTC - Précompte - Acompte`.
  - **Transcription automatique en toutes lettres** de la somme en français (ex: *"Arrêté la présente facture à la somme de douze millions quatre cent cinquante mille FCFA"*).
- **Références d'Affaires & Suivi de Marchés** :
  - N° de Bon de Commande / PO Number.
  - N° de Contrat / Marché public ou privé.
  - N° Fournisseur / Vendor ID (ex: WFP / ONU / Grands Comptes).
  - N° LTI (Logistics Tracking Identifier pour le fret et transport).
  - Référence du compte bancaire ou compte Mobile Money récepteur.

---

### 📋 C. Répertoire & Gestion des Factures (List & Detail)
- **Double Vue** : Bascule instantanée entre **Vue Tableau compact** et **Vue Cartes / Galerie**.
- **Filtres par Statut** : *Toutes*, *Payée*, *Envoyée*, *En retard*, *Brouillon*.
- **Recherche Instantanée Multi-Critères** : Filtrage par numéro de facture, nom du client, montant ou ville.
- **Pagination Intelligente** : Sélecteur de nombre d'éléments par page (10, 20, 50) avec navigation fluide.
- **Menu d'Actions Contextuel Flottant** :
  - Voir la facture en détail.
  - Modifier le document.
  - Dupliquer la facture.
  - Changer le statut en un clic (Payée, Envoyée, En retard, Brouillon).
  - Télécharger le PDF officiel.
  - Partager directement sur WhatsApp.
  - Supprimer la facture (avec modale de confirmation sécurisée).
- **Vue Détail Dédiée avec Navigation Rapide** :
  - Permet de feuilleter les factures avec les boutons **Précédente / Suivante** sans retourner au tableau.
  - Rendu haute fidélité du document avec boutons d'impression, d'export PDF et de partage WhatsApp.

---

### 🖨️ D. Moteur PDF Autonome (100% Côté Client, Zéro Dépendance)
- Situé dans [`lib/invoice-pdf.ts`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/lib/invoice-pdf.ts).
- Génère directement un flux binaire PDF conforme à la spécification PDF 1.4 A4 (595.28 × 841.89 pt).
- **Avantages Clés** :
  - Zéro dépendance npm lourde (aucun `jspdf`, `pdfmake` ou `puppeteer`).
  - Génération instantanée (quelques millisecondes).
  - Fonctionne 100% hors-ligne.
  - Encodage des caractères accentués français via table WinAnsiEncoding.
  - Structure vectorielle nette avec typographie soignée, lignes de démarcation, en-têtes contrastés, tampon officiel et tableau d'arrêté de compte.

---

### 💬 E. Partage WhatsApp Natif avec PDF Attaché
- Situé dans [`lib/whatsapp-share.ts`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/lib/whatsapp-share.ts).
- **Sur Mobile (Android / iOS)** : Exploite la `Web Share API` (`navigator.share` avec objet `files: [pdfFile]`). Le véritable fichier PDF est injecté directement dans la discussion WhatsApp de l'interlocuteur.
- **Sur Ordinateur (Desktop)** : Déclenche le téléchargement automatique du fichier PDF sur le disque dur et ouvre simultanément **WhatsApp Web** avec un message personnalisé pré-rédigé contenant les montants et coordonnées.

---

### 👥 F. Annuaire Clients (CRM Intégré)
- Situé dans [`components/ClientsPage.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/components/ClientsPage.tsx).
- Répertoire complet des clients avec suivi du chiffre d'affaires cumulé et du nombre de factures émises.
- Fiche client complète : Raison sociale, interlocuteur, adresse, ville, pays, NIF, téléphone et lien WhatsApp dédié.
- Actions directes :
  - Création immédiate d'une facture pré-remplie pour ce client.
  - Démarrage instantané d'une conversation WhatsApp.
  - Ajout, modification et suppression sécurisée avec modales en `createPortal`.

---

### ⚙️ G. Paramètres Entreprise & Multi-Profils (Settings)
- Situé dans [`components/SettingsPage.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/components/SettingsPage.tsx).
- **Onglet 1 : Profil de l'Entreprise** :
  - Raison sociale, sigle (ex: STS, ADT), slogan, NIF, RCCM, adresse complète, ville, téléphone, email.
  - Coordonnées bancaires / RIB officiel et compte Mobile Money.
  - Upload d'image du **Logo de l'entreprise**.
  - Upload de l'image du **Vrai Tampon / Cachet officiel physique** avec prévisualisation et option d'activation/désactivation sur les factures.
  - Mention officielle du signataire (ex: *"Le Gérant & Directeur Général"*).
- **Onglet 2 : Modèles & Personnalisation Graphique** :
  - 4 modèles de factures intégrés : *Standard (Classique OHADA)*, *Moderne (Élégant)*, *Entreprise (Corporate)*, *Minimaliste (Épuré)*.
  - 12 palettes de couleurs d'accentuation (Vert Émeraude Signature, Bleu Sahel, Noir Obsidienne, Or Safran, etc.).
  - Options d'affichage : Afficher/masquer le tampon, afficher/masquer les coordonnées bancaires, afficher/masquer les mentions légales.
  - **Importation de Gabarit Personnalisé** : Téléversement d'un modèle scanné / PDF personnalisé avec prévisualisation et formulaire d'ajustement.
- **Onglet 3 : Paramètres Régionaux & Devises** :
  - Base de données de 10 pays africains (Niger, Burkina Faso, Mali, Côte d'Ivoire, Sénégal, Bénin, Togo, Cameroun, Guinée, Gabon, Tchad) avec drapeaux, capitales, fuseaux horaires, indicatifs téléphoniques et taux de TVA légaux.
- **Onglet 4 : Gestion de l'Équipe & Rôles** :
  - Gestion des utilisateurs (Administrateur, Comptable, Commercial, Observateur).

---

### 🌍 H. Système International Multi-Langues (i18n)
- Situé dans [`lib/i18n.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/lib/i18n.tsx) et [`components/GlobeLanguageSelector.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/components/GlobeLanguageSelector.tsx).
- Prise en charge de **8 langues** :
  - 🇫🇷 Français (*UEMOA · Sahel & Niger*) — Langue par défaut
  - 🇬🇧 English (*International*)
  - 🇳🇪 Harshen Hausa (*Niger & Afrique de l'Ouest*)
  - 🇸🇦 العربية (*Al-Arabiya · Sahel*)
  - 🇪🇸 Español (*Castellano*)
  - 🇵🇹 Português (*UEMOA · Lusophone*)
  - 🇩🇪 Deutsch (*Standard Deutsch*)
  - 🇨🇳 中文 (*Commerce & Import-Export*)
- Composant sélecteur sous forme de **Globe animé** avec menu déroulant élégant et mémorisation du choix utilisateur dans le `localStorage`.

---

## 3. 📁 Structure des fichiers du projet

```
iziFACTURE/
├── GEMINI.md                            # 👈 Le présent document d'instructions et d'architecture
├── .agents/
│   └── rules/
│       └── design-system.md             # Règle d'uniformité visuelle et design system
│
└── izifacture-temp/                     # Application principale Next.js 14
    ├── GEMINI.md                        # Copie conforme des instructions de référence
    ├── package.json                     # Configuration des dépendances (React 18, Next 14, Tailwind 3)
    ├── tsconfig.json                    # Configuration TypeScript
    ├── tailwind.config.ts               # Configuration Tailwind (tokens, polices, ombres, couleurs)
    ├── postcss.config.mjs               # Configuration PostCSS
    ├── next.config.mjs                  # Configuration Next.js
    │
    ├── app/                             # Structure Next.js App Router
    │   ├── globals.css                  # Feuilles de style globales, variables CSS, typographies, scrollbars
    │   ├── layout.tsx                   # Layout racine avec imports des polices et métadonnées
    │   ├── page.tsx                     # 🌟 Cœur applicatif SPA : gère tous les états, onglets et flux
    │   ├── not-found.tsx                # Page 404
    │   ├── dashboard/page.tsx           # Route directe /dashboard
    │   ├── invoices/page.tsx            # Route directe /invoices
    │   ├── create-invoice/page.tsx      # Route directe /create-invoice
    │   ├── invoice-detail/page.tsx      # Route directe /invoice-detail
    │   ├── clients/page.tsx             # Route directe /clients
    │   ├── products/page.tsx            # Route directe /products
    │   ├── payments/page.tsx            # Route directe /payments
    │   └── settings/page.tsx            # Route directe /settings
    │
    ├── components/                      # Composants d'interface modulaires
    │   ├── Header.tsx                   # Barre supérieure : recherche globale, notifications, profil, sélecteur langue
    │   ├── Sidebar.tsx                  # Navigation latérale desktop + tiroir (drawer) mobile
    │   ├── StatCard.tsx                 # Cartes KPI avec comportement d'inversion Noir Obsidienne au clic
    │   ├── RevenueChart.tsx             # Graphique mensuel du Chiffre d'Affaires avec filtres temporels
    │   ├── TopClientsCard.tsx           # Carte du Top 5 des clients avec jauges proportionnelles
    │   ├── InvoicesListPage.tsx         # Page dédiée liste des factures : tableau, filtres, recherche, pagination
    │   ├── InvoicesTable.tsx            # Tableau pur réutilisable des factures
    │   ├── CreateInvoicePage.tsx        # Formulaire guidé de création / modification en 2 étapes
    │   ├── InvoiceDetailPage.tsx        # Vue détaillée complète avec navigation séquentielle précédente/suivante
    │   ├── InvoiceDetailModal.tsx       # Modale d'aperçu rapide d'une facture
    │   ├── InvoiceLivePreview.tsx       # 🌟 Rendu vectoriel dynamique de la facture (modèles, couleurs, tampon, QR)
    │   ├── ClientsPage.tsx              # Répertoire CRM des clients avec création directe et chat WhatsApp
    │   ├── SettingsPage.tsx             # Centre de configuration : profil entreprise, tampons, modèles, pays, équipe
    │   ├── ShareInvoiceModal.tsx        # Modale de partage direct par WhatsApp et options d'envoi
    │   ├── GlobeLanguageSelector.tsx    # Sélecteur flottant multi-langues avec drapeaux
    │   ├── StatusSelector.tsx           # Sélecteur de statut de facture interactif
    │   ├── ConfirmDialog.tsx            # Modale générique de confirmation sécurisée (suppression, etc.)
    │   ├── PaymentChannelsChart.tsx     # Graphique de répartition par canaux d'encaissement
    │   ├── StatusDonutChart.tsx         # Graphique en anneau par statut
    │   ├── ScrollNavigation.tsx         # Bouton flottant de retour en haut de page
    │   └── Icons.tsx                    # Bibliothèque complète de plus de 40 icônes vectorielles SVG optimisées
    │
    ├── supabase/                        # Schémas et migrations de la base de données
    │   └── migrations/
    │       └── 20261031000000_init_schema.sql # Schéma PostgreSQL relationnel avec sécurité RLS
    │
    └── lib/                             # Modules métier, utilitaires & logique
        ├── supabase.ts                  # Client singleton d'accès Supabase sécurisé
        ├── supabase-service.ts          # Couche de services asynchrones CRUD (Invoices, Clients, Companies)
        ├── i18n.tsx                     # Contexte d'internationalisation (8 langues, traductions typées)
        ├── money.ts                     # Utilitaires financiers stricts FCFA, calculs de taxes OHADA, montants en toutes lettres
        ├── invoice-pdf.ts               # Moteur autonome de génération de PDF binaire A4 vectoriel
        ├── whatsapp-share.ts            # Logique d'envoi WhatsApp (Web Share API native mobile + fallback desktop)
        └── mock-data.ts                 # Types TypeScript centraux, jeux de données de démonstration, entreprises
```

---

## 4. 🛠️ Technologies & Outils Utilisés

| Technologie | Version / Type | Rôle & Usage |
| :--- | :--- | :--- |
| **Next.js** | `14.2.35` (App Router) | Framework React pour le routage hybride (SPA + URL directes). |
| **React** | `^18.0.0` | Bibliothèque d'interface utilisateur, Hooks (`useState`, `useEffect`, `useRef`, `useContext`). |
| **TypeScript** | `^5.0.0` | Typage statique strict garantissant zéro incohérence de structures de données. |
| **Tailwind CSS** | `^3.4.1` | Moteur CSS utilitaire hautement optimisé avec configuration de tokens sur mesure. |
| **Polices Web** | Google Fonts | `Plus Jakarta Sans` (interface & labels) + `JetBrains Mono` (chiffres & montants). |
| **Icônes SVG** | Composants React purs | Bibliothèque `Icons.tsx` sans dépendance externe (zéro runtime overhead). |
| **Moteur PDF** | Moteur interne custom | Générateur binaire vectoriel sans dépendance (`lib/invoice-pdf.ts`). |
| **Backend & Base SQL** | Supabase (PostgreSQL 17) | Persistance Cloud relationnelle, sécurité RLS et synchronisation temps réel. |
| **Partage Natif** | Web Share API | `navigator.share()` avec fichiers binaires PDF pour les téléphones Android/iOS. |
| **Téléportation DOM** | React Portals | `createPortal(..., document.body)` pour toutes les modales et menus contextuels. |

---

## 5. 🎨 Décisions de Design & Charte Graphique Inviolable

Le Design System de **iziFACTURE** est le garant de son identité visuelle luxueuse, moderne et institutionnelle.

### 1. Tokens Fondamentaux
- **Fond de page** : Gris-bleu glacé `#F4F7FB` (aucune nuance terne ou blanc pur sur le fond global).
- **Cartes & Conteneurs** : Fond blanc pur `#FFFFFF`, bordure subtile `border-slate-200/80`, coins arrondis `rounded-2xl` (16px).
- **Modales & Tiroirs** : Coins arrondis `rounded-3xl` (24px) avec flou d'arrière-plan `backdrop-blur-sm bg-slate-950/60`.
- **Couleur Primaire Signature** : Vert Émeraude profond (`#059669` / `#10B981`) évoquant la prospérité et la fiabilité financière. Arrière-plans doux en menthe pastel (`#ECFDF5`).

### 2. Règle d'Inversion des Couleurs au Clic (Contraste Noir / Blanc)
- **Tout élément sélectionné ou actif** (onglet de la sidebar, carte KPI cliquée sur le dashboard, filtre actif, bouton d'option sélectionné) **bascule obligatoirement en Noir Obsidienne** :
  ```tsx
  className="bg-slate-900 text-white shadow-xl shadow-slate-900/20"
  ```
  avec texte blanc et badges vert émeraude.
- **Les éléments inactifs** restent en blanc pur avec typographie ardoise (`bg-white text-slate-800`).

### 3. Typographie & Règles Monétaires FCFA
- **Typographie double** :
  - Interface générale, titres et sous-titres : **`Plus Jakarta Sans`**.
  - Montants financiers, pourcentages, numéros de factures et dates : **`JetBrains Mono` / `font-mono`**.
- **Règle stricte des nombres entiers** :
  - **JAMAIS de nombres flottants** dans les calculs ou le stockage du FCFA. Les montants sont arrondis à l'entier (`Math.round`).
  - Formatage : Espaces insécables pour les milliers et suffixe en majuscules : `12 450 000 FCFA` (via `formatFCFA()`).
  - Le montant et la mention `FCFA` ne doivent **jamais être coupés** sur deux lignes dans les cartes.

### 4. Les 3 Canaux de Paiement Exclusifs
Toute mention ou sélection de mode de règlement doit respecter **exclusivement ces 3 catégories** :
1. 📱 **Mobile Money** (*Airtel Money, Moov Money, MyNita, Amanata*) — Couleur dominante : Vert Émeraude.
2. 💳 **Carte Bancaire** (*Visa, Mastercard, GIM-UEMOA*) — Couleur dominante : Bleu Royal (`#2563EB`).
3. 🏦 **Carte de Crédit** (*Facilités d'entreprise et crédit différé*) — Couleur dominante : Ambre / Or (`#D97706`).

### 5. Ergonomie Mobile First & Micro-Animations Tactiles
- **Calibrage 360 px** : L'interface doit être parfaitement lisible et utilisable sur écran de smartphone standard (360 × 800 px) sans aucun dépassement horizontal ni scroll horizontal involontaire sur le corps de page (`overflow-x-hidden`).
- **Rebond tactile élastique** : Tout bouton, carte cliquable ou onglet doit inclure l'effet de pression :
  ```tsx
  className="active:scale-95 transition-all duration-150"
  ```
- **Masquage de scrollbar native** : Les barres latérales et tiroirs utilisent `no-scrollbar` pour un look épuré d'application native.
- **Scrollbars explicites pour les modales** : Les longues modales de formulaires utilisent `.modal-scrollbar` garantissant une poignée de défilement bien visible et déplaçable.

---

## 6. 🤖 Instructions Impératives pour les Futurs Modèles d'IA

Lorsque vous modifiez, étendez ou déboguez la base de code d'**iziFACTURE**, vous devez respecter scrupuleusement les 10 commandements ci-dessous :

### 1. Préserver l'État Centralisé dans `app/page.tsx`
L'application fonctionne comme une SPA (Single-Page Application) hautement réactive hébergée dans [`app/page.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/app/page.tsx). Tous les états critiques (`invoices`, `clients`, `companies`, `activeCompany`, `currentTab`, `selectedInvoice`) y résident. Lorsque vous ajoutez une fonctionnalité, passez par les props ou callbacks déclarés au niveau racine afin de maintenir la synchronisation globale des données.

### 2. Ne Jamais Casser l'Inversion Noir Obsidienne
Toute nouvelle composante comportant des cartes d'état ou des sélecteurs doit implémenter l'inversion : état sélectionné = `bg-slate-900 text-white`, état inactif = `bg-white text-slate-850`.

### 3. Toujours Utiliser `formatFCFA` et `font-mono` pour les Montants
Ne codez jamais manuellement un affichage de monnaie ou de devise brute. Importez systématiquement `formatFCFA` depuis [`lib/money.ts`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/lib/money.ts) et appliquez la classe `font-mono`.

### 4. Respecter les 3 Types de Factures (Doit, Avoir, Proforma)
Toute modification apportée au formulaire de facturation ([`components/CreateInvoicePage.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/components/CreateInvoicePage.tsx)) ou à l'aperçu ([`components/InvoiceLivePreview.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/components/InvoiceLivePreview.tsx)) doit conserver la prise en charge des factures de Doit, des factures d'Avoir (avec n° de facture d'origine et motif) et des factures Proforma (avec délai de validité).

### 5. Maintenir le Moteur PDF Zéro Dépendance
N'installez **JAMAIS** de librairie externe lourde (`jspdf`, `html2canvas`, etc.) pour le PDF sans accord explicite. Enrichissez directement le générateur natif dans [`lib/invoice-pdf.ts`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/lib/invoice-pdf.ts) qui produit des fichiers purs, légers et instantanés.

### 6. Maintenir le Support Multi-Langues (i18n)
Lorsque vous ajoutez un texte, bouton, label ou message d'erreur, ajoutez la clé correspondante dans [`lib/i18n.tsx`](file:///c:/Users/LENOVO/Desktop/PROJECT/iziFACTURE/izifacture-temp/lib/i18n.tsx) pour les 8 langues prises en charge (`fr`, `en`, `ar`, `es`, `pt`, `de`, `ha`, `zh`).

### 7. Utiliser `createPortal` pour les Modales et Menus Contextuels
Toute modale, boîte de dialogue ou menu d'action flottant doit être injecté via `createPortal(..., document.body)` avec un état `mounted` (`useEffect`) pour garantir qu'aucun conteneur parent avec `overflow-hidden` ne vienne tronquer le composant.

### 8. Garantir le Scroll Top à la Navigation
Lorsqu'un utilisateur change d'onglet ou ouvre une vue détaillée, veillez à toujours déclencher un défilement instantané vers le haut :
```tsx
if (typeof window !== "undefined") {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}
```

### 9. Préserver les Commentaires et Utilitaires Existants
Conservez toujours les commentaires de documentation et les fonctions d'aide existantes. Ne tronquez jamais de logique métier lors de vos réécritures.

### 10. Priorité à la Beauté & à la Fluidité Visuelle
iziFACTURE est une vitrine technologique conçue pour impressionner par son raffinement, sa modernité et son élégance. Tout nouveau composant doit avoir une finition digne des plus grands produits logiciels mondiaux (Linear, Stripe, Vercel), adaptée aux réalités sahéliennes.
