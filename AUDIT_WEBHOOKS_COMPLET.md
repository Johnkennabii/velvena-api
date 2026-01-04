# AUDIT COMPLET ET PROFESSIONNEL - SYSTÈME DE WEBHOOKS CALENDLY
## Velvena CRM - État des lieux détaillé

**Date de l'audit:** 4 janvier 2026  
**Codebase:** /Users/johnkennabii/Documents/velvena  
**Branche:** main  
**Dernier commit:** 15709a9 (fix: add ENCRYPTION_KEY environment variable)

---

## RÉSUMÉ EXÉCUTIF

### Le Problème Critique
Les prospects **NE SONT PAS** créés instantanément lors d'une nouvelle réservation Calendly. Le système repose sur une synchronisation manuelle ou par cron (toutes les 30 minutes) au lieu de webhooks temps réel.

### Cause Racine Identifiée
**DOUBLE BUG CRITIQUE - Incompatibilité majeure entre source et build:**

1. **Code source corrigé** (`src/controllers/calendlyController.ts:98`) 
   - Utilise `API_URL` avec le bon chemin
   - Génère: `https://api.velvena.fr/calendly/webhook` ✅

2. **Code compilé OBSOLÈTE** (`dist/src/controllers/calendlyController.js:62`)
   - Utilise toujours `APP_URL` avec `/api` incorrect
   - Génère: `http://localhost:3000/api/calendly/webhook` ❌

**RÉSULTAT:** Le conteneur Docker exécute le code compilé obsolète, pas le code source corrigé!

### Impact Direct
- Les webhooks Calendly ne sont **jamais reçus** par le backend
- Les prospects restent créés UNIQUEMENT via sync cron (30 minutes)
- L'error "Hook with this url already exists" persiste car l'ancien webhook ne peut pas être supprimé proprement

### Solution Requise
1. Recompiler le TypeScript avec le bon code source
2. Reconstruire l'image Docker
3. Redéployer et reconnecter Calendly

---

## PROBLÈMES IDENTIFIÉS (ordre de criticité)

### 🔴 PROBLÈME 1: Code Compilé Obsolète
**Criticité: CRITIQUE**  
**Fichiers concernés:**
- Source: `/Users/johnkennabii/Documents/velvena/src/controllers/calendlyController.ts:98`
- Compilé: `/Users/johnkennabii/Documents/velvena/dist/src/controllers/calendlyController.js:62`

**Description:**
Le code source a été CORRIGÉ mais le code compilé n'a pas été regénéré et redeployé en production.

**Code Source (CORRECT):**
```typescript
// src/controllers/calendlyController.ts:98
const webhookUrl = `${process.env.API_URL || "http://localhost:3000"}/calendly/webhook`;
// Résultat attendu: https://api.velvena.fr/calendly/webhook
```

**Code Compilé (INCORRECT - EN PRODUCTION):**
```javascript
// dist/src/controllers/calendlyController.js:62
const webhookUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/calendly/webhook`;
// Résultat réel: http://localhost:3000/api/calendly/webhook
```

**Impact:**
- Le webhook est créé avec l'URL INCORRECTE
- Calendly envoie les webhooks vers cette URL incorrecte
- L'endpoint `/api/calendly/webhook` n'existe PAS (le vrai endpoint est `/calendly/webhook`)
- Aucun webhook n'est jamais reçu par le backend
- Les prospects ne sont jamais créés instantanément

**Commandes de vérification:**
```bash
# Vérifier le code source
grep "webhookUrl =" src/controllers/calendlyController.ts
# Output: const webhookUrl = `${process.env.API_URL || "http://localhost:3000"}/calendly/webhook`;

