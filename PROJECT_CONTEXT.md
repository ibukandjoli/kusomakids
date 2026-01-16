# KUSOMA KIDS - TECH & PRODUCT BIBLE
*Version : 1.4 | Dernière mise à jour : Janvier 2026*

---

## 📖 TABLE DES MATIÈRES
1. [Vision & Mission](#1-vision--mission)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Base de Données](#3-architecture-base-de-données)
4. [Business Rules](#4-business-rules)
5. [Architecture Technique](#5-architecture-technique)
6. [API Endpoints](#6-api-endpoints)
7. [Flow de Génération IA](#7-flow-de-génération-ia)
8. [UI/UX Guidelines](#8-uiux-guidelines)
9. [Bugs Critiques à Fixer](#9-bugs-critiques-à-fixer)
10. [Variables d'Environnement](#10-variables-denvironnement)
11. [Instructions Développeur](#11-instructions-développeur)
12. [Journal des Modifications (Changelog)](#12-journal-des-modifications)

---

## 1. VISION & MISSION

### Concept
Web App de génération de livres d'histoires personnalisés pour enfants africains via l'IA.

### Proposition de Valeur
- **Représentation** : L'enfant devient le héros de l'histoire avec son prénom et son visage
- **Personnalisation** : Histoires adaptées à l'âge, au genre et aux préférences
- **Accessibilité** : Mobile First, paiements locaux (Wave/Orange Money)

### Cible
- Parents urbains en Afrique francophone
- Diaspora africaine
- Familles soucieuses de représentation culturelle

### Positionnement
**"Disney Afropolitain"** - Moderne, Magique, Premium. Pas de misérabilisme ou de folklore.

---

## 2. TECH STACK

### Frontend
- **Framework** : Next.js 16 (App Router)
- **Styling** : Tailwind CSS
- **Animations** : Framer Motion
- **Déploiement** : Vercel (recommandé)

### Backend & Infrastructure
- **Backend-as-a-Service** : Supabase
  - Authentification (Auth)
  - Base de données PostgreSQL
  - Edge Functions (si nécessaire)
  - Storage (pour images générées)
  - **Admin Client** : Utilisé server-side pour les opérations privilégiées (Guest Checkout)
- **IA Texte** : OpenAI GPT-4o-mini
- **IA Images** : FLUX.1 via Fal.ai (Image-to-Image avec forte ressemblance)

### Paiements
- **International** : Stripe (Cartes bancaires)
- **Local Afrique** : Wave/Orange Money (intégration future)

### Services Additionnels
- **Emailing** : Resend (via API Route / Supabase Auth)
- **Monitoring** : Vercel Analytics

---

## 3. ARCHITECTURE BASE DE DONNÉES

### Tables Supabase (Schema `public`)

#### 3.1 `profiles`
**Description** : Profils utilisateurs liés à l'authentification Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'guest', -- 'guest' | 'club'
  subscription_status TEXT, -- 'active' | 'canceled' | 'past_due'
  stripe_customer_id TEXT,
  credits INTEGER DEFAULT 0, -- [NOUVEAU] Crédits pour unlocks
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2 `children`
**Description** : Profils des enfants créés par les parents.

```sql
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL, -- 'Garçon' | 'Fille'
  photo_url TEXT, -- URL Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.3 `story_templates`
**Description** : Templates d'histoires pré-générés pour économiser les appels OpenAI.

```sql
CREATE TABLE story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_slug TEXT UNIQUE NOT NULL,
  theme_title TEXT NOT NULL,
  content_json JSONB NOT NULL,
  page_count INTEGER DEFAULT 10,
  content_json JSONB NOT NULL,
  page_count INTEGER DEFAULT 10,
  base_image_urls JSONB, -- [v1.2] Cache images (Page 1-10)
  age_range TEXT, -- [v1.5] "3-5 ans", "4-8 ans"
  tagline TEXT, -- [v1.5] Short description for card
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.4 `generated_books`
**Description** : Livres générés pour chaque enfant.

```sql
CREATE TABLE generated_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  theme_slug TEXT,
  title TEXT,
  child_name TEXT,
  child_age INTEGER, -- [v1.4] Context preservation for Worker
  child_gender TEXT, -- [v1.4] Context preservation for Worker
  child_photo_url TEXT, -- [v1.4] Context preservation for Worker
  content_json JSONB NOT NULL, 
  cover_url TEXT,
  status TEXT DEFAULT 'draft', -- 'draft' | 'completed' | 'purchased' | 'generating'
  is_unlocked BOOLEAN DEFAULT FALSE,
  template_id UUID REFERENCES story_templates(id),
  pdf_url TEXT,
  purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. BUSINESS RULES

### Modèle Hybride

#### 4.1 Guest (Achat unique)
- **Prix** : 3000 FCFA par livre
- **Flow** : Checkout sans login préalable -> Création compte automatique (Shadow User) -> Paiement -> Livraison.

#### 4.2 Club (Abonnement)
- **Prix** : 6500 FCFA/mois
- **Avantages** : Accès illimité streaming + 1 PDF/mois.

---

## 5. ARCHITECTURE TECHNIQUE

### Structure Principale

```
src/
├── app/
│   ├── (auth)/         # Login, Signup
│   ├── (dashboard)/    # Dashboard, Library
│   ├── checkout/       # [v1.4] Multi-item Cart Checkout
│   ├── club/           # [v1.4] Landing Page Club
│   ├── faq/, support/, legal/ # [v1.4] Pages légales
│   ├── api/
│   │   ├── workers/    # [v1.4] Async Tasks
│   │   │   └── generate-book/ # Worker de génération post-achat
│   │   ├── webhooks/stripe/   # Stripe Events
│   │   ├── books/
│   │   │   ├── create/ # [v1.4] Guest & Auth creation
```

---

## 6. API ENDPOINTS

### 6.1 `POST /api/workers/generate-book` [NEW v1.4]
Worker asynchrone déclenché après le paiement.
- Récupère le livre (status=purchased).
- Génère les pages manquantes (3-10) via Fal.ai (Flux + FaceSwap).
- Met à jour `generated_books` au fur et à mesure.

### 6.2 `POST /api/webhooks/stripe` [NEW v1.4]
Gère les événements Stripe `checkout.session.completed`.
- Déverrouille les livres achetés.
- Active les abonnements Club.
- Déclenche le worker de génération.

### 6.3 `POST /api/books/create` [UPDATED v1.4]
Gère la création de livre pour les invités (Guest).
- Si pas de session : Utilise `supabase-admin` pour check/create user via Email.
- Associe le livre à ce User ID.

### 6.4 `api/emails/welcome` [NEW v1.5]
Envoie l'email de bienvenue après vérification OTP.
- Uses: Resend API.
- Sender: Ibuka (Papa de Soraya).

### 6.5 `api/checkout/payment` [NEW v1.5]
Gère le paiement one-time via Stripe.
- Remplace la simulation précédente.
- Supporte: Cartes, Apple Pay, Google Pay.

---

## 7. FLOW DE GÉNÉRATION IA

1.  **Preview** : Génération Pages 1-2 only (Optimisation coûts).
2.  **Checkout** : Paiement Sécurisé via Stripe (Redirection).
3.  **Post-Purchase** : 
    - Webhook confirm payment / Retour Success.
    - Trigger `/api/workers/generate-book`.
    - Génération Pages 3-10 en background.
    - Notification Email "Histoire Prête" (La Malle aux Trésors).

---

## 9. BUGS CRITIQUES À FIXER / TODO LIST

### ✅ Résolus (v1.5)
- **Stripe Integration** : Paiements réels pour achats uniques.
- **Emails Personnalisés** : "Bienvenue" (Ibuka) et "Histoire Prête" (La Malle aux Trésors).
- **SEO URLs** : Migration vers `/book/[slug]` (basé sur theme_slug).
- **Terminologie** : Remplacement de "Livre" par "Histoire/Aventure" pour warm brand voice.
- **OTP Template** : Template HTML chaleureux pour Supabase Auth.
- **Multi-Item Cart** : Support de plusieurs livres dans le panier (`localStorage array`).
- **Guest Checkout 401** : Corrigé via Admin Client et Shadow Users.

### 🚧 Reste à Faire
- **Mobile Money** : Intégration native Wave/OM (actuellement redirigé vers Stripe Card ou à venir).

---

## 12. JOURNAL DES MODIFICATIONS (Changelog)

### Janvier 2026 (v1.5) - Payments & Emotions Update
- **Feature** : **Stripe Checkout** intégré pour les paiements réels.
- **Feature** : **Emails Personnalisés** avec "personas" (Ibuka, Trésor) pour une relation client chaleureuse.
- **Feature** : **SEO URLs** pour les pages de détails d'histoires.
- **UX** : Refonte des terminologies ("Histoire" vs "Livre") et des templates emails.
- **Tech** : Séparation des workers et clean up du Payment Flow.

### Janvier 2026 (v1.5.4) - Pivot V1 & Admin Dashboard
- **Strategic Pivot**: "Asset-First" Generation. Switched from Flux Scene Generation to **Static Templates + Face Swap** for perfect consistency.
- **Admin Dashboard**: New secured space (`/admin`) for:
    - **Analytics**: Real-time stats (Revenue, Users, Sales).
    - **Content Management**: CRUD interface for Story Templates.
- **Backend**: 
    - `generate-story` now acts as a Narrative Bridge between static visuals and text.
    - `generate-book` worker simplified to exclusive Face Swap.
- **Security**: Added `role` based access control (RBAC) to Profiles.

### Janvier 2026 (v1.5.3) - Launch Polish
- **Fix Critical** : **Paywall** : Strict verification of subscription_status before showing Read button.
- **Fix Critical** : **Cover Face Swap** : Enforced validation of swapped image URL.
- **UX** : **Typography** : Switched Cover Title to Nunito, smaller size, Top alignment.
- **UX** : **Ressemblance** : Tuning IP Adapter Scale + Specific keywords (Braids/Beads).
- **Feature** : **Audio Reader** : OpenAI TTS integration with "Generate & Cache" strategy.

### Janvier 2026 (v1.5.2) - Launch Candidate Polish
-   **Fix Critical** : **Cover Generation** : Utilisation forcée des URLs Supabase pour le Face Swap (Fal AI fix).
-   **Fix Critical** : **Ressemblance** : Prompts dynamiques (Boy/Girl, Hair, Skin) et "Looking at camera".
-   **Fix Critical** : **Flickering** : Correction du re-render loop sur la Prévisualisation.
-   **Fix Critical** : **Filtres** : Correction du filtrage par âge sur la page Bibliothèque.
-   **UX** : **Composition** : "Wide shot" et "Centered composition" pour éviter les plans trop serrés.

### Janvier 2026 (v1.5.1) - Pre-Launch Fixes
- **Fix** : **Server Error** : Correction référence ID sur page détail histoire.
- **Fix** : **Next.js 15+ Params** : Adaptation `await params` pour pages dynamiques.
- **UI** : **Icônes 3D** : Nouvelles icônes "Afropolitaines" sur Homepage.
- **Legal** : Refonte visuelle et typos des pages légales.


### Janvier 2026 (v1.4) - The "Production Ready" Update
- **Feature** : **Panier Multi-Produits** complet avec totaux dynamiques.
- **Feature** : **Guest Checkout** fluide sans friction de création de compte explicite (création silencieuse par email).
- **Feature** : **Worker de Génération Asynchrone** pour livrer le livre complet post-achat sans bloquer l'utilisateur.
- **UI** : Nouvelle page **Club** (Design Magique).
- **Compliance** : Ajout de toutes les pages légales (**FAQ, Support, CGV, Privacy, Mentions Légales**).
- **Fix** : UI Mobile polie sur l'ensemble du parcours (Hero, Forms, Checkout, Nav).
- **Fix** : **Auth Flow** : Amélioration UX Login/Signup/Verify (Textes, Backgrounds, Redirections).
- **Fix** : **Personnalisation** : Boutons Fille/Garçon optimisés pour le tactile.
- **Fix** : **Preview** : Titre dynamique sur la couverture et mode "Livre".

### Janvier 2026 (v1.3)
- **UI Rewrite** : Format Carré (1:1), Grilles responsives.
- **Hybrid Preview** : Mode Text-First avec navigation débloquée.

### Janvier 2026 (v1.2)
- **SEO** : Server Components & OpenGraph.
- **Optim** : Base Image Caching.
