# Calendly Webhook Deployment Guide

## Problem
Les prospects sont créés uniquement lors de la déconnexion/reconnexion de Calendly (sync complète), mais pas instantanément lors de la création d'un nouveau rendez-vous Calendly.

## Root Cause Identified ✅
**CRITICAL BUG**: Le webhook URL utilisait `APP_URL` (frontend) au lieu de `API_URL` (backend), ce qui envoyait les webhooks Calendly vers la mauvaise URL:
- ❌ Ancienne URL incorrecte: `http://localhost:4173/api/calendly/webhook` (frontend)
- ✅ Nouvelle URL correcte: `https://api.velvena.fr/calendly/webhook` (backend)

Le webhook n'était donc jamais reçu par le backend, empêchant la création instantanée des prospects.

## Solution

### Étape 1: Déployer le code mis à jour sur le VPS

```bash
# SSH sur le VPS
ssh root@votre-vps-ip

# Exécuter le script de déploiement
cd /root/velvena
./scripts/deploy-webhook-fix.sh
```

Le script va:
1. ✅ Récupérer le dernier code depuis git
2. ✅ Redémarrer le conteneur backend
3. ✅ Afficher les logs récents

### Étape 2: Reconnecter Calendly ⚠️ CRITIQUE

**IMPORTANT**: Il est ABSOLUMENT NÉCESSAIRE de déconnecter et reconnecter Calendly pour recréer le webhook avec la bonne URL!

1. Aller sur l'interface frontend (https://app.velvena.fr)
2. Aller dans **Paramètres > Intégrations**
3. **Déconnecter** Calendly (ceci va supprimer l'ancien webhook avec la mauvaise URL)
4. **Reconnecter** Calendly (ceci va créer un nouveau webhook avec la bonne URL: `https://api.velvena.fr/calendly/webhook`)

Cette reconnexion va déclencher la création du webhook avec la bonne URL backend.

### Étape 3: Vérifier la configuration

```bash
# Sur le VPS
./scripts/verify-webhook.sh
```

Vous devriez voir:
```
✅ Webhook is active
✅ Webhook URI: https://api.calendly.com/webhook_subscriptions/...
```

### Étape 4: Tester en temps réel

1. **Créer un nouveau rendez-vous Calendly** depuis le lien Calendly public
2. **Vérifier les logs backend** pour voir le webhook reçu:
   ```bash
   docker logs -f velvena-api | grep -E "webhook|Calendly"
   ```

3. **Vérifier dans l'interface frontend** que le prospect apparaît instantanément

Vous devriez voir dans les logs:
```
✅ Calendly webhook signature verified
📥 Received Calendly webhook - FULL DETAILS
   eventType: "invitee.created"
   payload: { email: "...", name: "...", event: {...} }
✅ Successfully processed invitee.created webhook
   inviteeEmail: "..."
   eventStartTime: "..."
🟢 Socket.IO: Emitting prospect:created to org:...
```

## Vérifications manuelles

### Vérifier la base de données

```bash
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db
```

```sql
-- Vérifier le webhook
SELECT
  id,
  webhook_active,
  webhook_subscription_uri,
  last_synced_at
FROM "CalendlyIntegration"
WHERE is_active = true;
```

Attendu:
- `webhook_active` = `t` (true)
- `webhook_subscription_uri` = `https://api.calendly.com/webhook_subscriptions/...`

### Vérifier les événements Calendly

```sql
-- Voir les derniers événements
SELECT
  event_name,
  invitee_email,
  event_start_time,
  created_at
FROM "CalendlyEvent"
ORDER BY created_at DESC
LIMIT 5;
```

### Surveiller les logs en temps réel

```bash
# Logs complets
docker logs -f velvena-api

# Logs filtrés pour Calendly
docker logs -f velvena-api | grep -E "webhook|Calendly|organization"

# Logs filtrés pour Socket.IO
docker logs -f velvena-api | grep -E "Socket.IO|prospect:created"
```

## Flux de données complet

```
1. Nouveau RDV Calendly créé
   ↓
2. Calendly envoie webhook POST à https://api.velvena.fr/calendly/webhook
   ↓
3. Backend vérifie la signature HMAC-SHA256
   ↓
4. processWebhookEvent() traite l'événement
   ↓
5. syncCalendlyEvent() crée/met à jour CalendlyEvent
   ↓
6. createProspectFromCalendlyEvent() crée le Prospect
   ↓
7. Socket.IO émet "prospect:created" à la room org:${organizationId}
   ↓
8. Frontend reçoit l'événement en temps réel et met à jour l'UI
```

## Dépannage

### Le webhook n'est toujours pas actif après déploiement

```bash
# Vérifier les logs pour voir l'erreur
docker logs --tail=200 velvena-api | grep -A 5 "webhook"

# Vérifier que la variable d'environnement est bien définie
docker exec velvena-api printenv | grep CALENDLY

# Redémarrer le conteneur
docker restart velvena-api
```

### Erreur "Resource Not Found" lors de la création du webhook

Cette erreur devrait être corrigée avec le nouveau code qui récupère l'organization URI depuis l'API Calendly (`GET /users/me`) au lieu de faire un remplacement de string.

Si l'erreur persiste:
1. Vérifier que le code a bien été mis à jour dans le conteneur
2. Vérifier les logs pour voir l'organization URI utilisé
3. Tester manuellement avec `curl` pour vérifier l'accès à l'API Calendly

### Le webhook est créé mais les événements ne sont pas reçus

1. **Vérifier que le webhook est accessible depuis Internet:**
   ```bash
   curl -X POST https://api.velvena.fr/calendly/webhook \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

2. **Vérifier la configuration nginx** pour s'assurer que `/calendly/webhook` est bien proxifié vers le backend

3. **Vérifier les logs Calendly:** Aller sur https://calendly.com/integrations/webhooks et vérifier l'historique des webhooks

### Les prospects sont créés mais pas affichés en temps réel

1. **Vérifier Socket.IO:**
   ```bash
   docker logs -f velvena-api | grep "Socket.IO"
   ```

2. **Vérifier la connexion frontend:** Ouvrir la console du navigateur et vérifier que le Socket.IO est connecté

3. **Vérifier que le frontend écoute l'événement `prospect:created`**

## Variables d'environnement requises

Dans le fichier `.env`:

```bash
# Calendly OAuth
CALENDLY_CLIENT_ID=your_client_id
CALENDLY_CLIENT_SECRET=your_client_secret
CALENDLY_REDIRECT_URI=https://app.velvena.fr/auth/calendly/callback

# Calendly Webhook
CALENDLY_WEBHOOK_SIGNING_KEY=your_signing_key

# Calendly Environment
CALENDLY_ENVIRONMENT=production

# API URL for webhook callback
API_URL=https://api.velvena.fr
```

## Commandes utiles

```bash
# Redémarrer le backend
docker restart velvena-api

# Voir les logs en temps réel
docker logs -f velvena-api

# Vérifier le statut des conteneurs
docker ps

# Se connecter à la base de données
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db

# Voir les variables d'environnement
docker exec velvena-api printenv | grep CALENDLY
```

## Ressources

- [Documentation Calendly Webhooks](https://developer.calendly.com/api-docs/docs/webhooks-overview)
- [Documentation Calendly OAuth](https://developer.calendly.com/api-docs/docs/getting-started-with-oauth)
- Code source: `src/services/calendlyService.ts`
- Contrôleur: `src/controllers/calendlyController.ts`
- Routes: `src/routes/calendly.ts`
- Serveur: `src/server.ts` (ligne 213-217 pour le webhook)
