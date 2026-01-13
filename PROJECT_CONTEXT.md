# KUSOMA KIDS - TECH & PRODUCT BIBLE
*Version : 1.2 | Dernière mise à jour : Janvier 2026*

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
- **IA Texte** : OpenAI GPT-4o-mini
- **IA Images** : FLUX.1 via Fal.ai (Image-to-Image avec forte ressemblance)

### Paiements
- **International** : Stripe (Cartes bancaires)
- **Local Afrique** : Wave/Orange Money (intégration future)

### Services Additionnels
- **Emailing** : Resend
- **Monitoring** : Vercel Analytics (ou Sentry pour les erreurs)

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

**Colonnes Clés** :
- `subscription_tier` : Détermine le niveau d'accès (guest vs club)
- `stripe_customer_id` : ID client Stripe pour gérer les abonnements
- `credits` : Nombre de livres débloquables (Club = 1/mois)

---

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

**Relations** :
- `user_id` → `profiles.id` (Un parent peut avoir plusieurs enfants)

---

#### 3.3 `story_templates`
**Description** : Templates d'histoires pré-générés pour économiser les appels OpenAI.

```sql
CREATE TABLE story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_slug TEXT UNIQUE NOT NULL, -- Ex: 'cheveux-magiques', 'lapin-astronaute'
  theme_title TEXT NOT NULL,
  content_json JSONB NOT NULL, -- Structure : { title, synopsis, pages: [{pageNumber, text, imagePrompt}] }
  page_count INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Structure `content_json`** :
```json
{
  "title": "Les Cheveux Magiques de {childName}",
  "synopsis": "Une histoire sur...",
  "pages": [
    {
      "pageNumber": 1,
      "text": "Il était une fois {childName}, {childAge} ans...",
      "imagePrompt": "Pixar style illustration of a {gender_en} child with magical glowing hair..."
    }
  ]
}
```

**Variables dynamiques** :
- `{childName}` : Prénom de l'enfant
- `{childAge}` : Âge de l'enfant
- `{gender}` : Genre (Garçon/Fille)
- `{gender_en}` : Genre en anglais pour prompts IA (boy/girl)

---

#### 3.4 `generated_books`
**Description** : Livres générés pour chaque enfant.

```sql
CREATE TABLE generated_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- (Peut être NULL si généré en Guest/Preview)
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  theme_slug TEXT, -- Optionnel si custom
  title TEXT, -- [NOUVEAU]
  child_name TEXT, -- [NOUVEAU] Sauvegarde contexte
  content_json JSONB NOT NULL, -- Histoire complète avec images
  cover_url TEXT, -- [NOUVEAU]
  status TEXT DEFAULT 'draft', -- 'draft' | 'completed' | 'purchased'
  is_unlocked BOOLEAN DEFAULT FALSE, -- [NOUVEAU] Acheté?
  template_id UUID REFERENCES story_templates(id), -- [NOUVEAU] Lien parent
  pdf_url TEXT, -- URL Supabase Storage du PDF généré
  purchase_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Statuts** :
- `draft` : Livre en cours de création (preview accessible pages 1-3)
- `completed` : Génération terminée, en attente d'achat
- `purchased` : Acheté par l'utilisateur (accès complet)

---

## 4. BUSINESS RULES

### Modèle Hybride

#### 4.1 Guest (Achat unique)
- **Prix** : 3000 FCFA par livre
- **Accès** : 
  - Lecture en ligne illimitée du livre acheté
  - Audio inclus (si implémenté)
  - Téléchargement PDF à vie
- **Limite** : 1 livre = 1 paiement

#### 4.2 Club (Abonnement)
- **Prix** : 6500 FCFA/mois
- **Avantages** :
  - Création illimitée de livres
  - 1 PDF offert par mois
  - Accès anticipé aux nouveaux thèmes
  - Bibliothèque complète

---

### Logique d'Accès (Soft Paywall) & Contextual Signup

#### Flow Utilisateur (Guest -> Member)

