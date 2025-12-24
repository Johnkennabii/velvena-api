# Guide de mise à jour des prix Stripe

Ce guide explique comment mettre à jour les prix de vos abonnements Stripe.

## ⚠️ Important à savoir

**Les prix Stripe ne peuvent PAS être modifiés** une fois créés. C'est une limitation de l'API Stripe pour garantir l'intégrité des abonnements existants.

Pour "modifier" un prix, vous devez :
1. Créer de NOUVEAUX prix dans Stripe
2. Mettre à jour les références (`stripe_price_id_monthly` et `stripe_price_id_yearly`) dans votre base de données
3. Les **nouveaux abonnements** utiliseront automatiquement les nouveaux prix
4. Les **abonnements existants** continueront avec leur prix actuel (sauf migration manuelle)

## 🚀 Utilisation du script

### Syntaxe de base

```bash
npm run stripe:update-prices <plan_code> <prix_mensuel> <prix_annuel>
```

### Exemples

```bash
# Mettre à jour le plan Basic à 29.99€/mois et 299.99€/an
npm run stripe:update-prices basic 29.99 299.99

# Mettre à jour le plan Pro à 79.99€/mois et 799.99€/an
npm run stripe:update-prices pro 79.99 799.99

# Mettre à jour le plan Enterprise à 199.99€/mois et 1999.99€/an
npm run stripe:update-prices enterprise 199.99 1999.99
```

### Options avancées

#### Archiver les anciens prix

Pour marquer les anciens prix comme inactifs dans Stripe (recommandé pour éviter la confusion) :

```bash
npm run stripe:update-prices basic 29.99 299.99 --archive-old
```

**Note :** Archiver un prix ne l'empêche pas de fonctionner pour les abonnements existants. Cela le cache simplement dans le dashboard Stripe pour les nouveaux abonnements.

## 📋 Procédure complète

### 1. Vérifier les prix actuels

Consultez vos prix actuels dans :
- Le dashboard Stripe : https://dashboard.stripe.com/prices
- Votre base de données :

```sql
SELECT code, name, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly
FROM "SubscriptionPlan"
WHERE code != 'free';
```

### 2. Exécuter le script de mise à jour

```bash
# Exemple : mettre à jour le plan Pro
npm run stripe:update-prices pro 89.99 899.99 --archive-old
```

Le script va :
1. ✅ Vérifier que le plan existe dans la base de données
2. ✅ Créer un nouveau prix mensuel dans Stripe
3. ✅ Créer un nouveau prix annuel dans Stripe
4. ✅ Mettre à jour la base de données avec les nouveaux price IDs
5. ✅ Archiver les anciens prix (si `--archive-old` est spécifié)

### 3. Vérifier la mise à jour

- **Dashboard Stripe :** Vérifiez que les nouveaux prix apparaissent
- **Base de données :** Vérifiez que les price IDs sont mis à jour
- **Test :** Créez un nouveau checkout pour vérifier que le bon prix est utilisé

```bash
# Tester avec le script de test (si disponible)
npm run stripe:test-checkout
```

## 🔄 Migration des abonnements existants

Les abonnements existants **NE SONT PAS** migrés automatiquement vers les nouveaux prix. Vous avez plusieurs options :

### Option 1 : Migration manuelle via le dashboard Stripe

1. Allez dans **Customers** > Sélectionnez un client
2. Cliquez sur l'abonnement
3. Cliquez sur **Update subscription**
4. Sélectionnez le nouveau prix
5. Choisissez comment gérer la proration (prorata, crédit, etc.)

### Option 2 : Migration automatique via l'API

Utilisez la fonction `updateSubscription` du service Stripe :

```typescript
import { updateSubscription } from "./src/services/stripeService.js";

// Migrer un abonnement vers le nouveau prix
await updateSubscription(
  organizationId,
  "pro",           // nouveau plan
  "month",         // intervalle de facturation
  "create_prorations" // comportement de proration
);
```

### Option 3 : Script de migration en masse

Créez un script pour migrer tous les abonnements d'un plan :

