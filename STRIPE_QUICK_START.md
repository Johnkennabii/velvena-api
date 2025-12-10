# Guide de Démarrage Rapide - Stripe en Local

Ce guide vous explique comment configurer et tester Stripe en développement local **en 5 minutes**.

## Problème

Lorsque vous testez les paiements Stripe en local :
- ✅ Le paiement fonctionne sur Stripe
- ❌ La base de données n'est PAS mise à jour
- ❌ L'organisation reste en plan "Free"

**Cause** : Les webhooks Stripe ne peuvent pas atteindre `localhost`. Sans webhooks, votre serveur ne sait pas que le paiement a été effectué.

## Solution : Stripe CLI (5 minutes)

### Étape 1 : Installer Stripe CLI

#### macOS
```bash
brew install stripe/stripe-cli/stripe
```

#### Windows
Téléchargez depuis : https://github.com/stripe/stripe-cli/releases/latest

#### Linux
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz
tar -xvf stripe_1.19.5_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Étape 2 : Se connecter à Stripe

```bash
stripe login
```

Cela ouvrira votre navigateur pour confirmer l'accès.

### Étape 3 : Démarrer le forwarding des webhooks

Dans un **nouveau terminal** (laissez-le ouvert), exécutez :

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Vous verrez un message comme :

```
> Ready! Your webhook signing secret is whsec_abc123def456xyz789...
```

### Étape 4 : Copier le secret webhook

1. Copiez le secret qui commence par `whsec_`
2. Ouvrez votre fichier `.env`
3. Remplacez la valeur de `STRIPE_WEBHOOK_SECRET` :

```bash
# .env
STRIPE_WEBHOOK_SECRET=whsec_abc123def456xyz789...  # Collez votre secret ici
```

### Étape 5 : Redémarrer le serveur

Dans votre terminal serveur, redémarrez l'application :

```bash
# Arrêtez le serveur (Ctrl+C) puis :
npm run dev
```

### Étape 6 : Tester la configuration

Dans un **nouveau terminal**, exécutez le script de test :

```bash
npm run stripe:test-webhook
```

Vous devriez voir :

```
✅ STRIPE_SECRET_KEY: sk_test_51ScqFKRJ7P...
✅ STRIPE_PUBLISHABLE_KEY: pk_test_51ScqFKRJ7P...
✅ STRIPE_WEBHOOK_SECRET: whsec_abc123def456...
✅ Webhook endpoint is properly configured!
🎉 All checks passed! Your Stripe integration is ready.
```

## Test du flux complet

Maintenant vous avez **3 terminaux ouverts** :

| Terminal | Commande | Statut |
|----------|----------|--------|
| **Terminal 1** | `npm run dev` | ✅ Serveur Node.js |
| **Terminal 2** | `stripe listen --forward-to localhost:3000/webhooks/stripe` | ✅ Stripe CLI |
| **Terminal 3** | Libre pour vos commandes | ✅ Disponible |

### 1. Testez un abonnement

1. Dans votre application, sélectionnez un plan (Pro ou Enterprise)
2. Cliquez sur "S'abonner"
3. Vous serez redirigé vers Stripe Checkout
4. Utilisez la carte de test : **4242 4242 4242 4242**
   - CVV : 123
   - Date : 12/34
   - Code postal : 12345
5. Complétez le paiement
6. Vous serez redirigé vers la page de succès

### 2. Observez les webhooks (Terminal 2)

Dans le terminal où Stripe CLI tourne, vous devriez voir :

```
2025-12-10 15:30:00   --> checkout.session.completed [evt_xxxxx]
2025-12-10 15:30:01   <--  [200] POST http://localhost:3000/webhooks/stripe [evt_xxxxx]
2025-12-10 15:30:02   --> customer.subscription.created [evt_xxxxx]
2025-12-10 15:30:03   <--  [200] POST http://localhost:3000/webhooks/stripe [evt_xxxxx]
2025-12-10 15:30:04   --> invoice.paid [evt_xxxxx]
2025-12-10 15:30:05   <--  [200] POST http://localhost:3000/webhooks/stripe [evt_xxxxx]
```

Le `[200]` indique que votre serveur a **bien reçu et traité** le webhook. ✅

### 3. Vérifiez les logs du serveur (Terminal 1)

Dans le terminal du serveur, vous devriez voir :

```
{"level":"info","time":"...","msg":"Processing webhook event","eventType":"checkout.session.completed"}
{"level":"info","time":"...","msg":"Synced subscription from Stripe","organizationId":"...","status":"active"}
{"level":"info","time":"...","msg":"Webhook event processed successfully"}
```

### 4. Vérifiez la base de données

Ouvrez Prisma Studio :

```bash
npx prisma studio
```

Dans la table `Organization`, vérifiez votre organisation :

