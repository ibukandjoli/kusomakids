# 🐛 Diagnostic du Problème de Téléchargement PDF

## Statut Actuel

### ✅ Ce Qui Fonctionne
- Table `download_tokens` existe et contient des données
- Endpoint `/api/download-secure/[bookId]` est déployé
- Token est généré correctement (64 caractères hex)
- Email est envoyé avec le bon lien

### ❌ Ce Qui Ne Fonctionne Pas
- Validation du token échoue avec "Invalid or expired download link"
- Le token ne correspond pas en base de données

## 🔍 Hypothèses

### 1. **Problème d'Encodage URL** (PROBABLE)
Le token contient peut-être des caractères qui sont mal encodés dans l'URL.

**Test** : Comparer le token dans l'URL vs le token en DB
- Token en DB : `9c04bbc3588bb1700c8baac394ef3a437c6be816a2b9999f56b531beb68e1379`
- Token dans URL : Vérifier si identique

### 2. **Espaces ou Caractères Invisibles**
L'email pourrait ajouter des espaces ou line breaks dans le lien.

### 3. **Token Généré Mais Pas Sauvegardé**
Le webhook génère le token mais l'insertion en DB échoue silencieusement.

## 🔧 Prochaines Étapes

### Étape 1 : Vérifier les Logs Vercel
1. Aller sur Vercel Dashboard
2. Cliquer sur le projet
3. Onglet "Logs"
4. Chercher les logs de `/api/download-secure`
5. Regarder les messages de console.log

**Ce qu'on cherche** :
```
🔍 Searching for token in database...
   Token (first 20 chars): 9c04bbc3588bb1700c8b
   Token length: 64
   Book ID: 589ddd04-12bb-4490-b57c-068745ed82e1
📊 Query result: { found: false, error: ... }
```

### Étape 2 : Vérifier le Token en DB
Exécuter dans Supabase SQL Editor :
```sql
SELECT 
  id,
  book_id,
  token,
  LENGTH(token) as token_length,
  email,
  downloads_remaining,
  expires_at
FROM download_tokens
WHERE book_id = '589ddd04-12bb-4490-b57c-068745ed82e1';
```

### Étape 3 : Tester avec URL Encodée
Si le token contient des caractères spéciaux, essayer :
```javascript
const encodedToken = encodeURIComponent(token);
const url = `/api/download-secure/${bookId}?token=${encodedToken}`;
```

## 🎯 Solution Probable

**Si le token en DB est différent** → Le webhook ne sauvegarde pas correctement
**Si le token est identique** → Problème d'encodage URL ou de parsing

## 📝 Actions Immédiates

1. **Vérifier les logs Vercel** pour voir les valeurs exactes
2. **Copier le token depuis la DB** et le coller dans la page de test
3. **Comparer caractère par caractère** le token de l'URL vs celui de la DB

---

**Mise à jour** : J'ai ajouté des logs détaillés. Après le prochain déploiement, réessayez le téléchargement et envoyez-moi les logs Vercel.
