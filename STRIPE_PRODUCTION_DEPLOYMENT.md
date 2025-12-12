# Guide de Déploiement Stripe en Production

Ce guide explique comment déployer Stripe en production sur votre VPS.

## Prérequis

- ✅ VPS configuré avec l'application déployée sur `https://api.velvena.fr`
- ✅ Compte Stripe créé et vérifié
- ✅ Accès SSH au VPS
- ✅ Base de données de production configurée

## Étape 1 : Activer le Mode Production sur Stripe

### 1.1 Vérifier votre compte Stripe

1. Allez sur https://dashboard.stripe.com
2. Cliquez sur "Activate your account" dans la bannière en haut
3. Remplissez les informations demandées :
   - Informations sur l'entreprise (Velvena)
   - Informations bancaires (pour recevoir les paiements)
   - Informations fiscales

**Important** : Tant que le compte n'est pas activé, vous ne pourrez pas accepter de vrais paiements.

### 1.2 Récupérer les clés de production

1. Allez sur https://dashboard.stripe.com/apikeys
2. Assurez-vous que le toggle est sur **"Live mode"** (pas "Test mode")
3. Copiez les clés suivantes :

```
Publishable key: pk_live_51...
Secret key: sk_live_51...
```

**⚠️ IMPORTANT** :
- Ne partagez **JAMAIS** votre `Secret key` publiquement
- Ne la commitez **JAMAIS** dans Git
- Conservez-la de manière sécurisée

## Étape 2 : Configurer le Webhook en Production

### 2.1 Créer un endpoint webhook

1. Allez sur https://dashboard.stripe.com/webhooks
2. Assurez-vous d'être en **"Live mode"**
3. Cliquez sur **"Add endpoint"**
4. Remplissez les informations :

**Endpoint URL** :
```
https://api.velvena.fr/webhooks/stripe
```

**Description** :
```
Production webhook for Velvena subscription management
```

**Events to send** - Sélectionnez les événements suivants :
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.payment_action_required`

Ou cliquez sur **"Select all customer events"** puis **"Select all invoice events"**

5. Cliquez sur **"Add endpoint"**

### 2.2 Récupérer le Webhook Secret

1. Après avoir créé le webhook, cliquez dessus dans la liste
2. Dans la section **"Signing secret"**, cliquez sur **"Reveal"**
3. Copiez le secret (commence par `whsec_`)

```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Étape 3 : Configurer les Variables d'Environnement en Production

### 3.1 Se connecter au VPS

```bash
ssh user@your-vps-ip
cd /path/to/velvena
```

### 3.2 Mettre à jour le fichier `.env`

```bash
nano .env.production
```

Ajoutez ou mettez à jour les variables Stripe :

```bash
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_51ScqFKRJ7PlLrfUP...
STRIPE_PUBLISHABLE_KEY=pk_live_51ScqFKRJ7PlLrfUP...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URLs de redirection (production)
STRIPE_SUCCESS_URL=https://velvena.fr/subscription/success
STRIPE_CANCEL_URL=https://velvena.fr/pricing
```

**⚠️ Vérifiez bien que vous utilisez les clés LIVE (pk_live_ et sk_live_), pas les clés TEST (pk_test_ et sk_test_)**

### 3.3 Sécuriser le fichier `.env`

```bash
# Restreindre les permissions
chmod 600 .env.production

# Vérifier que .env est dans .gitignore
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.local" >> .gitignore
```

## Étape 4 : Synchroniser les Plans avec Stripe

### 4.1 Vérifier les plans dans la base de données

Connectez-vous à votre base de données et vérifiez les plans :

```bash
# Via Prisma Studio (en local avec tunnel SSH)
npx prisma studio

# Ou directement en SQL sur le VPS
psql -U velvena -d velvena_db
SELECT id, code, name, price_monthly, price_yearly FROM "SubscriptionPlan";
```

