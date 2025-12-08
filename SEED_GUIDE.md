# 🌱 Guide d'utilisation du Seed

## 📋 Vue d'ensemble

Le seed de Velvena initialise votre base de données avec toutes les données nécessaires au démarrage, y compris les **plans de souscription**.

---

## ✅ Ce qui est créé par le seed

### 1. Organisation par défaut
- **Nom** : Default Organization
- **Slug** : default
- **Plan** : Free (avec période d'essai de 14 jours)

### 2. Rôles globaux (4)
- `super_admin` - Accès complet
- `admin` - Administrateur d'organisation
- `manager` - Gestionnaire
- `user` - Utilisateur standard

### 3. Types de robes (5)
- Robe de soirée
- Robe cocktail
- Robe de mariée
- Robe de demoiselle d'honneur
- Robe casual

### 4. Tailles (15)
- XXS, XS, S, M, L, XL, XXL
- 34, 36, 38, 40, 42, 44, 46, 48

### 5. Couleurs (13)
- Blanc, Noir, Rouge, Bleu, Vert, Rose, Violet, Jaune, Orange, Beige, Gris, Argenté, Doré

### 6. États de condition (6)
- Neuve, Excellente, Très bonne, Bonne, Correcte, À réparer

### 7. Types de contrats (4)
- Location standard
- Location longue durée
- Location avec option d'achat
- Vente

### 8. **Plans de souscription (4)** ✨

#### Free (0€/mois)
- **Limites** : 3 users, 50 robes, 200 clients, 10 contrats/mois
- **Features** : Basique uniquement

#### Basic (19€/mois)
- **Limites** : 10 users, 500 robes, 2000 clients, 50 contrats/mois
- **Features** : + Prospects, Export

#### Pro (49€/mois) ⭐ Populaire
- **Limites** : 20 users, Illimité robes/clients, 200 contrats/mois
- **Features** : + Signature électronique, API, Analytics

#### Enterprise (149€/mois)
- **Limites** : Tout illimité
- **Features** : Toutes les features + White label

### 9. Utilisateurs de test (2)
- **Super Admin** : admin@velvena.com / admin123
- **Test User** : user@velvena.com / user123

---

## 🚀 Comment exécuter le seed

### Option 1 : Avec Prisma (recommandé)

```bash
# Réinitialiser la DB + exécuter le seed
npx prisma migrate reset

# Ou juste exécuter le seed
npx prisma db seed
```

### Option 2 : Directement avec npm

```bash
npm run prisma:seed
```

### Option 3 : Avec tsx

```bash
npx tsx prisma/seed.ts
```

---

## 📊 Résultat attendu

```
🌱 Starting seed...
📦 Creating default organization...
✅ Organization created: Default Organization (uuid)
👥 Creating global roles...
  ✅ Role: super_admin
  ✅ Role: admin
  ✅ Role: manager
  ✅ Role: user
👗 Creating global dress types...
  ✅ Type: Robe de soirée
  ...
📏 Creating global dress sizes...
  ✅ Size: XXS
  ...
🎨 Creating global dress colors...
  ✅ Color: Blanc (#FFFFFF)
  ...
⭐ Creating global dress conditions...
  ✅ Condition: Neuve
  ...
📄 Creating global contract types...
  ✅ Contract Type: Location standard
  ...
🔐 Creating super admin user...
✅ Super admin created: admin@velvena.com
   Password: admin123 (CHANGE THIS IN PRODUCTION!)
👤 Creating test user...
✅ Test user created: user@velvena.com
   Password: user123
💳 Creating subscription plans...
  ✅ Free plan created
  ✅ Basic plan created
  ✅ Pro plan created (Popular)
  ✅ Enterprise plan created
  ✅ Free plan assigned to default organization

🎉 Seed completed successfully!

📊 Summary:
   - Organizations: 1
   - Roles: 4 (global)
   - Dress Types: 5 (global)
   - Sizes: 15 (global)
   - Colors: 13 (global)
   - Conditions: 6 (global)
   - Contract Types: 4 (global)
   - Subscription Plans: 4 (Free, Basic, Pro, Enterprise)
   - Users: 2 (1 super admin + 1 test user)

🔑 Login credentials:
   Super Admin: admin@velvena.com / admin123
   Test User: user@velvena.com / user123

⚠️  IMPORTANT: Change passwords in production!
```

---

## 🔄 Réexécuter le seed

Le seed utilise `upsert()`, ce qui signifie qu'il peut être exécuté plusieurs fois sans créer de doublons. Si une donnée existe déjà, elle est ignorée.

```bash
# Réinitialiser complètement la DB
npx prisma migrate reset

# Cela va :
# 1. Supprimer toutes les données
# 2. Réappliquer toutes les migrations
# 3. Exécuter automatiquement le seed
```

---

## ✅ Vérifier que les plans sont créés

### Avec Prisma Studio

```bash
npx prisma studio
```

Puis ouvrir la table **SubscriptionPlan** et vérifier qu'il y a 4 plans.

### Avec psql (PostgreSQL)

```bash
psql -U your_user -d velvena_db

SELECT name, code, price_monthly, is_popular FROM "SubscriptionPlan";
```

**Résultat attendu :**

```
   name     | code       | price_monthly | is_popular
------------+------------+---------------+------------
 Free       | free       |          0.00 | f
 Basic      | basic      |         19.00 | f
 Pro        | pro        |         49.00 | t
 Enterprise | enterprise |        149.00 | f
```

### Via l'API

```bash
curl http://localhost:3000/api/billing/plans | jq .
```

---

## 🔧 Personnaliser les plans

Si vous voulez modifier les limites ou les prix, éditez directement `prisma/seed.ts` :

```typescript
const proPlan = await prisma.subscriptionPlan.upsert({
  where: { code: "pro" },
  update: {},
  create: {
    name: "Pro",
    price_monthly: 49,  // ← Changer ici
    limits: {
      users: 20,        // ← Modifier les limites
      dresses: 9999999,
      // ...
    },
  },
});
```

Puis réexécutez le seed :

```bash
npx prisma db seed
```

---

## 🆕 Ajouter un nouveau plan

Pour ajouter un plan "Premium" par exemple :

```typescript
// Dans prisma/seed.ts, après enterprisePlan

const premiumPlan = await prisma.subscriptionPlan.upsert({
  where: { code: "premium" },
  update: {},
  create: {
    name: "Premium",
    code: "premium",
    description: "Plan intermédiaire entre Pro et Enterprise",
    price_monthly: 99,
    price_yearly: 990,
    trial_days: 14,
    limits: {
      users: 50,
      dresses: 9999999,
      customers: 9999999,
      contracts_per_month: 500,
      storage_gb: 100,
      api_calls_per_day: 50000,
      email_notifications: 5000,
    },
    features: {
      prospect_management: true,
      contract_generation: true,
      electronic_signature: true,
      inventory_management: true,
      customer_portal: true,
      advanced_analytics: true,
      export_data: true,
      api_access: true,
      white_label: true,
      sms_notifications: true,
    },
    is_public: true,
    is_popular: false,
    sort_order: 4, // Insérer entre Pro (3) et Enterprise (5)
  },
});
console.log(`  ✅ ${premiumPlan.name} plan created`);
```

Puis mettez à jour le `sort_order` de Enterprise à 5 et réexécutez le seed.

---

## 🐛 Troubleshooting

### Erreur : "Unique constraint failed"

Cela signifie que les données existent déjà. Solutions :

```bash
# Option 1 : Réinitialiser complètement
npx prisma migrate reset

# Option 2 : Supprimer manuellement les plans
npx prisma studio
# Puis supprimer les entrées dans SubscriptionPlan
```

### Erreur : "Column 'subscription_plan_id' does not exist"

Vous devez exécuter les migrations Prisma avant le seed :

```bash
npx prisma migrate dev
```

### Erreur : "Table 'SubscriptionPlan' does not exist"

La migration n'a pas été appliquée. Vérifiez que votre `schema.prisma` contient le modèle `SubscriptionPlan` et exécutez :

```bash
npx prisma migrate dev --name add_subscription_plans
```

---

## 📝 Scripts package.json

Votre `package.json` contient déjà :

```json
{
  "scripts": {
    "prisma:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Cela signifie que :
- `npm run prisma:seed` → Exécute directement le seed
- `npx prisma db seed` → Exécute le seed via Prisma (utilise la config `prisma.seed`)

---

## 🎯 Workflow recommandé

### Pour le développement

```bash
# 1. Modifier le schema Prisma
nano prisma/schema.prisma

# 2. Créer une migration
npx prisma migrate dev --name add_new_feature

# 3. Le seed s'exécute automatiquement après la migration
# (grâce à la config prisma.seed)
```

### Pour la production

```bash
# 1. Appliquer les migrations
npx prisma migrate deploy

# 2. Exécuter le seed manuellement
npm run prisma:seed
```

---

## 🔒 Sécurité en Production

### ⚠️ IMPORTANT

Le seed crée des utilisateurs avec des mots de passe par défaut :
- Super Admin: `admin123`
- Test User: `user123`

**Avant de déployer en production :**

1. Changer les mots de passe via l'API :
   ```bash
   curl -X PUT http://localhost:3000/api/users/:id \
     -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"password": "NEW_SECURE_PASSWORD"}'
   ```

2. Ou supprimer les utilisateurs de test :
   ```typescript
   // Dans seed.ts, commenter cette section :
   // const testUser = await prisma.user.upsert(...);
   ```

---

## ✅ Checklist finale

- [ ] Exécuter `npx prisma migrate reset` pour tout réinitialiser
- [ ] Vérifier que 4 plans sont créés (GET /api/billing/plans)
- [ ] Vérifier que l'organisation par défaut a le plan "Free"
- [ ] Tester la connexion avec admin@velvena.com / admin123
- [ ] Changer les mots de passe en production

---

**🎉 Votre base de données est maintenant prête avec tous les plans de souscription !**