```typescript
// scripts/migrate-subscriptions-to-new-price.ts
import prisma from "../src/lib/prisma.js";
import { updateSubscription } from "../src/services/stripeService.js";

async function migrateSubscriptions(planCode: string) {
  const orgs = await prisma.organization.findMany({
    where: {
      subscription_plan: planCode,
      stripe_subscription_id: { not: null }
    }
  });

  for (const org of orgs) {
    try {
      await updateSubscription(org.id, planCode, "month");
      console.log(`✅ Migré: ${org.name}`);
    } catch (err) {
      console.error(`❌ Erreur pour ${org.name}:`, err);
    }
  }
}

migrateSubscriptions("pro");
```

## 🎯 Plans disponibles

Les plans que vous pouvez mettre à jour :

- `basic` - Plan Basic
- `pro` - Plan Pro
- `enterprise` - Plan Enterprise

**Note :** Le plan `free` ne nécessite pas de prix Stripe car il n'y a pas de paiement.

## 🧪 Environnements

### Développement (Test Mode)

Utilisez votre clé de test Stripe :

```bash
# .env
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### Production (Live Mode)

⚠️ **ATTENTION** : En production, soyez très prudent !

```bash
# .env.production
STRIPE_SECRET_KEY=sk_live_xxxxx
```

Recommandations pour la production :
1. **Testez d'abord en mode test** avec les mêmes paramètres
2. Faites une sauvegarde de votre base de données
3. Exécutez le script pendant les heures creuses
4. Vérifiez immédiatement après l'exécution
5. Informez vos clients des changements de prix si nécessaire

## 📊 Exemple de workflow complet

```bash
# 1. Vérifier l'environnement
echo $STRIPE_SECRET_KEY | head -c 7  # Doit afficher sk_test ou sk_live

# 2. Tester en mode test d'abord
npm run stripe:update-prices basic 29.99 299.99

# 3. Vérifier dans le dashboard Stripe (mode test)
# https://dashboard.stripe.com/test/prices

# 4. Si tout est OK, passer en production
# Changer STRIPE_SECRET_KEY pour sk_live_xxxxx

# 5. Exécuter en production
npm run stripe:update-prices basic 29.99 299.99 --archive-old

# 6. Vérifier dans le dashboard Stripe (mode live)
# https://dashboard.stripe.com/prices

# 7. Tester un nouveau checkout
# Créer un nouvel abonnement et vérifier que le prix est correct
```

## ❓ FAQ

### Que se passe-t-il avec les abonnements existants ?

Les abonnements existants **conservent leur prix actuel**. Ils ne sont pas affectés par la création de nouveaux prix. Pour les migrer, vous devez le faire manuellement ou via un script.

### Puis-je annuler la mise à jour ?

Vous ne pouvez pas "annuler" la création de nouveaux prix, mais vous pouvez :
1. Restaurer les anciens price IDs dans la base de données
2. Archiver les nouveaux prix dans Stripe
3. Réactiver les anciens prix dans Stripe

```bash
# Restauration manuelle dans la DB
UPDATE "SubscriptionPlan"
SET stripe_price_id_monthly = 'price_ancien_id_mensuel',
    stripe_price_id_yearly = 'price_ancien_id_annuel'
WHERE code = 'basic';
```

### Comment tester sans affecter la production ?

Utilisez le **mode test de Stripe** :
1. Utilisez votre clé de test `sk_test_xxxxx` dans `.env`
2. Tous les prix créés seront en mode test
3. Testez le workflow complet
4. Une fois validé, passez en mode live avec `sk_live_xxxxx`

### Les codes promo fonctionnent-ils avec les nouveaux prix ?

Oui ! Les codes promo Stripe fonctionnent avec tous les prix actifs. Assurez-vous que vos codes promo sont configurés pour s'appliquer aux bons produits.

## 🆘 Dépannage

### Erreur : "Plan not found"

Le code du plan n'existe pas dans votre base de données. Vérifiez :

```sql
SELECT code, name FROM "SubscriptionPlan";
```

### Erreur : "No Stripe Product ID"

Le plan n'a pas encore été synchronisé avec Stripe. Exécutez d'abord :

```bash
npm run stripe:sync
```

### Erreur : "Stripe authentication failed"

Votre clé API Stripe n'est pas valide ou n'est pas définie. Vérifiez `.env` :

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx  # ou sk_live_xxxxx
```

## 📚 Ressources

- [Documentation Stripe - Prices](https://stripe.com/docs/api/prices)
- [Documentation Stripe - Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Guide Stripe - Migration des prix](https://stripe.com/docs/billing/subscriptions/change)
- Dashboard Stripe : https://dashboard.stripe.com/prices
