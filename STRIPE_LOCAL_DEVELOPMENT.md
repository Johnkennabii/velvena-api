# Stripe Local Development Guide

## Problème en développement local

Lorsque vous testez les paiements Stripe en local :
- ✅ Le paiement fonctionne sur Stripe
- ❌ La base de données n'est pas mise à jour
- ❌ L'organisation reste en plan "Free"

**Cause** : Stripe ne peut pas envoyer de webhooks à `localhost`. Les webhooks sont bloqués car Stripe ne peut pas atteindre votre machine locale.

## Solution : Stripe CLI

Stripe CLI permet de forwarder les webhooks de Stripe vers votre serveur local.

### 1. Installation de Stripe CLI

#### macOS (avec Homebrew)
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

### 2. Authentification

Connectez-vous à votre compte Stripe :

```bash
stripe login
```

Cela ouvrira votre navigateur pour confirmer l'accès.

### 3. Démarrage du forwarding des webhooks

Dans un terminal séparé, exécutez :

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

**Important** : Vous verrez un message comme :

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4. Mise à jour du secret webhook

Copiez le secret généré (`whsec_xxxxxxxxxxxxx`) et mettez à jour votre `.env` :

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**⚠️ Redémarrez votre serveur** après avoir mis à jour le `.env`

### 5. Workflow de développement

Vous devez maintenant avoir **3 terminaux ouverts** :

**Terminal 1** : Serveur Node.js
```bash
npm run dev
```

**Terminal 2** : Stripe CLI (webhook forwarding)
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

**Terminal 3** : Pour vos commandes (migrations, tests, etc.)

## Test du flux complet

### 1. Vérifiez que tout est démarré

- ✅ Serveur Node.js sur `localhost:3000`
- ✅ Stripe CLI forwarding actif
- ✅ `.env` mis à jour avec le nouveau `STRIPE_WEBHOOK_SECRET`

### 2. Créez un abonnement de test

1. Dans votre application, sélectionnez un plan (Pro ou Enterprise)
2. Cliquez sur "S'abonner"
3. Vous serez redirigé vers Stripe Checkout
4. Utilisez une carte de test : `4242 4242 4242 4242`
5. Complétez le paiement

### 3. Observez les webhooks

Dans le terminal où Stripe CLI tourne, vous devriez voir :

```
2025-12-10 15:30:00   --> checkout.session.completed [evt_xxxxx]
2025-12-10 15:30:01   --> customer.subscription.created [evt_xxxxx]
2025-12-10 15:30:02   --> invoice.paid [evt_xxxxx]
2025-12-10 15:30:03   <--  [200] POST http://localhost:3000/webhooks/stripe [evt_xxxxx]
```

Le `[200]` indique que votre serveur a bien reçu et traité le webhook.

### 4. Vérifiez la base de données

```bash
npx prisma studio
```

Dans la table `Organization`, vérifiez :
- ✅ `stripe_customer_id` est rempli
- ✅ `stripe_subscription_id` est rempli
- ✅ `subscription_plan_id` correspond au plan choisi
- ✅ `subscription_status` = `"active"`

## Débogage

### Les webhooks ne sont pas reçus

**Vérifiez** :
1. Stripe CLI est bien en cours d'exécution
2. Le port est correct (`localhost:3000`)
3. Le serveur Node.js est démarré

### Erreur 401 sur les webhooks

```
<-- [401] POST http://localhost:3000/webhooks/stripe
```

**Solution** : Le `STRIPE_WEBHOOK_SECRET` dans `.env` ne correspond pas au secret affiché par Stripe CLI.

1. Regardez le secret dans le terminal Stripe CLI
2. Copiez-le exactement dans `.env`
3. Redémarrez le serveur Node.js

### L'organisation reste en "Free"

**Vérifiez dans les logs du serveur** :

```bash
# Dans votre serveur, vous devriez voir :
✅ [Stripe Webhook] checkout.session.completed
✅ Organization subscription updated: org-xxxxx → pro (active)
```

Si vous ne voyez pas ces logs, cela signifie que le webhook n'a pas été reçu.

**Solutions** :
1. Vérifiez que Stripe CLI forwarde bien les webhooks
2. Vérifiez que le `STRIPE_WEBHOOK_SECRET` est correct
3. Vérifiez les logs de Stripe CLI pour voir si le webhook a été envoyé

### Tester manuellement un webhook

Vous pouvez déclencher un webhook de test :

```bash
stripe trigger checkout.session.completed
```

## Cartes de test Stripe

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Carte déclinée |
| `4000 0000 0000 9995` | Fonds insuffisants |
| `4000 0025 0000 3155` | Authentification 3D Secure |

**Toutes les cartes** :
- CVV : N'importe quel 3 chiffres (ex: 123)
- Date d'expiration : N'importe quelle date future (ex: 12/34)
- Code postal : N'importe quel code (ex: 12345)

## Production

En production, vous n'avez PAS besoin de Stripe CLI. Configurez simplement le webhook dans le Stripe Dashboard :

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur "Add endpoint"
3. URL : `https://api.velvena.fr/webhooks/stripe`
4. Sélectionnez ces événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.payment_action_required`
5. Copiez le "Signing secret" dans votre `.env` de production

## Résumé

### Développement local
```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/webhooks/stripe

# Copiez le whsec_xxxxx dans .env et redémarrez le serveur
```

### Production
- Configurez le webhook dans Stripe Dashboard
- URL : `https://api.velvena.fr/webhooks/stripe`
- Pas besoin de Stripe CLI
