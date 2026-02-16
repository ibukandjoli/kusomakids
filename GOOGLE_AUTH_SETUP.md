# Configuration de l'Authentification Google pour KusomaKids

Ce guide détaille les étapes exactes pour connecter Google Sign-In à votre projet Supabase.

---

## Etape 1 : Récupérer l'URL de Callback Supabase

Avant d'aller sur Google, il nous faut l'URL exacte où Google doit renvoyer l'utilisateur.

1.  Allez dans votre **Dashboard Supabase**.
2.  Dans le menu de gauche, cliquez sur l'icône **Authentication** (le cadenas 🔒).
3.  Sous le titre **Configuration**, cliquez sur **Providers**.
    *   ⚠️ **Attention** : Ne cliquez PAS sur "OAuth 2.0" ou "OAuth Server". C'est une autre fonction.
4.  Cliquez sur **Google** (pas besoin d'activer tout de suite).
4.  Copiez l'URL affichée en haut sous **Callback URL (for OAuth)**.
    *   Elle ressemble à : `https://<votre-id-projet>.supabase.co/auth/v1/callback`
    *   **Gardez cette URL précieusement**, on en a besoin tout de suite.

---

## Etape 2 : Configuration Google Cloud Console

1.  Allez sur la [Google Cloud Console](https://console.cloud.google.com/).
2.  Assurez-vous d'être sur le bon projet (**KusomaKids**).

### A. Écran de consentement OAuth (OAuth Consent Screen)
1.  Dans le menu de gauche (ou la barre de recherche), allez sur **APIs & Services** > **OAuth consent screen**.
2.  Sélectionnez **External** (Externe) puis cliquez sur **CREATE**.
3.  Remplissez les infos obligatoires :
    *   **App Name** : `KusomaKids`
    *   **User Support Email** : Votre email.
    *   **Developer Contact Email** : Votre email.
4.  Cliquez sur **SAVE AND CONTINUE** (vous pouvez ignorer les "Scopes" pour l'instant).
5.  Cliquez sur **SAVE AND CONTINUE** (vous pouvez ignorer les "Test Users").
6.  À la fin, cliquez sur **BACK TO DASHBOARD**.

### B. Créer les Identifiants (Credentials)
1.  Dans le menu de gauche, cliquez sur **Credentials**.
2.  Cliquez sur **+ CREATE CREDENTIALS** (en haut) > **OAuth client ID**.
3.  **Application Type** : Sélectionnez **Web application**.
4.  **Name** : `KusomaKids Web` (ou ce que vous voulez).
5.  **Authorized JavaScript origins** :
    *   Ajoutez `http://localhost:3000` (pour vos tests locaux).
    *   Ajoutez `https://www.kusomakids.com` (pour la production).
    *   Ajoutez `https://<votre-id-projet>.supabase.co` (l'URL de base de votre Supabase).
6.  **Authorized redirect URIs** (C'est ici que c'est CRITIQUE) :
    *   Collez l'URL copiée à l'étape 1 : `https://<votre-id-projet>.supabase.co/auth/v1/callback`
7.  Cliquez sur **CREATE**.

Une popup va s'afficher avec votre **Client ID** et votre **Client Secret**.
**Ne fermez pas cette fenêtre** ou copiez-les tout de suite.
   *   Si vous l'avez fermée trop vite, cliquez sur **+ Add secret** (Ajouter un code secret) pour en générer un nouveau.
   *   Copiez-le IMMÉDIATEMENT, car Google ne l'affichera plus jamais en entier.

---

## Etape 3 : Configuration Supabase

Retournez sur le [Dashboard Supabase](https://supabase.com/dashboard).

### A. Activer le Provider Google
1.  Allez dans **Authentication** > **Providers**.
2.  Cliquez sur **Google**.
3.  Activez le switch **Enable Sign in with Google**.
4.  Collez le **Client ID** (récupéré à l'étape 2.B).
5.  Collez le **Client Secret** (récupéré à l'étape 2.B).
6.  Cliquez sur **Save**.

### B. Vérifier les URLs de Site (URL Configuration)
C'est indispensable pour que la redirection finale vers votre site fonctionne.

1.  Allez dans **Authentication** > **URL Configuration**.
2.  **Site URL** : Mettez votre URL de production : `https://www.kusomakids.com`
3.  **Redirect URLs** : Ajoutez les URLs suivantes :
    *   `http://localhost:3000/**`
    *   `https://www.kusomakids.com/**`
    *   `https://kusomakids.vercel.app/**` (si vous utilisez aussi le domaine Vercel par défaut)
4.  Cliquez sur **Save**.

---

## 🎉 C'est terminé !

Vous pouvez maintenant tester le bouton "Se connecter avec Google" sur votre site local (`http://localhost:3000/login`).
Si tout est bien configuré, vous devriez être redirigé vers Google, puis revenir sur votre Dashboard (ou l'Onboarding si c'est un nouveau compte).