```
1. PREVIEW : Guest génère un livre
   ↓
   Pages 1-3 visibles
   Pages 4+ bloquées par Paywall
   ↓
   Clic "Rejoindre le Club"
   ↓
2. SIGNUP CONTEXTUEL :
   URL : /signup?plan=club&redirect_book_id=...
   ↓
   Création Compte + Login
   (Contexte conservé en localStorage)
   ↓
3. CHECKOUT CLUB :
   Détection Plan Club
   ↓
   API: Sauvegarde du livre en Draft (DB)
   ↓
   Paiement Stripe (Metadata: target_book_id)
   ↓
4. ONBOARDING DASHBOARD :
   Succès Stripe -> Redirect Dashboard?action=club_welcome
   ↓
   Modale : "Bienvenue ! Débloquer votre livre ? (1 crédit)"
   ↓
   API: Unlock Book -> Status 'purchased' -> Redirect Reader
```

#### Règles de Déverrouillage

| Action | Guest (Non-payé) | Guest (Livre Acheté) | Club |
|--------|------------------|----------------------|------|
| Voir pages 1-3 | ✅ | ✅ | ✅ |
| Lire pages 4+ | ❌ | ✅ (ce livre) | ✅ (tous) |
| Télécharger PDF | ❌ | ✅ (ce livre) | ✅ (tous) |
| Créer nouveau livre | ✅ (preview only) | ✅ (preview only) | ✅ (illimité) |

---

## 5. ARCHITECTURE TECHNIQUE

### Structure de Dossiers Next.js (App Router)