Vous devriez avoir :
- Free (gratuit)
- Pro (99€/mois)
- Enterprise (sur devis)

### 4.2 Exécuter la synchronisation

Sur le VPS, exécutez :

```bash
# Charger les variables d'environnement
export $(cat .env.production | xargs)

# Synchroniser les plans vers Stripe
npm run stripe:sync
```

**Sortie attendue** :
```
✅ Environment variables loaded successfully
🔑 Stripe secret key: sk_live_51ScqFKRJ7P...

📦 Synchronizing subscription plans to Stripe...

✅ Plan 'pro' synced successfully
   Stripe Product ID: prod_xxxxx
   Monthly Price ID: price_xxxxx
   Yearly Price ID: price_xxxxx

✅ Plan 'enterprise' synced successfully
   Stripe Product ID: prod_yyyyy
   Monthly Price ID: price_yyyyy
   Yearly Price ID: price_yyyyy

🎉 Successfully synced 2 plans to Stripe
```

### 4.3 Vérifier dans Stripe Dashboard

1. Allez sur https://dashboard.stripe.com/products
2. Assurez-vous d'être en **"Live mode"**
3. Vous devriez voir vos produits :
   - **Velvena Pro** avec 2 prix (monthly et yearly)
   - **Velvena Enterprise** avec 2 prix (monthly et yearly)

## Étape 5 : Redémarrer l'Application

### 5.1 Rebuild l'application

```bash
# Sur le VPS
cd /path/to/velvena

# Rebuild avec les nouvelles variables
npm run build
```

### 5.2 Redémarrer le service

**Avec PM2** :
```bash
pm2 restart velvena-api
pm2 logs velvena-api
```

**Avec systemd** :
```bash
sudo systemctl restart velvena-api
sudo systemctl status velvena-api
```

**Avec Docker** :
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f api
```

### 5.3 Vérifier que l'application démarre correctement

```bash
# Vérifier les logs
pm2 logs velvena-api --lines 50

# Vous devriez voir :
# ✅ Environment variables loaded successfully
# ✅ Stripe configured with publishable key: pk_live_...
# 🚀 Server running on port 3000
```

## Étape 6 : Tester le Webhook

### 6.1 Test depuis Stripe Dashboard

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur votre endpoint webhook
3. Cliquez sur l'onglet **"Testing"**
4. Sélectionnez **"Send test webhook"**
5. Choisissez `checkout.session.completed`
6. Cliquez sur **"Send test webhook"**

### 6.2 Vérifier la réception

Dans les logs de votre application, vous devriez voir :

```
{"level":"info","msg":"Processing webhook event","eventType":"checkout.session.completed"}
{"level":"info","msg":"Webhook event processed successfully"}
```

Sur Stripe Dashboard, le statut du webhook devrait être **"Succeeded"** avec un code `200`.

### 6.3 Test avec un vrai paiement (recommandé)

Pour tester complètement le flux :

1. Allez sur https://velvena.fr/pricing
2. Sélectionnez le plan **Pro**
3. Utilisez une **vraie carte bancaire** (vous serez facturé !)
4. Complétez le paiement
5. Vérifiez dans la base de données que :
   - `stripe_customer_id` est rempli
   - `stripe_subscription_id` est rempli
   - `subscription_status` = `active` ou `trial`
   - `subscription_plan_id` correspond au plan Pro

**Alternative sans payer** : Créez un code promo de 100% de réduction dans Stripe Dashboard pour tester sans être facturé.

## Étape 7 : Monitoring et Logging

### 7.1 Surveiller les webhooks

Stripe Dashboard vous permet de voir tous les webhooks :

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur votre endpoint
3. Vous verrez tous les événements envoyés avec :
   - ✅ Succès (code 200)
   - ⚠️ Échecs (code 4xx ou 5xx)
   - 🔄 Réessais automatiques

### 7.2 Activer les alertes

1. Dans Stripe Dashboard, allez sur **Settings** → **Notifications**
2. Activez les notifications pour :
   - Failed webhook delivery
   - Successful payments
   - Failed payments
   - Subscription cancellations

### 7.3 Logs de l'application

Surveillez régulièrement les logs :

```bash
# Logs en temps réel
pm2 logs velvena-api --lines 100