| Champ | Valeur attendue |
|-------|-----------------|
| `stripe_customer_id` | ✅ `cus_xxxxx` |
| `stripe_subscription_id` | ✅ `sub_xxxxx` |
| `subscription_plan_id` | ✅ ID du plan choisi (Pro/Enterprise) |
| `subscription_status` | ✅ `active` ou `trial` |

## Dépannage

### ❌ Les webhooks ne sont pas reçus

**Symptôme** : Aucun message dans le terminal Stripe CLI après le paiement.

**Solution** :
1. Vérifiez que Stripe CLI est bien en cours d'exécution
2. Vérifiez que le port est correct (`localhost:3000`)
3. Redémarrez Stripe CLI :
   ```bash
   stripe listen --forward-to localhost:3000/webhooks/stripe
   ```

### ❌ Erreur 401 sur les webhooks

**Symptôme** : Dans le terminal Stripe CLI, vous voyez :
```
<-- [401] POST http://localhost:3000/webhooks/stripe
```

**Solution** :
1. Le `STRIPE_WEBHOOK_SECRET` dans `.env` ne correspond pas au secret affiché par Stripe CLI
2. Copiez le secret **exactement** depuis le terminal Stripe CLI
3. Collez-le dans votre `.env`
4. **Redémarrez le serveur** (`Ctrl+C` puis `npm run dev`)

### ❌ L'organisation reste en "Free"

**Symptôme** : Le paiement réussit mais l'organisation n'est pas mise à jour.

**Solution** :
1. Vérifiez les logs du serveur pour voir si le webhook a été reçu
2. Vérifiez que Stripe CLI affiche `[200]` (succès) et pas `[401]` ou `[500]`
3. Vérifiez les logs pour voir s'il y a des erreurs
4. Testez le endpoint de santé :
   ```bash
   npm run stripe:test-webhook
   ```

### ❌ Erreur de connexion au endpoint

**Symptôme** : `npm run stripe:test-webhook` affiche "Failed to connect".

**Solution** :
1. Vérifiez que le serveur est démarré (`npm run dev`)
2. Vérifiez que le serveur écoute sur le port 3000
3. Vérifiez qu'il n'y a pas d'erreur dans les logs du serveur

## Tester manuellement un webhook

Vous pouvez déclencher un webhook de test sans faire de paiement :

```bash
stripe trigger checkout.session.completed
```

Cela créera un événement de test que vous verrez dans votre terminal Stripe CLI.

## Cartes de test Stripe

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Carte déclinée |
| `4000 0000 0000 9995` | ❌ Fonds insuffisants |
| `4000 0025 0000 3155` | 🔐 Authentification 3D Secure requise |

**Détails pour toutes les cartes** :
- CVV : N'importe quel 3 chiffres (ex: 123)
- Date d'expiration : N'importe quelle date future (ex: 12/34)
- Code postal : N'importe quel code (ex: 12345)

## Workflow quotidien

Chaque fois que vous travaillez sur l'application en local :

1. **Terminal 1** : Démarrez le serveur
   ```bash
   npm run dev
   ```

2. **Terminal 2** : Démarrez Stripe CLI
   ```bash
   stripe listen --forward-to localhost:3000/webhooks/stripe
   ```

3. **Terminal 3** : Libre pour vos commandes (tests, migrations, etc.)

**Important** : Vous devez avoir Stripe CLI actif pour que les paiements mettent à jour la base de données !

## Production

En production, vous n'avez **pas besoin** de Stripe CLI. Configurez simplement le webhook dans le Stripe Dashboard :

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur **"Add endpoint"**
3. URL : `https://api.velvena.fr/webhooks/stripe`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
5. Copiez le **"Signing secret"** (commence par `whsec_`)
6. Ajoutez-le dans votre `.env` de production

## Résumé

### ✅ Checklist de configuration

- [ ] Stripe CLI installé
- [ ] `stripe login` exécuté
- [ ] `stripe listen --forward-to localhost:3000/webhooks/stripe` actif
- [ ] `STRIPE_WEBHOOK_SECRET` copié dans `.env`
- [ ] Serveur redémarré
- [ ] `npm run stripe:test-webhook` affiche "All checks passed"
- [ ] Test de paiement effectué
- [ ] Webhooks reçus avec `[200]` dans Stripe CLI
- [ ] Base de données mise à jour

### 🎯 Commandes clés

```bash
# Terminal 1 : Serveur
npm run dev

# Terminal 2 : Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe

# Terminal 3 : Tests
npm run stripe:test-webhook          # Tester la configuration
npx prisma studio                     # Voir la base de données
stripe trigger checkout.session.completed  # Déclencher un webhook test
```

---

**Besoin d'aide ?** Consultez la documentation complète dans `STRIPE_LOCAL_DEVELOPMENT.md`