# Vérifier le code compilé (EN PRODUCTION)
grep "webhookUrl =" dist/src/controllers/calendlyController.js
# Output: const webhookUrl = `${process.env.APP_URL || "http://localhost:3000"}/api/calendly/webhook`;
```

---

### 🔴 PROBLÈME 2: Webhook Subscription URI N'est Pas Récupéré Après Création
**Criticité: CRITIQUE**  
**Fichier:** `src/services/calendlyService.ts:603-654`

**Description:**
La fonction `createWebhookSubscription()` crée bien le webhook mais le champ `webhook_subscription_uri` n'est JAMAIS utilisé pour vérifier la suppression.

**Code Problématique (lignes 603-654):**
```typescript
export async function createWebhookSubscription(
  integrationId: string,
  webhookUrl: string
): Promise<string> {
  try {
    const client = await getCalendlyClient(integrationId);
    const integration = await prisma.calendlyIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get current user info to retrieve organization URI
    const userResponse = await client.get("/users/me");
    const organizationUri = userResponse.data.resource.current_organization;

    if (!organizationUri) {
      throw new Error("Organization URI not found in user response");
    }

    logger.info({ organizationUri }, "Creating webhook subscription for organization");

    const response = await client.post("/webhook_subscriptions", {
      url: webhookUrl,  // ← PROBLÈME: Utilise l'URL INCORRECTE du problème #1
      events: [
        "invitee.created",
        "invitee.canceled",
      ],
      organization: organizationUri,
      scope: "organization",
    });

    const subscriptionUri = response.data.resource.uri;  // ← Récupère l'URI

    // Update integration with webhook info
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        webhook_subscription_uri: subscriptionUri,  // ← Sauvegarde l'URI
        webhook_active: true,
      },
    });

    logger.info({ integrationId, subscriptionUri }, "Webhook subscription created");
    return subscriptionUri;
  } catch (error: any) {
    logger.error({ error: error.response?.data || error.message }, "Failed to create webhook subscription");
    throw new Error("Failed to create webhook subscription");
  }
}
```

**Le vrai problème:**
1. La URL envoyée à Calendly est INCORRECTE (APP_URL au lieu de API_URL)
2. Calendly crée un webhook avec cette mauvaise URL
3. Lors de la reconnexion, Calendly refuse de créer un nouveau webhook car il existe déjà un webhook avec la même URL
4. L'erreur "Hook with this url already exists" apparaît
5. Les tentatives de suppression échouent silencieusement car le webhook_subscription_uri stocké ne correspond pas à celui réel en Calendly

**Impact:**
- Impossible de reconnecter Calendly proprement
- L'ancien webhook persiste en Calendly
- Conflit lors de chaque tentative de reconnexion

---

### 🟠 PROBLÈME 3: Route Webhook Mal Montée dans Docker
**Criticité: MAJEUR**  
**Fichiers:**
- `src/server.ts:213-217` (définition correcte)
- `docker-compose.yml:119` (variable API_URL)

**Description:**
La route webhook est bien configurée en TypeScript:

```typescript
// src/server.ts:213-217
// ✅ Calendly Webhook route MUST come BEFORE express.json()
// Calendly needs raw body for signature verification
import { handleWebhook as calendlyWebhookHandler } from "./controllers/calendlyController.js";
app.post(
  "/calendly/webhook",
  express.raw({ type: "application/json" }),
  calendlyWebhookHandler
);
```

MAIS:
1. L'URL passée au webhook Calendly est INCORRECTE (voir problème #1)
2. La variable `API_URL` en docker-compose.yml pointe vers la bonne URL:
   ```yaml
   API_URL: ${API_URL:-https://api.velvena.fr}
   ```
3. Mais le code compilé n'utilise pas cette variable!

**Impact:**
- Même si la route existe, elle ne reçoit jamais de requêtes
- Car Calendly envoie les webhooks à la mauvaise URL

---

### 🟠 PROBLÈME 4: Webhook Signature Vérification Dépend d'une Variable Manquante
**Criticité: MAJEUR**  
**Fichier:** `src/controllers/calendlyController.ts:342-368`

**Description:**
Le code vérifie la signature HMAC du webhook, mais dépend de `CALENDLY_WEBHOOK_SIGNING_KEY`:

```typescript
// src/controllers/calendlyController.ts:350-362
const signature = req.headers["calendly-webhook-signature"];

// req.body is a Buffer when using express.raw()
const rawBody = req.body.toString('utf8');

// Verify webhook signature with raw body
if (signature && process.env.CALENDLY_WEBHOOK_SIGNING_KEY) {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.CALENDLY_WEBHOOK_SIGNING_KEY)
    .update(rawBody)
    .digest("base64");

  if (signature !== expectedSignature) {
    logger.warn({
      receivedSignature: signature,
      expectedSignature
    }, "Invalid Calendly webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  logger.info("✅ Calendly webhook signature verified");
} else {
  logger.warn("⚠️ No signature verification (missing key or signature)");
}
```

**Vérification en `.env`:**
```bash
# .env:58
CALENDLY_WEBHOOK_SIGNING_KEY=j0xTdQAKAehQKeHzwMAEb-Qqk4o8DUWhH8IehaXycoU
```

**Vérification en `docker-compose.yml`:**
```yaml
# docker-compose.yml:129
CALENDLY_WEBHOOK_SIGNING_KEY: ${CALENDLY_WEBHOOK_SIGNING_KEY}
```

**Problème:**
La clé est bien configurée, mais sans webhooks reçus, cette vérification n'est jamais testée. C'est un problème SECONDAIRE au problème #1.

**Impact:**
- La signature pourrait ne pas être vérifiée correctement
- Risque de sécurité mineur (webhooks non authentifiés)
- Masqué par le problème #1 (aucun webhook n'est jamais reçu)

---

### 🟠 PROBLÈME 5: Suppression du Webhook Non Ordonnée Lors de la Reconnexion
**Criticité: MAJEUR**  
**Fichier:** `src/controllers/calendlyController.ts:185-188`

**Description:**
Lors de la déconnexion, le code SUPPRIME le webhook APRÈS avoir marqué l'intégration comme inactive:

```typescript
// src/controllers/calendlyController.ts:185-198
export const disconnectIntegration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "No organization context" });
    }

    const integration = await prisma.calendlyIntegration.findFirst({
      where: {
        organization_id: req.user.organizationId,
        is_active: true,
      },
    });

    if (!integration) {
      return res.status(404).json({ error: "No active integration found" });
    }

    // Delete webhook subscription
    await deleteWebhookSubscription(integration.id).catch((err) => {
      logger.error({ err }, "Failed to delete webhook (non-blocking)");
    });

    // Soft delete integration
    await prisma.calendlyIntegration.update({
      where: { id: integration.id },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: req.user.id,
      },
    });
    // ... rest of code
  }
}
```

**Le problème:**
1. La suppression du webhook est en `.catch()` (non-blocking)
2. Si la suppression échoue, l'erreur est silencieusement ignorée (`.catch()`)
3. L'intégration est marquée inactive
4. A la reconnexion, la nouvelle création du webhook échoue avec "Hook with this url already exists"

**Problème plus grave:**
```typescript
// src/services/calendlyService.ts:659-686
export async function deleteWebhookSubscription(integrationId: string): Promise<void> {
  try {
    const integration = await prisma.calendlyIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.webhook_subscription_uri) {
      return;  // ← RETOUR SILENCIEUX si webhook_subscription_uri est NULL!
    }

    const client = await getCalendlyClient(integrationId);
    await client.delete(integration.webhook_subscription_uri);

    // Update integration
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        webhook_subscription_uri: null,
        webhook_active: false,
      },
    });

    logger.info({ integrationId }, "Webhook subscription deleted");
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to delete webhook subscription");
    throw new Error("Failed to delete webhook subscription");  // ← THROW non catchée
  }
}
```

**Cascade de problèmes:**
1. Le webhook n'est jamais créé avec la bonne URL (problème #1)
2. Donc `webhook_subscription_uri` reste NULL ou contient une mauvaise URI
3. A la déconnexion, le webhok est introuvable ou introuvable à Calendly
4. A la reconnexion, Calendly refuse de créer un nouveau webhook

**Impact:**
- Impossible de nettoyer les webhooks orphelins
- L'erreur "Hook with this url already exists" persiste

---

### 🟡 PROBLÈME 6: Pas de Vérification d'Existence du Webhook Avant Création
**Criticité: MAJEUR**  
**Fichier:** `src/services/calendlyService.ts:603-654`

**Description:**
La fonction `createWebhookSubscription()` ne vérifie PAS s'il existe déjà un webhook avant de créer un nouveau:

```typescript
// Devrait faire:
const existingWebhooks = await client.get("/webhook_subscriptions", {
  params: {
    organization: organizationUri,
    scope: "organization",
  },
});