# Filtrer les logs Stripe
pm2 logs velvena-api | grep -i stripe

# Filtrer les erreurs
pm2 logs velvena-api --err
```

## Étape 8 : Configuration du Customer Portal

Le Customer Portal permet aux clients de gérer leur abonnement eux-mêmes.

### 8.1 Configurer le portail

1. Allez sur https://dashboard.stripe.com/settings/billing/portal
2. Assurez-vous d'être en **"Live mode"**
3. Activez les fonctionnalités :
   - ✅ **Update payment method** - Modifier le moyen de paiement
   - ✅ **Cancel subscription** - Annuler l'abonnement
   - ✅ **Update subscription** - Changer de plan (optionnel)
   - ✅ **View invoice history** - Voir l'historique

4. Configurez les règles d'annulation :
   - **Cancellation behavior** : "Cancel at period end" (recommandé)
   - **Proration** : "Always invoice immediately" (recommandé)

5. Personnalisez l'apparence :
   - **Business name** : Velvena
   - **Logo** : Upload votre logo
   - **Brand color** : Votre couleur principale

6. Cliquez sur **"Save changes"**

### 8.2 Tester le portail

```bash
# Créer une session de portail
curl -X POST https://api.velvena.fr/api/billing/create-portal-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"return_url": "https://velvena.fr/dashboard"}'

# Réponse :
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

Ouvrez l'URL dans un navigateur pour tester.

## Étape 9 : Checklist de Déploiement

Avant de mettre en production, vérifiez :

### Configuration Stripe
- [ ] Compte Stripe activé et vérifié
- [ ] Informations bancaires configurées
- [ ] Clés de production (sk_live_ et pk_live_) récupérées
- [ ] Webhook endpoint créé sur `https://api.velvena.fr/webhooks/stripe`
- [ ] Webhook secret récupéré
- [ ] Customer Portal configuré

### Variables d'Environnement
- [ ] `STRIPE_SECRET_KEY` = sk_live_...
- [ ] `STRIPE_PUBLISHABLE_KEY` = pk_live_...
- [ ] `STRIPE_WEBHOOK_SECRET` = whsec_...
- [ ] `STRIPE_SUCCESS_URL` = https://velvena.fr/subscription/success
- [ ] `STRIPE_CANCEL_URL` = https://velvena.fr/pricing
- [ ] Fichier `.env.production` sécurisé (chmod 600)

### Base de Données
- [ ] Migration Stripe appliquée (`npx prisma migrate deploy`)
- [ ] Plans créés dans la DB (Free, Pro, Enterprise)
- [ ] Plans synchronisés avec Stripe (`npm run stripe:sync`)