```
kusoma-kids/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── create/
│   │   │   └── library/
│   │   ├── checkout/             ← [NOUVEAU] Page Checkout
│   │   ├── api/
│   │   │   ├── generate-story/   ← Génération texte OpenAI
│   │   │   ├── fal/proxy/        ← Proxy Fal.ai
│   │   │   ├── books/
│   │   │   │   ├── create/       ← [NOUVEAU] Save Draft
│   │   │   │   └── unlock/       ← [NOUVEAU] Unlock w/ Credits
│   │   │   ├── checkout/
│   │   │   │   └── subscription/ ← Stripe Subscription
│   │   │   └── webhooks/stripe/
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   │   ├── BookReader.js         ← [UPDATED] Paywall Logic
│   │   ├── PaymentModal.js       ← [NOUVEAU] Choix formule
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.js
│   │   └── stripe.js
│   └── ...
```
kusoma-kids/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   │   ├── generate-story/   ← [UPDATED] Hybrid Mode (OpenAI + Base Images)
│   │   │   └── ...
│   │   ├── book/
│   │   │   └── [id]/
│   │   │       ├── page.js       ← [UPDATED] Server Component (SEO)
│   │   │       └── ...
│   │   ├── books/
│   │   │   ├── page.js           ← [UPDATED] Server Component (SEO)
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── BookDetailClient.js ← [NEW] Client Logic
│   │   │   ├── BooksClient.js      ← [NEW] Client Logic
│   │   │   ├── HomeClient.js       ← [NEW] Client Logic
│   │   │   └── ...
│   │   ├── layout.js             ← [UPDATED] Global SEO Metadata
│   │   └── page.js               ← [UPDATED] Server Component (SEO)
│   └── ...
```

### Optimisation SEO (v1.2)
- **Server Components** : Les pages principales (`/`, `/books`, `/book/[id]`) sont maintenant des Server Components par défaut.
- **Metadonnées Dynamiques** : `generateMetadata` est utilisé pour injecter le titre et l'image de couverture spécifiques à chaque livre pour le partage social.
- **Metadonnées Globales** : OpenGraph, Twitter Cards et descriptions par défaut configurés dans `layout.js`.

---

## 6. API ENDPOINTS

### 6.1 `/api/generate-story` (POST)
Génère le texte (OpenAI) ou le récupère (Template DB).
Ne **sauvegarde pas** en DB (mode "volatil" pour Guest).

### 6.2 `/api/books/create` (POST) [NOUVEAU]
Sauvegarde un livre "volatil" (localStorage) en base de données (`generated_books`) avec statut `draft`.
Requis avant le paiement pour avoir un ID fiable.

### 6.3 `/api/books/unlock` (POST) [NOUVEAU]
Déclenche l'achat avec un crédit Club.
- Vérifie `profiles.credits > 0`.
- Décrémente 1 crédit.
- Update `generated_books.is_unlocked = true`.
- Update `generated_books.status = 'purchased'`.

### 6.4 `/api/checkout/subscription` (POST) [UPDATED]
Crée une session Stripe.
- Accepte `target_book_id`.
- Passe `target_book_id` dans `metadata` Stripe.
- `success_url` pointe vers Dashboard avec params.

---

## 7. FLOW DE GÉNÉRATION IA

(Voir section 7 originale mais noter l'optimisation "Partial Generation")

### Optimisation "Partial Generation" (Mode Preview)
Pour réduire les coûts API :
1. **Preview** : Seules les pages 1 et 2 sont générées via Fal.ai.
2. **Pages 3-10** : Placeholder visuel (Cover floutée) affiché.
3. **Achat/Unlock** : Déclenchement d'un Worker (à faire) pour générer les images manquantes.

### Optimisation "Base Image Caching" (v1.2)
Pour réduire drastiquement les coûts Fal.ai (Flux/Dev) :
1.  **Champs DB** : La table `story_templates` contient désormais des URLs `base_image_url` pour chaque page (optionnel).
2.  **Hybrid Merge** : L'API `generate-story` fusionne le texte généré par OpenAI avec ces `base_image_url` si elles existent.
3.  **Frontend Logic** :
    - Si `base_image_url` présent : On saute l'étape `Flux/Dev` (coûteuse). On utilise l'image directement pour le Face Swap.
    - Si absent : On génère l'image complète (Mode Fallback).
4.  **Localhost** : Attention, Fal.ai ne peut pas accéder aux images sur `localhost`. Le Face Swap échouera en local si vous utilisez des images locales, mais l'erreur est gérée (affichage sans swap). En prod, utiliser des URLs Supabase Storage publiques.

### Optimisation "Partial Generation" (Mode Preview)
Pour réduire les coûts API :
1.  **Preview** : Seules les pages 1 et 2 sont générées via Fal.ai.
2.  **Pages 3-10** : Placeholder visuel (Cover floutée) affiché.
3.  **Achat/Unlock** : Déclenchement d'un Worker (à faire) pour générer les images manquantes.

## 8. UI/UX GUIDELINES
(Voir section 8 originale)

---

## 9. BUGS CRITIQUES À FIXER / TODO LIST

### ✅ Résolus
- **Génération IA** : Corrigé (Fal Proxy fonctionnel).
- **Template Lapin** : Corrigé (Passage correct du Thème).
- **Preview Full-Width** : Optimisé.
- **Contextual Signup** : Implémenté.
- **Checkout Flow** : Implémenté.

### 🚧 Reste à Faire
- **[CRITIQUE] Worker de Génération Post-Achat** : Actuellement, l'unlock marque le livre comme acheté mais ne génère pas encore *physiquement* les images manquantes (pages 3+). Il faut créer un script/endpoint asynchrone pour ça.
- **Webhook Stripe** : Vérifier que le webhook gère bien le cas où l'utilisateur ferme l'onglet avant le retour au Dashboard (unlock automatique via serveur).
- **Mobile Payment** : Intégrer Wave/Orange Money (actuellement simulé/Stripe only).

---

## 12. JOURNAL DES MODIFICATIONS (Changelog)

### Janvier 2026 (v1.3) - UI Polish & Hybrid Mode
- **UI Rewrite** : Passage généralisé au **Format Carré (1:1)** pour les livres. Grille Desktop 3 colonnes, Tablette 2 colonnes, Mobile 1 colonne.
- **Hybrid Preview** : Mode "Text First". Navigation débloquée pour toutes les pages. Textes visibles et éditables même si l'image est verrouillée (floutée) pour les pages 3+.
- **Experience** : Header/Footer masqués en prévisualisation ("Mode Cinéma").
- **Consistency** : Limitation à 3 items pour les sections "Dernières créations" pour un alignement parfait.

### Janvier 2026 (v1.2) - SEO & Performance
- **SEO** : Refactor complet en Server Components pour `/`, `/books`, et `/book/[id]`. Ajout des balises OpenGraph dynamiques.
- **Cost Optimization** : Implémentation du "Base Image Caching". Les templates peuvent avoir des images pré-générées pour éviter les appels Flux/Dev onéreux.
- **Stability** : Fix du crash lors de la génération si le template est vide. Warning ajouté pour les tests Face Swap en localhost.

### Janvier 2026 (v1.1)
- **Feature** : Mise en place du "Contextual Signup". Un utilisateur peut commencer en Guest, prévisualiser, et s'inscrire pour payer sans perdre son livre.
- **Tech** : Création API `/books/create` et `/books/unlock` pour gérer le cycle de vie Draft -> Purchased.
- **Optimisation** : "Partial Generation Strategy" pour ne générer les images coûteuses qu'après l'achat.
- **UX** : Ajout feedback visuel "Photo validée" et nouvelle Modale de Bienvenue Club.
