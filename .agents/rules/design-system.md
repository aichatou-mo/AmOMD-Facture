# RÈGLE ANTIGRAVITY : DESIGN SYSTEM & UNIFORMITÉ VISUELLE iziFACTURE

Cette règle est **strictement obligatoire** pour tout agent, sous-agent ou développeur intervenant sur le projet **iziFACTURE**.
Toute nouvelle composante, page, modale, tableau, formulaire ou carte créée dans le projet **DOIT OBLIGATOIREMENT** respecter les spécifications et tokens définis ci-dessous.

---

## 1. Identité Visuelle & Tokens Fondamentaux

* **Fond de page** : Gris-bleu glacé haute clarté `#F4F7FB` (aucun fond blanc uniforme ou gris terne).
* **Cartes & Conteneurs** :
  * Fond blanc pur `#FFFFFF` (ou noir obsidienne `#0F172A` en cas d'état inversé/sélectionné).
  * Rayons de courbure : **`rounded-2xl`** (16px) pour les cartes et conteneurs, **`rounded-3xl`** (24px) pour les modales et tiroirs.
  * Bordures : Bordure discrète ultra-fine `border border-slate-200/80` (ou `border-slate-800` sur élément sombre).
  * Ombres : Ombres diffuses `shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)]` et surélévation douce au survol `hover:-translate-y-0.5 hover:shadow-md`.
* **Couleur Primaire Signature** :
  * Vert émeraude profond : `#059669` / `#10B981` (boutons d'action, indicateurs de succès, accents).
  * Teinte menthe pastel : `#ECFDF5` pour les arrière-plans d'accentuation doux.

---

## 2. Règle d'Inversion des Couleurs au Clic (Contraste Noir / Blanc)

Conformément à la direction artistique validée :
* **Composant actif / sélectionné** :
  * S'inverse systématiquement en **Noir Obsidienne** (`bg-slate-900 text-white shadow-xl shadow-slate-900/20`) avec typographie blanche, badges en contraste et touches vert émeraude lumineuses.
  * Exemples : Onglet actif de la barre latérale, Carte KPI sélectionnée sur le dashboard, Onglet de filtrage actif.
* **Composants inactifs / secondaires** :
  * Restent sur fond blanc pur avec texte ardoise (`bg-white text-slate-900`).
* **Au clic sur un élément** :
  * Le focus ou la sélection transfère immédiatement l'inversion noir/blanc avec transition fluide (`transition-all duration-200`).

---

## 3. Typographie & Règles Monétaires FCFA (XOF)

* **Polices obligatoires** :
  * Textes, titres et labels : **`Plus Jakarta Sans`** (moderne, géométrique, lisible).
  * Chiffres, montants, numéros de factures, timestamps : **`JetBrains Mono`** (`font-mono`).
* **Formatage des montants** :
  * **Toujours des entiers** en base de données et dans les calculs (jamais de `float`).
  * Format d'affichage strict : espaces pour les milliers et suffixe en lettres majuscules `FCFA` (ex: `12 450 000 FCFA`).
  * Les nombres et le symbole `FCFA` ne doivent **jamais être coupés** sur deux lignes dans les cartes.

---

## 4. Les 3 Canaux de Paiement Autorisés (Règle Métier Inviolable)

Toute section gérant les paiements, filtres, factures ou formulaires d'encaissement doit présenter **exclusivement ces 3 catégories** :
1. 📱 **Mobile Money** (*Airtel Money, Moov Money, MyNita, Amanata*) — Vert menthe / Émeraude.
2. 💳 **Carte Bancaire** (*Visa, Mastercard, Cartes GIM-UEMOA*) — Bleu royal `#2563EB`.
3. 🏦 **Carte de Crédit** (*Cartes affaires & facilités de crédit différé*) — Ambre / Or `#D97706`.

Aucun autre mode de paiement générique ne doit être introduit sans respecter cette nomenclature à 3 piliers.

---

## 5. Micro-Animations & Retours Tactiles Obligatoires

Chaque interaction utilisateur doit être vivante, réactive et fluide :
* **Boutons & Éléments cliquables** :
  * Effet de pression élastique au clic obligatoire : `active:scale-95 transition-all duration-150` (ou `active:scale-[0.97]` sur les grandes cartes).
* **Modales & Tiroirs** :
  * Entrée douce par fondu (`animate-fade-in`) ou glissement depuis la gauche (`animate-drawer-in`).
  * Fond d'assombrissement avec flou d'arrière-plan : `backdrop-blur-sm bg-slate-950/60`.
* **Survols (Hover)** :
  * Transition de 150ms à 200ms sur les couleurs d'arrière-plan et d'icône.

---

## 6. Standards Responsive & Mobile First (Calibrage 360 px)

Chaque composante créée doit être testée et impeccable sur écran smartphone standard (360 × 800 px) :
* **Zéro débordement horizontal** : Aucun texte, carte ou bouton ne doit dépasser de son conteneur.
* **Menus tiroirs** : Largeur maximale `w-64 max-w-[80vw]` avec masquage de l'ascenseur natif (`no-scrollbar`).
* **Grilles adaptatives** : 
  * Mobile : Grille à 2 colonnes (`grid-cols-2`) pour les cartes d'indicateurs (KPIs) avec paddings réduits (`p-3`).
  * Desktop : Grille à 4 colonnes (`lg:grid-cols-4`).
* **Tableaux de données** : Conteneur à défilement horizontal fluide (`overflow-x-auto`) avec action permettant de **décaler et rouvrir** chaque facture en vue détaillée via navigation précédente/suivante.

---

## 7. Badges de Statut des Factures

Les badges d'état doivent être homogènes sur l'ensemble de l'application :
* 🟢 **Payée** : `bg-emerald-50 text-emerald-700 border-emerald-200/60` avec puce verte fixe.
* 🟠 **Envoyée** : `bg-amber-50 text-amber-700 border-amber-200/60` avec puce orange.
* 🔴 **En retard** : `bg-rose-50 text-rose-700 border-rose-200/60` avec puce rouge clignotante (`animate-pulse`).
* ⚪ **Brouillon** : `bg-slate-100 text-slate-600 border-slate-200/60` avec puce grise.

---

> **Application stricte** : Tout nouveau composant (page clients, création de facture, formulaires de devis, export PDF, intégration Supabase) doit vérifier sa pleine conformité avec cette règle avant toute validation.
