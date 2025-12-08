# 🔧 Fix Rapide - Problème de Seed

## ❌ Problème

Le seed échoue parce que la table `Organization` n'existe pas dans la base de données.

## ✅ Solution

Vous devez créer une migration pour ajouter les tables manquantes. **Depuis votre terminal interactif** (pas depuis Claude Code), exécutez :

```bash
# Étape 1 : Créer la migration
npx prisma migrate dev --name add_organization_and_subscription_models

# Étape 2 : Exécuter le seed
npm run prisma:seed
```

## 📝 Explication

La commande `npx prisma db pull` que j'ai exécutée a écrasé votre `schema.prisma` en le synchronisant avec la base de données actuelle. Comme la table `Organization` n'était pas dans la DB, elle a été supprimée du schema.

J'ai restauré le schema avec `git restore`, mais maintenant il faut créer la migration pour que la table existe dans la DB.

## 🚀 Commandes à exécuter

### Option 1 : Dans un terminal interactif

```bash
cd /Users/johnkennabii/Documents/velvena

# 1. Créer la migration
npx prisma migrate dev --name add_organization_and_subscription_models

# 2. Le seed s'exécutera automatiquement après la migration
```

### Option 2 : Si vous voulez tout réinitialiser

```bash
# Réinitialiser complètement la base de données
npx prisma migrate reset

# Cela va :
# - Supprimer toutes les données
# - Supprimer toutes les tables
# - Réappliquer toutes les migrations depuis le début
# - Exécuter automatiquement le seed
```

## ✅ Vérification

Après l'exécution, vous devriez voir :

```
🌱 Starting seed...
📦 Creating default organization...
✅ Organization created: Default Organization (uuid)
👥 Creating global roles...
...
💳 Creating subscription plans...
  ✅ Free plan created
  ✅ Basic plan created
  ✅ Pro plan created (Popular)
  ✅ Enterprise plan created
  ✅ Free plan assigned to default organization

🎉 Seed completed successfully!
```

## 🔍 Vérifier les plans créés

```bash
# Ouvrir Prisma Studio
npx prisma studio

# Ou via l'API
curl http://localhost:3000/api/billing/plans | jq .
```

## ⚠️ Important

**NE PAS** exécuter `npx prisma db pull` à nouveau, car cela écrasera votre schema.prisma !

La commande `prisma db pull` est utilisée pour **importer** un schema existant depuis une base de données.
Dans votre cas, vous devez utiliser `prisma migrate dev` pour **créer** les tables manquantes.

---

**💡 En résumé : Exécutez `npx prisma migrate dev --name add_organization_and_subscription_models` depuis votre terminal.**