const existingWebhook = existingWebhooks.data.collection.find(
  w => w.callback_url === webhookUrl
);

if (existingWebhook) {
  // Utiliser l'URI existant
  const subscriptionUri = existingWebhook.uri;
  await prisma.calendlyIntegration.update({
    where: { id: integrationId },
    data: {
      webhook_subscription_uri: subscriptionUri,
      webhook_active: true,
    },
  });
  return subscriptionUri;
}

// Créer seulement s'il n'existe pas
const response = await client.post("/webhook_subscriptions", {
  url: webhookUrl,
  events: ["invitee.created", "invitee.canceled"],
  organization: organizationUri,
  scope: "organization",
});
```

**Mais actuellement:**
```typescript
// Crée directement sans vérifier
const response = await client.post("/webhook_subscriptions", {
  url: webhookUrl,
  events: ["invitee.created", "invitee.canceled"],
  organization: organizationUri,
  scope: "organization",
});
```

**Impact:**
- Erreur "Hook with this url already exists" lors de la reconnexion
- L'ancien webhook orphelin n'est jamais récupéré ou supprimé
- La solution de contournement (récupération) existe dans `scripts/recover-calendly-webhook.sh` mais n'est pas automatisée

---

### 🟡 PROBLÈME 7: Variables d'Environnement Incohérentes
**Criticité: MAJEUR**  
**Fichiers:**
- `.env:45` - APP_URL défini
- `.env:59` - CALENDLY_REDIRECT_URI utilise localhost
- `docker-compose.yml:119-120` - API_URL et APP_URL
- Code source: conflit APP_URL vs API_URL

**Description:**
Les variables d'environnement sont définies dans `.env` mais:

1. `APP_URL` est configuré pour le frontend
   ```bash
   # .env:45
   APP_URL=http://127.0.0.1:4173  # ← Frontend URL
   ```

2. `CALENDLY_REDIRECT_URI` utilise une URL de développement
   ```bash
   # .env:59
   CALENDLY_REDIRECT_URI=http://localhost:5173/auth/calendly/callback  # ← DEV URL
   ```

3. En production, ce sont d'autres URLs
   ```yaml
   # docker-compose.yml:119-120
   API_URL: ${API_URL:-https://api.velvena.fr}  # ✅ Correct
   APP_URL: ${APP_URL:-http://localhost:4173}    # ❌ Frontend, pas correct pour webhooks
   ```

**Problème:**
- Le webhook ne doit JAMAIS utiliser `APP_URL` (frontend)
- Il doit TOUJOURS utiliser `API_URL` (backend)
- Mais le code compilé utilise `APP_URL`

**Impact:**
- Confusion entre les deux URLs
- Code compilé n'a pas accès à `API_URL`
- Webhook créé avec la mauvaise URL

---

### 🟡 PROBLÈME 8: Fonction de Suppression du Webhook Pas Robuste
**Criticité: MINEUR**  
**Fichier:** `src/services/calendlyService.ts:659-686`

**Description:**
La fonction `deleteWebhookSubscription()` lance une erreur non-catchée:

```typescript
export async function deleteWebhookSubscription(integrationId: string): Promise<void> {
  try {
    const integration = await prisma.calendlyIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.webhook_subscription_uri) {
      return;  // ← Retour silencieux
    }

    const client = await getCalendlyClient(integrationId);
    await client.delete(integration.webhook_subscription_uri);  // ← Peut échouer

    // Update integration
    await prisma.calendlyIntegration.update({
      where: { id: integrationId },
      data: {
        webhook_subscription_uri: null,
        webhook_active: false,
      },
    });

    logger.info({ integrationId }, "Webhook subscription deleted");
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to delete webhook subscription");
    throw new Error("Failed to delete webhook subscription");  // ← Lance l'erreur
  }
}
```

Appelée avec `.catch()`:
```typescript
// src/controllers/calendlyController.ts:186
await deleteWebhookSubscription(integration.id).catch((err) => {
  logger.error({ err }, "Failed to delete webhook (non-blocking)");
});
```

**Problème:**
- L'erreur est loggée et ignorée
- Si la suppression échoue, les données en BD ne sont pas mises à jour
- L'intégration reste marquée avec `webhook_active: false` mais `webhook_subscription_uri` n'est pas NULL

**Impact:**
- État incohérent en base de données
- Impossible de synchroniser l'état réel du webhook Calendly

---

### 🟡 PROBLÈME 9: Pas de Synchronisation du Webhook Créé Lors de OAuth Callback
**Criticité: MINEUR**  
**Fichier:** `src/controllers/calendlyController.ts:98-101`

**Description:**
La création du webhook dans `oauthCallback()` n'attend pas le résultat:

```typescript
// src/controllers/calendlyController.ts:98-101
// Create webhook subscription asynchronously
const webhookUrl = `${process.env.API_URL || "http://localhost:3000"}/calendly/webhook`;
createWebhookSubscription(integration.id, webhookUrl).catch((err) => {
  logger.error({ err, integrationId: integration.id }, "Failed to create webhook (non-blocking)");
});
```

**Problème:**
- Le webhook est créé en arrière-plan (asynchrone)
- Si la création échoue, l'utilisateur ne le sait pas
- Le frontend croit que tout a fonctionné

**Impact:**
- L'utilisateur connecte Calendly avec succès
- Mais le webhook n'est jamais créé (ou échoue silencieusement)
- Les prospects ne sont jamais créés instantanément
- L'utilisateur ne sait pas pourquoi

---

## ANALYSE DE LA CHAÎNE D'ÉVÉNEMENTS

### ❌ Ce Qui Se Passe Actuellement (INCORRECT)

#### 1. Connexion Calendly OAuth
```
Frontend → Redirect Calendly Auth
    ↓
Calendly OAuth Flow
    ↓
Frontend callback → Backend POST /auth/calendly/callback
    ↓
Backend:
  - Échange code pour tokens ✅
  - Récupère infos utilisateur ✅
  - Sauvegarde dans CalendlyIntegration ✅
  - Déclenche syncCalendlyEvents() ✅
  - Déclenche createWebhookSubscription() ↓
    
  createWebhookSubscription():
    - Récupère access token ✅
    - Récupère organization URI ✅
    - POST /webhook_subscriptions avec:
      - url: `http://localhost:3000/api/calendly/webhook` ❌ MAUVAISE URL
      - events: ["invitee.created", "invitee.canceled"] ✅
      - organization: organizationUri ✅
    - Calendly crée le webhook avec MAUVAISE URL ❌
    - Sauvegarde webhook_subscription_uri en BD ✅
    
Frontend:
  - Reçoit 200 OK ✅
  - Affiche "Calendly connecté" ✅
```

#### 2. Nouvelle Réservation Calendly
```
Utilisateur crée RDV sur calendly.com
    ↓
Calendly déclenche webhook POST
    ↓
POST http://localhost:3000/api/calendly/webhook
    ↓
❌ ERREUR: Route n'existe pas
❌ Le backend n'a JAMAIS reçu le webhook
❌ Aucun prospect créé
```

#### 3. Synchronisation Cron (Fallback)
```
Job exécuté toutes les 30 minutes
    ↓
syncCalendlyEvents() s'exécute
    ↓
Récupère les événements de l'API Calendly ✅
    ↓
Crée les prospects manuellement ✅
    ↓
Les prospects apparaissent finalement (avec 30 min de délai)
```

#### 4. Déconnexion Calendly
```
Frontend → POST /calendly/disconnect
    ↓
Backend:
  - Trouve l'intégration ✅
  - Appelle deleteWebhookSubscription() (non-blocking) ↓
    
  deleteWebhookSubscription():
    - Tente de supprimer le webhook Calendly
    - ❌ Impossible: webhook_subscription_uri ne correspond pas au vrai URI
    - ❌ Le webhook réel persiste chez Calendly
    
  - Marque intégration is_active = false ✅
```

#### 5. Reconnexion Calendly (Après Déploiement)
```
Frontend → POST /auth/calendly/callback avec nouveau code
    ↓
Backend:
  - Échange code pour tokens ✅
  - Crée/update CalendlyIntegration ✅
  - Déclenche createWebhookSubscription() ↓
    
  createWebhookSubscription():
    - Récupère access token ✅
    - POST /webhook_subscriptions avec MAUVAISE URL
    ↓
❌ ERREUR Calendly: "Hook with this url already exists"
❌ Ancien webhook (avec mauvaise URL) persiste
❌ Nouveau webhook n'est pas créé
❌ La reconnexion échoue
```

### ✅ Ce Qui Devrait Se Passer (CORRECT)

```
1. Connexion OAuth
   - createWebhookSubscription() envoie BONNE URL
   - URL: https://api.velvena.fr/calendly/webhook
   - Calendly crée le webhook correctement

2. Nouvelle Réservation
   - Calendly envoie webhook POST à BONNE URL
   - Backend reçoit le webhook ✅
   - Signature vérifiée ✅
   - Prospect créé instantanément ✅
   - Socket.IO émet event prospect:created ✅
   - Frontend affiche le prospect en temps réel ✅

3. Déconnexion
   - deleteWebhookSubscription() supprime le webhook réel ✅
   - webhook_subscription_uri = NULL ✅
   - webhook_active = false ✅

4. Reconnexion
   - createWebhookSubscription() crée NOUVEAU webhook
   - Avec BONNE URL
   - Aucun conflit ✅
```

---

## PLAN DE CORRECTION (Ordre d'Exécution)

### Étape 1: Recompilation du TypeScript
**Pourquoi:** Le code compilé est obsolète et contient le bug  
**Où:** Local (sur votre machine)  
**Commandes:**
```bash
cd /Users/johnkennabii/Documents/velvena

# Nettoyer le dist existant
rm -rf dist/

# Recompiler le TypeScript
npm run build

# Vérifier que le code compilé est correct
grep "API_URL\|APP_URL" dist/src/controllers/calendlyController.js
# Doit afficher: process.env.API_URL (pas APP_URL)
```

**Validation:**
```bash
grep -A 2 "webhookUrl =" dist/src/controllers/calendlyController.js
# Doit afficher:
# const webhookUrl = `${process.env.API_URL || "http://localhost:3000"}/calendly/webhook`;
```

---

### Étape 2: Reconstruire l'Image Docker
**Pourquoi:** Inclure le code compilé correct  
**Où:** Local (sur votre machine)  
**Commandes:**
```bash
cd /Users/johnkennabii/Documents/velvena

# Reconstruire l'image (avec cache busting)
docker build --no-cache -t velvena-api:latest .

# Vérifier la compilation
docker run --rm velvena-api:latest cat dist/src/controllers/calendlyController.js | grep "webhookUrl"
# Doit montrer API_URL
```

---

### Étape 3: Déployer sur le VPS
**Pourquoi:** Mettre à jour l'image en production  
**Où:** VPS production  
**Commandes:**
```bash
# SSH sur le VPS
ssh root@votre-vps-ip

cd /root/velvena

# Récupérer le dernier code
git fetch origin
git pull origin main

# Recompiler localement ou pusher l'image
docker build --no-cache -t velvena-api:latest .

# Redémarrer le conteneur
docker-compose down velvena-api
docker-compose up -d velvena-api

# Attendre le démarrage (30-60 secondes)
sleep 60

# Vérifier les logs
docker logs -f velvena-api | grep -E "webhook|📥|✅"
```

---

### Étape 4: Nettoyer les Webhooks Orphelins (AVANT Reconnexion)
**Pourquoi:** Supprimer l'ancien webhook avec la mauvaise URL  
**Où:** VPS  
**Commandes:**
```bash
# Récupérer les webhooks orphelins
cd /root/velvena
./scripts/recover-calendly-webhook.sh

# Doit afficher:
# - Webhooks existants avec les bonnes URLs
# - Ou alerter s'il y a des webhooks orphelins

# Si webhooks orphelins trouvés, exécuter:
./scripts/list-calendly-webhooks.js

# Et supprimer manuellement via API Calendly si nécessaire
```

---

### Étape 5: Reconnecter Calendly (Déclencheur Final)
**Pourquoi:** Créer un NOUVEAU webhook avec la bonne URL  
**Où:** Interface frontend https://app.velvena.fr  
**Étapes:**

1. Aller à Paramètres > Intégrations
2. Cliquer "Déconnecter Calendly"
   - Devrait supprimer le webhook en BD
   - Attend 5 secondes
3. Cliquer "Connecter Calendly"
4. Valider l'accès Calendly
5. Redirection vers /auth/calendly/callback
6. Message "Calendly connecté avec succès"

---

### Étape 6: Vérifications et Tests
**Commandes de vérification:**

```bash
# 1. Vérifier l'intégration en BD
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db << 'SQL'
SELECT 
  id,
  calendly_user_uri,
  webhook_active,
  webhook_subscription_uri
FROM "CalendlyIntegration"
WHERE is_active = true;
SQL

# Attendu:
# - webhook_active = true
# - webhook_subscription_uri = https://api.calendly.com/webhook_subscriptions/...

# 2. Vérifier les logs du webhook reçu
docker logs -f velvena-api | grep -E "webhook|📥|✅|Successfully processed"

# 3. Créer un test de rendez-vous
# - Aller sur votre lien Calendly public
# - Créer un nouveau rendez-vous
# - Attendre 5 secondes

# 4. Vérifier le prospect créé
curl -X GET http://localhost:3000/api/prospects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Attendu: Le nouveau prospect avec source: "calendly"
```

**Logs attendus après création d'un nouveau RDV:**
```
✅ Calendly webhook signature verified
📥 Received Calendly webhook - FULL DETAILS
  eventType: "invitee.created"
  payload: { email: "test@example.com", name: "Test User", event: {...} }
✅ Successfully processed invitee.created webhook
  inviteeEmail: "test@example.com"
  eventStartTime: "2026-01-04T15:00:00.000Z"
🟢 Socket.IO: Emitting prospect:created to org:...
```

---

### Étape 7: Problèmes Secondaires à Corriger
**Après que les webhooks fonctionnent:**

#### 7.1: Améliorer Gestion d'Erreur `createWebhookSubscription()`
**Fichier:** `src/services/calendlyService.ts:603-654`

Ajouter avant de créer le webhook:
```typescript
// Vérifier si webhook existe déjà
const existingWebhooks = await client.get("/webhook_subscriptions", {
  params: {
    organization: organizationUri,
    scope: "organization",
  },
});

const existingWebhook = existingWebhooks.data.collection.find(
  w => w.callback_url === webhookUrl && w.state === "active"
);

if (existingWebhook) {
  logger.info(
    { integrationId, webhookUri: existingWebhook.uri },
    "Webhook already exists, reusing"
  );
  
  await prisma.calendlyIntegration.update({
    where: { id: integrationId },
    data: {
      webhook_subscription_uri: existingWebhook.uri,
      webhook_active: true,
    },
  });
  
  return existingWebhook.uri;
}
```

#### 7.2: Rendre `deleteWebhookSubscription()` Synchrone
**Fichier:** `src/controllers/calendlyController.ts:186-188`

Changer de:
```typescript
await deleteWebhookSubscription(integration.id).catch((err) => {
  logger.error({ err }, "Failed to delete webhook (non-blocking)");
});
```

À:
```typescript
try {
  await deleteWebhookSubscription(integration.id);
} catch (err: any) {
  logger.warn({ err: err.message }, "Failed to delete webhook subscription");
  // Continuer malgré tout - le webhook sera orphelin mais non-bloquant
}
```

#### 7.3: Améliorer Variables d'Environnement
**Fichier:** `.env` et `docker-compose.yml`

Clarifier que:
- `API_URL` = URL du backend (utilisée pour webhooks)
- `APP_URL` = URL du frontend (utilisée pour liens email, etc.)

En `.env`:
```bash
# Backend API URL (pour webhooks)
API_URL=https://api.velvena.fr

# Frontend App URL (pour liens email)
APP_URL=https://app.velvena.fr
```

En `docker-compose.yml`:
```yaml
environment:
  # ... autres variables ...
  API_URL: ${API_URL:-https://api.velvena.fr}
  APP_URL: ${APP_URL:-https://app.velvena.fr}
```

---

## ARCHITECTURE CORRECTE RÉSUMÉE

```
┌─────────────────────────────────────────────────────────────┐
│                    CALENDLY WEBHOOKS FLOW                    │
└─────────────────────────────────────────────────────────────┘

1. OAUTH CONNEXION
   ┌─────────────────────────────────────────────────────────┐
   │ Frontend → Calendly Auth → Callback Backend             │
   │ Backend stores tokens & creates webhook:                 │
   │   URL: ${API_URL}/calendly/webhook                      │
   │   Events: invitee.created, invitee.canceled             │
   └─────────────────────────────────────────────────────────┘

2. WEBHOOK REÇU
   ┌─────────────────────────────────────────────────────────┐
   │ POST https://api.velvena.fr/calendly/webhook            │
   │ (via express.raw() middleware en src/server.ts:213)     │
   │ ↓                                                         │
   │ Vérify signature (HMAC-SHA256)                           │
   │ ↓                                                         │
   │ Parse JSON                                               │
   │ ↓                                                         │
   │ processWebhookEvent() → syncCalendlyEvent()             │
   │ ↓                                                         │
   │ createProspectFromCalendlyEvent()                       │
   │ ↓                                                         │
   │ emitProspectCreated() → Socket.IO                       │
   │ ↓                                                         │
   │ Frontend reçoit event en temps réel                      │
   └─────────────────────────────────────────────────────────┘

3. FALLBACK SYNC (Toutes les 30 minutes)
   ┌─────────────────────────────────────────────────────────┐
   │ Cron job → syncCalendlyEvents()                          │
   │ API polling (récupère les 100 derniers événements)      │
   │ Crée prospects pour événements non liés                  │
   └─────────────────────────────────────────────────────────┘

4. DÉCONNEXION
   ┌─────────────────────────────────────────────────────────┐
   │ Frontend → POST /calendly/disconnect                    │
   │ ↓                                                         │
   │ deleteWebhookSubscription() supprime de Calendly        │
   │ ↓                                                         │
   │ Marquer intégration is_active = false                   │
   │ ↓                                                         │
   │ Mettre à jour Organization.settings.calendly            │
   └─────────────────────────────────────────────────────────┘
```

---

## CHECKLIST FINAL DE DÉPLOIEMENT

### Avant Déploiement
- [ ] Code source corrigé (API_URL au lieu de APP_URL)
- [ ] Recompilation exécutée (`npm run build`)
- [ ] Dist vérifié pour avoir le bon code
- [ ] Nouvelle image Docker construite
- [ ] Variables d'environnement vérifiées

### Pendant Déploiement
- [ ] Conteneur backend redémarré
- [ ] Logs vérifiés pour erreurs
- [ ] DB intacte (pas de migration nécessaire)
- [ ] Routes vérifiées (GET /health retourne 200)

### Après Déploiement
- [ ] Calendly reconnecté via frontend
- [ ] Nouveau webhook créé en BD
- [ ] webhook_subscription_uri non-NULL
- [ ] webhook_active = true
- [ ] Test de création RDV Calendly
- [ ] Logs affichent webhook reçu
- [ ] Prospect créé instantanément
- [ ] Socket.IO événement reçu
- [ ] Frontend mis à jour en temps réel

---

## RESSOURCES ET DOCUMENTATION

### Scripts Utiles
- `/scripts/recover-calendly-webhook.sh` - Récupère webhooks orphelins
- `/scripts/list-calendly-webhooks.js` - Liste webhooks Calendly
- `/scripts/test-calendly-manual.sh` - Test manual webhook

### Documentation
- `WEBHOOK_URL_FIX.md` - Fix appliqué (à jour)
- `WEBHOOK_DEPLOYMENT_GUIDE.md` - Guide complet (à mettre à jour)
- `CALENDLY_INTEGRATION_COMPLETE.md` - Architecture générale

### Fichiers Critiques
- `src/controllers/calendlyController.ts` - Handlers HTTP
- `src/services/calendlyService.ts` - Logique métier
- `src/server.ts:213-217` - Route webhook
- `docker-compose.yml:119-131` - Variables env
- `prisma/schema.prisma` - DB schema

---

**AUDIT TERMINÉ - Prêt pour implémentation des corrections**