### Application
- [ ] Application buildée (`npm run build`)
- [ ] Application redémarrée avec les nouvelles variables
- [ ] Logs vérifiés (pas d'erreurs au démarrage)

### Tests
- [ ] Webhook de test envoyé depuis Stripe Dashboard (✅ 200)
- [ ] Test de paiement réel effectué (ou avec code promo 100%)
- [ ] Base de données mise à jour correctement
- [ ] Customer Portal testé et fonctionnel

### Frontend
- [ ] Frontend configuré avec `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] Frontend rebuild et redéployé
- [ ] Flux de paiement testé de bout en bout
- [ ] Redirections de succès/annulation fonctionnelles

## Étape 10 : Dépannage

### Problème : Webhook retourne 401

**Cause** : Le `STRIPE_WEBHOOK_SECRET` ne correspond pas.

**Solution** :
1. Vérifiez le secret dans Stripe Dashboard
2. Mettez à jour `.env.production`
3. Redémarrez l'application

```bash
# Tester le endpoint de santé
curl https://api.velvena.fr/webhooks/stripe/health

# Réponse attendue :
{
  "status": "configured",
  "webhookSecretConfigured": true
}
```

### Problème : Paiement réussi mais DB pas mise à jour

**Causes possibles** :
1. Webhook pas configuré
2. Webhook bloqué par le firewall
3. Erreur dans le handler de webhook

**Solutions** :

1. Vérifier les webhooks reçus :
```bash
# Dans Stripe Dashboard → Webhooks → Votre endpoint
# Regarder les événements récents
```

2. Vérifier les logs du serveur :
```bash
pm2 logs velvena-api | grep webhook
```

3. Vérifier que le port est ouvert :
```bash
# Tester depuis l'extérieur
curl https://api.velvena.fr/webhooks/stripe/health
```

### Problème : Erreur "No such product"

**Cause** : Les plans ne sont pas synchronisés avec Stripe.

**Solution** :
```bash
npm run stripe:sync
```

### Problème : Clés de test au lieu de clés de production

**Symptôme** : Les paiements fonctionnent mais n'apparaissent pas dans le dashboard live.

**Solution** :
1. Vérifiez que vous avez bien `sk_live_` et `pk_live_` (pas `sk_test_`)
2. Vérifiez que le webhook est configuré en "Live mode" dans Stripe
3. Redémarrez l'application après avoir changé les clés

## Étape 11 : Sécurité en Production

### 11.1 Variables d'environnement

```bash
# Ne JAMAIS commiter les clés en production
git status  # Vérifier que .env n'apparaît pas

# Si .env est déjà commité par erreur
git rm --cached .env
git commit -m "Remove .env from git"
git push

# Régénérer les clés Stripe immédiatement !
```

### 11.2 HTTPS uniquement

Vérifiez que votre API est en HTTPS :

```bash
curl https://api.velvena.fr/health
# ✅ Doit fonctionner

curl http://api.velvena.fr/health
# ❌ Doit rediriger vers HTTPS ou échouer
```

### 11.3 Limitation de débit (rate limiting)

Ajoutez un rate limiter pour protéger les endpoints de paiement :

```typescript
// À ajouter dans src/server.ts
import rateLimit from 'express-rate-limit';

const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requêtes par IP
  message: 'Too many requests, please try again later'
});

app.use('/api/billing', billingLimiter);
```

## Étape 12 : Monitoring Avancé (Optionnel)

### 12.1 Stripe Dashboard

Surveillez quotidiennement :
- **Home** : Vue d'ensemble des revenus
- **Payments** : Tous les paiements
- **Subscriptions** : Abonnements actifs
- **Customers** : Liste des clients

### 12.2 Alertes Email

Configurez des alertes dans Stripe pour :
- Paiements échoués
- Abonnements annulés
- Revenus quotidiens
- Webhooks en échec

### 12.3 Logs Centralisés

Utilisez un service de logging :
- **Sentry** : Pour les erreurs
- **Datadog** : Pour les métriques
- **LogRocket** : Pour les sessions utilisateur

## Récapitulatif des URLs

| Environnement | Webhook URL | Success URL | Cancel URL |
|---------------|-------------|-------------|------------|
| **Local** | http://localhost:3000/webhooks/stripe (via Stripe CLI) | http://localhost:3000/subscription/success | http://localhost:3000/pricing |
| **Production** | https://api.velvena.fr/webhooks/stripe | https://velvena.fr/subscription/success | https://velvena.fr/pricing |

## Support

En cas de problème :

1. **Stripe Support** : https://support.stripe.com
2. **Documentation Stripe** : https://stripe.com/docs
3. **Logs de l'application** : `pm2 logs velvena-api`
4. **Stripe Dashboard** : Regarder les événements webhook

---

✅ **Une fois toutes ces étapes terminées, votre intégration Stripe est prête en production !**

🎉 Vous pouvez commencer à accepter de vrais paiements.
