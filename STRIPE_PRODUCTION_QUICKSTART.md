# Déploiement Stripe en Production - Quick Start

Guide rapide en 10 étapes pour déployer Stripe en production sur votre VPS.

⏱️ Temps estimé : **30 minutes**

---

## 1️⃣ Activer le compte Stripe (5 min)

1. Allez sur https://dashboard.stripe.com
2. Cliquez sur **"Activate your account"**
3. Remplissez les informations :
   - Détails de l'entreprise (Velvena)
   - Informations bancaires (pour recevoir les paiements)
   - Informations fiscales

---

## 2️⃣ Récupérer les clés LIVE (2 min)

1. Allez sur https://dashboard.stripe.com/apikeys
2. **Basculez sur "Live mode"** (toggle en haut à droite)
3. Copiez les clés :

```
Publishable key: pk_live_51...
Secret key: sk_live_51...
```

⚠️ **IMPORTANT** : Vérifiez bien que les clés commencent par `pk_live_` et `sk_live_` (pas `pk_test_`)

---

## 3️⃣ Configurer le Webhook (3 min)

1. Allez sur https://dashboard.stripe.com/webhooks
2. Assurez-vous d'être en **"Live mode"**
3. Cliquez sur **"Add endpoint"**
4. Entrez l'URL : `https://api.velvena.fr/webhooks/stripe`
5. Sélectionnez ces événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Cliquez sur **"Add endpoint"**
7. Cliquez sur **"Reveal"** pour voir le **Signing secret** (commence par `whsec_`)
8. Copiez le secret

---

## 4️⃣ Mettre à jour `.env.production` sur le VPS (5 min)

```bash
# SSH vers le VPS
ssh user@your-vps-ip
cd /path/to/velvena

# Éditer le fichier .env
nano .env.production
```

Ajoutez/modifiez ces lignes :

```bash
# Stripe LIVE Keys (PRODUCTION)
STRIPE_SECRET_KEY=sk_live_51ScqFKRJ7PlLrfUP...
STRIPE_PUBLISHABLE_KEY=pk_live_51ScqFKRJ7PlLrfUP...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URLs de production
STRIPE_SUCCESS_URL=https://velvena.fr/subscription/success
STRIPE_CANCEL_URL=https://velvena.fr/pricing
```

**Sauvegardez** (Ctrl+O, Entrée, Ctrl+X)

```bash
# Sécuriser le fichier
chmod 600 .env.production
```

---

## 5️⃣ Synchroniser les plans avec Stripe (3 min)

```bash
# Charger les variables d'environnement
export $(cat .env.production | xargs)

# Synchroniser les plans
npm run stripe:sync
```

**Sortie attendue** :
```
✅ Environment variables loaded successfully
✅ Plan 'pro' synced successfully
✅ Plan 'enterprise' synced successfully
🎉 Successfully synced 2 plans to Stripe
```

---

## 6️⃣ Vérifier la configuration (2 min)

```bash
# Exécuter le script de vérification
./scripts/verify-stripe-production.sh
```

**Sortie attendue** :
```
✅ STRIPE_SECRET_KEY configurée (LIVE)
✅ STRIPE_PUBLISHABLE_KEY configurée (LIVE)
✅ STRIPE_WEBHOOK_SECRET configurée
✅ API accessible
✅ Endpoint webhook configuré
🎉 Configuration Stripe prête pour la production !
```

Si vous voyez des ❌, corrigez les erreurs avant de continuer.

---

## 7️⃣ Redémarrer l'application (2 min)

```bash
# Rebuild
npm run build

# Redémarrer avec PM2
pm2 restart velvena-api
pm2 logs velvena-api --lines 50

# OU avec systemd
sudo systemctl restart velvena-api

# OU avec Docker
docker-compose restart api
```

**Vérifiez les logs** : vous devriez voir `✅ Stripe configured with publishable key: pk_live_...`

---

## 8️⃣ Tester le webhook (3 min)

### Depuis Stripe Dashboard

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur votre endpoint
3. Cliquez sur l'onglet **"Testing"**
4. Sélectionnez **"Send test webhook"**
5. Choisissez `checkout.session.completed`
6. Cliquez sur **"Send test webhook"**

