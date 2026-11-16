# 📄 AmOMD Facture

> Plateforme moderne de facturation et de gestion commerciale spécialement conçue et calibrée pour les entreprises, PME et organisations de l'espace **OHADA / UEMOA / Sahel** (Niger, Côte d'Ivoire, Sénégal, Burkina Faso, Mali, Bénin, Togo, etc.).
> 
> 🌐 **Application déployée en direct** : [https://amomd-facture.vercel.app](https://amomd-facture.vercel.app)

---

## ⚡ Fonctionnalités Clés

- **📑 Gestion Complète du Cycle de Facturation** :
  - Factures de **Doit** (ventes standards & prestations).
  - Factures d'**Avoir** (documents rectificatifs avec motif légal et référence d'origine).
  - Factures **Proforma** (devis chiffrés avec durée de validité).
- **🧮 Calculs Fiscaux & Financiers OHADA Rigoureux** :
  - Net commercial, escomptes, acomptes, TVA personnalisable (19%, 18%, etc.).
  - Précomptes fiscaux déductibles (ISB).
  - Arrêté automatique du montant en toutes lettres en français.
  - Gestion stricte en **FCFA (XOF/XAF)** sans décimales parasites.
- **📊 Tableau de Bord Exécutif & Rapprochement Intelligent** :
  - Indicateurs clés (Total Facturé, Encaissé, En Attente, En Retard, Total Clients).
  - Rapprochement automatique de paiements (détection de regroupements de 2 ou 3 factures totalisant un virement ou règlement).
  - Filtre de dates avec mini-calendrier interactif et déplaçable.
- **🖨️ Moteur PDF Vectoriel Autonome** :
  - Génération 100% côté client sans aucune dépendance npm lourde.
  - Documents A4 soignés avec tampon officiel, signature et coordonnées bancaires / Mobile Money.
- **👥 Annuaire Clients (CRM Intégré)** & **Gestion d'Équipe** avec codes d'accès uniques.
- **🌍 Internationalisation (i18n)** : 8 langues prises en charge (Français, English, Hausa, العربية, Español, Português, Deutsch, 中文).
- **🔒 Sécurité & Persistance Cloud** : Supabase PostgreSQL avec Row-Level Security (RLS).

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur recommandé)
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/aichatou-mo/Amomd-Facture.git
cd Amomd-Facture

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Renseignez vos clés Supabase dans .env.local

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 14](https://nextjs.org/) (App Router)
- **UI** : [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Typage** : [TypeScript 5](https://www.typescriptlang.org/)
- **Base de données & Auth** : [Supabase](https://supabase.com/) (PostgreSQL 17, RLS)
- **Polices** : Plus Jakarta Sans & JetBrains Mono

---

## 📄 Licence

Tous droits réservés © AmOMD Facture.
