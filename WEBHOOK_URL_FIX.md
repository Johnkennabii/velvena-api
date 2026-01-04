# Fix Webhook URL - Création Instantanée des Prospects Calendly

## Le Problème que vous avez signalé
"quand je créé ça ne récupère pas instantanément" - Les prospects ne sont pas créés instantanément lors d'un nouveau rendez-vous Calendly.

## La Cause Racine (BUG CRITIQUE Identifié) 🐛

Le code utilisait la **mauvaise variable d'environnement** pour l'URL du webhook:

```typescript
// ❌ AVANT (INCORRECT)
const webhookUrl = `${process.env.APP_URL}/api/calendly/webhook`;
// Résultat: http://localhost:4173/api/calendly/webhook (URL du FRONTEND!)

// ✅ APRÈS (CORRECT)
const webhookUrl = `${process.env.API_URL}/calendly/webhook`;
// Résultat: https://api.velvena.fr/calendly/webhook (URL du BACKEND!)
```

**Conséquence**: Calendly envoyait les webhooks vers le frontend au lieu du backend, donc aucun webhook n'était jamais reçu par le serveur.

## La Solution - 3 Étapes Simples

### Étape 1: Déployer le code corrigé sur le VPS

Sur le VPS, exécutez:

```bash
cd /root/velvena
./scripts/fix-webhook-url.sh
```

Ce script va:
1. Récupérer le code corrigé depuis Git
2. Redémarrer le conteneur backend
3. Afficher les logs récents

### Étape 2: Reconnecter Calendly ⚠️ CRITIQUE

**IMPORTANT**: L'ancien webhook utilise toujours la mauvaise URL. Vous DEVEZ le recréer:

1. Aller sur https://app.velvena.fr
2. Aller dans **Paramètres > Intégrations**
3. **Déconnecter** Calendly (supprime l'ancien webhook)
4. **Reconnecter** Calendly (crée un nouveau webhook avec la bonne URL)

### Étape 3: Tester

1. Créer un nouveau rendez-vous Calendly depuis votre lien public
2. Le prospect devrait apparaître **instantanément** dans l'interface
3. Vérifier les logs:

```bash
docker logs -f velvena-api | grep -E 'webhook|📥|✅'
```

Logs attendus:
```
✅ Calendly webhook signature verified
📥 Received Calendly webhook - FULL DETAILS
✅ Successfully processed invitee.created webhook
🟢 Socket.IO: Emitting prospect:created to org:...
```

## Changements Techniques Appliqués

### 1. Fix Webhook URL (src/controllers/calendlyController.ts:98)
- Changé `APP_URL` → `API_URL`
- Supprimé le préfixe `/api` incorrect
- URL correcte: `https://api.velvena.fr/calendly/webhook`

### 2. Logging Amélioré (src/controllers/calendlyController.ts:373-378)
Ajouté des logs détaillés pour déboguer les webhooks:
```typescript
logger.info({
  eventType: event.event,
  payload: event.payload,
  createdAt: event.created_at,
  fullEventKeys: Object.keys(event)
}, "📥 Received Calendly webhook - FULL DETAILS");
```

### 3. Meilleurs Messages de Succès
Ajouté des informations contextuelles dans les logs de succès:
```typescript
logger.info({
  inviteeEmail: payload.email,
  eventStartTime: payload.event?.start_time
}, "✅ Successfully processed invitee.created webhook");
```

## Vérification Rapide

Après avoir déployé et reconnecté Calendly, vérifiez dans la base de données:

```bash
docker exec -it velvena-postgres psql -U velvena_user -d velvena_db -c \
  "SELECT webhook_active, webhook_subscription_uri FROM \"CalendlyIntegration\" WHERE is_active = true;"
```

Vous devriez voir:
- `webhook_active` = `t` (true)
- `webhook_subscription_uri` = `https://api.calendly.com/webhook_subscriptions/...`

## Support

Si après ces étapes les webhooks ne fonctionnent toujours pas:

1. Vérifiez les logs backend: `docker logs --tail=100 velvena-api | grep webhook`
2. Vérifiez les variables d'environnement: `docker exec velvena-api printenv | grep -E "API_URL|CALENDLY"`
3. Consultez le guide complet: `WEBHOOK_DEPLOYMENT_GUIDE.md`

## Résumé

- ✅ Bug identifié: Mauvaise URL de webhook (frontend au lieu de backend)
- ✅ Code corrigé et committé
- ✅ Logging amélioré pour faciliter le débogage
- ⏳ Déploiement requis: Exécuter le script sur le VPS
- ⏳ Reconnexion requise: Déconnecter/reconnecter Calendly pour recréer le webhook
- ⏳ Test requis: Créer un nouveau RDV Calendly et vérifier la création instantanée

Une fois ces étapes complétées, les prospects devraient être créés **instantanément** lors de la création d'un nouveau rendez-vous Calendly.