**Résultat attendu** :
- ✅ Status : **Succeeded** (code 200)
- Dans vos logs : `{"level":"info","msg":"Processing webhook event","eventType":"checkout.session.completed"}`

---

## 9️⃣ Configurer le Customer Portal (3 min)

1. Allez sur https://dashboard.stripe.com/settings/billing/portal
2. Assurez-vous d'être en **"Live mode"**
3. Activez :
   - ✅ **Cancel subscription**
   - ✅ **Update payment method**
   - ✅ **View invoice history**
4. Réglez **Cancellation behavior** sur : **"Cancel at period end"**
5. Personnalisez :
   - Business name : **Velvena**
   - Logo : Upload votre logo
6. Cliquez sur **"Save changes"**

---

## 🔟 Tester avec un vrai paiement (5 min)

### Option 1 : Paiement réel (vous serez facturé)

1. Allez sur https://velvena.fr/pricing
2. Sélectionnez le plan **Pro**
3. Utilisez votre vraie carte bancaire
4. Complétez le paiement
5. Vérifiez dans la DB que `subscription_status = 'active'`

### Option 2 : Code promo 100% (recommandé pour tester)

1. Dans Stripe Dashboard : https://dashboard.stripe.com/coupons
2. Créez un coupon : **100% off**
3. Testez le paiement avec ce code promo
4. Vous ne serez pas facturé

---

## ✅ Checklist Finale

Avant de mettre en production, vérifiez :

- [ ] Compte Stripe activé et vérifié
- [ ] Clés LIVE (pk_live_ et sk_live_) configurées
- [ ] Webhook créé en "Live mode" sur `https://api.velvena.fr/webhooks/stripe`
- [ ] `.env.production` avec les bonnes clés
- [ ] Plans synchronisés avec Stripe (`npm run stripe:sync`)
- [ ] Application redémarrée
- [ ] Script de vérification réussi (`./scripts/verify-stripe-production.sh`)
- [ ] Webhook testé (code 200)
- [ ] Customer Portal configuré
- [ ] Test de paiement effectué

---

## 🚨 Problèmes Fréquents

### ❌ Webhook retourne 401

**Problème** : Le webhook secret ne correspond pas.

**Solution** :
1. Vérifiez le secret dans Stripe Dashboard → Webhooks → Votre endpoint → Reveal
2. Copiez-le exactement dans `.env.production`
3. Redémarrez l'app : `pm2 restart velvena-api`

### ❌ "No such product" lors du paiement

**Problème** : Les plans ne sont pas synchronisés.

**Solution** :
```bash
npm run stripe:sync
```

### ❌ Clés de test en production

**Problème** : Vous utilisez encore `sk_test_` au lieu de `sk_live_`.

**Solution** :
1. Allez sur https://dashboard.stripe.com/apikeys
2. **Basculez sur "Live mode"**
3. Copiez les nouvelles clés
4. Mettez à jour `.env.production`
5. Redémarrez

### ❌ DB pas mise à jour après paiement

**Problème** : Le webhook n'est pas configuré ou pas reçu.

**Solution** :
1. Vérifiez que le webhook existe en "Live mode"
2. Testez : https://api.velvena.fr/webhooks/stripe/health
3. Regardez les logs : `pm2 logs velvena-api | grep webhook`

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- **STRIPE_PRODUCTION_DEPLOYMENT.md** - Guide complet étape par étape
- **STRIPE_QUICK_START.md** - Guide de développement local
- **STRIPE_CANCELLATION_GUIDE.md** - Gestion des résiliations
- **BACKEND_VALIDATION_STRIPE.md** - Validation des endpoints

---

## 🎉 C'est Prêt !

Une fois toutes les étapes complétées :

✅ Votre intégration Stripe est opérationnelle en production
✅ Vous pouvez accepter de vrais paiements
✅ Les webhooks mettent automatiquement à jour la DB
✅ Les clients peuvent gérer leur abonnement via le Customer Portal

**Bon lancement ! 🚀**
