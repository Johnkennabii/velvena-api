# Variables d'environnement Backend - Calendly OAuth

Ce fichier contient les variables d'environnement à ajouter dans le backend pour l'intégration Calendly OAuth.

⚠️ **FICHIER CONFIDENTIEL - NE PAS COMMITER**

---

## 🧪 DEVELOPMENT (Sandbox)

Variables pour l'environnement de **développement** avec l'application OAuth Calendly en mode **sandbox**.

### Backend `.env.development`

```bash
# Calendly OAuth (SANDBOX - Development)
CALENDLY_CLIENT_ID=C8PqDizYu-MyqJlRWMifsc4ct7GGJ90PeOew4n1F8xU
CALENDLY_CLIENT_SECRET=7nXV7MUFTFTqKY-1v7f5l_i6kDa6bFAVq1qTYmhX5Uc
CALENDLY_WEBHOOK_SIGNING_KEY=8gqbG4YCvY4Zd_apCIRqprzpycTfHHD4QyAJr-St_Ik
CALENDLY_REDIRECT_URI=https://velvena.fr/auth/calendly/callback
CALENDLY_ENVIRONMENT=sandbox

# Encryption key for OAuth tokens (32 bytes)
# Générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<générer_une_clé_aléatoire>
```

### Configuration Calendly Dashboard (Dev)

- **App Name**: Velvena Development
- **Environment**: Sandbox
- **Kind**: Web
- **Redirect URI**: `https://velvena.fr/auth/calendly/callback`

---

## 🚀 PRODUCTION

Variables pour l'environnement de **production** avec l'application OAuth Calendly en mode **production**.

### Backend `.env.production`

```bash
# Calendly OAuth (PRODUCTION)
CALENDLY_CLIENT_ID=8A0q28U8dL-EARIr7q0zjZp7SvEd2F1pKKYiMjkVNrM
CALENDLY_CLIENT_SECRET=2ewe5Yhl4nGgapJoJWBtoM27kHBSAWNOhGPLRXVKKJs
CALENDLY_WEBHOOK_SIGNING_KEY=j0xTdQAKAehQKeHzwMAEb-Qqk4o8DUWhH8IehaXycoU
CALENDLY_REDIRECT_URI=https://velvena.fr/auth/calendly/callback
CALENDLY_ENVIRONMENT=production

# Encryption key for OAuth tokens (32 bytes)
# ⚠️ DOIT ÊTRE DIFFÉRENTE de celle de dev
ENCRYPTION_KEY=<générer_une_clé_différente_pour_prod>
```

### Configuration Calendly Dashboard (Prod)

- **App Name**: Velvena Production
- **Environment**: Production
- **Kind**: Web
- **Redirect URI**: `https://velvena.fr/auth/calendly/callback`

---

## 🔐 Génération de la clé de chiffrement

Pour chiffrer les tokens OAuth en base de données, générez une clé de 32 bytes :

```bash
# Générer une clé de chiffrement AES-256
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important :**
- Générez **2 clés différentes** : une pour dev, une pour prod
- Ne partagez jamais ces clés
- Ne les commitez JAMAIS dans Git

---

## 📋 Checklist de configuration

### Development (Sandbox)

- [ ] Application OAuth créée sur Calendly en mode **Sandbox**
- [ ] Variables ajoutées dans backend `.env.development`
- [ ] Clé de chiffrement générée et ajoutée
- [ ] Frontend `.env.development` mis à jour avec Client ID sandbox
- [ ] Redirect URI configuré : `https://velvena.fr/auth/calendly/callback`
- [ ] Test de connexion OAuth réussi
- [ ] Vérification que les événements Calendly sandbox sont récupérés

### Production

- [ ] Application OAuth créée sur Calendly en mode **Production**
- [ ] Variables ajoutées dans backend `.env.production`
- [ ] Clé de chiffrement différente générée pour prod
- [ ] Frontend `.env.production` créé avec Client ID production
- [ ] Redirect URI configuré : `https://velvena.fr/auth/calendly/callback`
- [ ] Déploiement en production
- [ ] Test de connexion OAuth réussi en prod
- [ ] Vérification que les vrais événements Calendly sont récupérés

---

## 🔄 Différences Sandbox vs Production

| Aspect | Sandbox (Dev) | Production |
|--------|---------------|------------|
| **Données** | Données de test isolées | Vraies données utilisateurs |
| **Événements** | Événements de test uniquement | Vrais événements clients |
| **Prospects** | Prospects de test créés | Vrais prospects créés |
| **Impact** | Aucun impact sur production | Affecte les vrais utilisateurs |
| **Credentials** | Client ID/Secret sandbox | Client ID/Secret production |

**Recommandation :**
1. Développez et testez en **sandbox** d'abord
2. Une fois que tout fonctionne, créez l'app **production**
3. Déployez en production avec les credentials production

---

## 📝 Notes importantes

### Sécurité
- ⚠️ **NE JAMAIS** commiter ce fichier dans Git (déjà dans `.gitignore`)
- ⚠️ Les tokens OAuth doivent être **chiffrés** avant d'être stockés en base de données
- ✅ Utiliser HTTPS uniquement
- ✅ Valider le paramètre `state` pour éviter les attaques CSRF
- ✅ Utiliser des clés de chiffrement différentes pour dev et prod

### Configuration Calendly

Dans votre dashboard Calendly (https://calendly.com/integrations/api_webhooks) :

- Vous devez avoir **2 applications OAuth** :
  1. `Velvena Development` (Sandbox)
  2. `Velvena Production` (Production)

- Le **Redirect URI** doit être **exactement** le même dans les deux :
  ```
  https://velvena.fr/auth/calendly/callback
  ```

---

## 🔗 Référence

Consultez le fichier `CALENDLY_OAUTH_BACKEND.md` pour l'implémentation complète du backend.

---

## ✅ Frontend déjà configuré

### Development
Le Client ID sandbox est déjà configuré dans :
- `/Users/johnkennabii/Documents/velvena-app/.env.development`

### Production
À créer plus tard dans :
- `/Users/johnkennabii/Documents/velvena-app/.env.production`
