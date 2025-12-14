# Scripts de Suppression d'Organisation

## ⚠️ ATTENTION

Ces scripts suppriment **DÉFINITIVEMENT** une organisation et **TOUTES** ses données associées :

- ✅ Utilisateurs (User)
- ✅ Profils (Profile)
- ✅ Rôles (Role)
- ✅ Robes (Dress)
- ✅ Clients (Customer)
- ✅ Notes clients (CustomerNote)
- ✅ Prospects (Prospect)
- ✅ Contrats (Contract)
- ✅ Éléments de contrat (ContractItem)
- ✅ Types de service (ServiceType)
- ✅ Règles de tarification (PricingRule)
- ✅ L'organisation elle-même (Organization)

**❌ NE SUPPRIME PAS :**
- ContractType (types de contrat globaux)
- DressType, DressSize, DressColor, DressCondition (données de référence globales)
- SubscriptionPlan (plans d'abonnement)

---

## 📁 Fichiers Disponibles

### 1. `delete-organization-simple.sql` ⭐ RECOMMANDÉ
**Usage :** Suppression par ID (version simple et directe)

**Avantages :**
- Simple à comprendre
- Facile à modifier
- Fonctionne dans tous les clients SQL

**Comment l'utiliser :**

1. Trouver l'ID de l'organisation :
```sql
SELECT id, name, slug, email FROM "Organization" WHERE slug = 'ma-boutique';
```

2. Remplacer `'YOUR-ORG-ID-HERE'` par l'ID réel dans le fichier

3. Exécuter tout le script dans DBeaver (Ctrl+Enter ou F9)

4. Vérifier les résultats avec la requête de vérification à la fin

---

### 2. `delete-organization-by-slug.sql` ⭐ PLUS PRATIQUE
**Usage :** Suppression par SLUG (plus pratique, avec logs détaillés)

**Avantages :**
- Pas besoin de chercher l'ID
- Affiche le nombre d'éléments supprimés pour chaque table
- Messages de progression détaillés
- Validation automatique (erreur si le slug n'existe pas)

**Comment l'utiliser :**

1. Modifier la ligne 10 :
```sql
org_slug TEXT := 'ma-boutique'; -- ⚠️ MODIFIER ICI
```

2. Exécuter le script dans DBeaver

3. Lire les logs pour vérifier la suppression

**Exemple de logs :**
```
===========================================
Suppression de l'organisation : ma-boutique
ID : 123e4567-e89b-12d3-a456-426614174000
===========================================
✅ ContractItem : 15 supprimés
✅ Contract : 5 supprimés
✅ CustomerNote : 23 supprimés
✅ Customer : 45 supprimés
✅ Prospect : 12 supprimés
✅ Dress : 120 supprimés
✅ Profile : 3 supprimés
✅ User : 3 supprimés
✅ Role : 2 supprimés
✅ ServiceType : 5 supprimés
✅ PricingRule : 8 supprimés
✅ Organization : 1 supprimée
===========================================
✅ SUPPRESSION TERMINÉE AVEC SUCCÈS !
===========================================
```

---

### 3. `delete-organization.sql`
**Usage :** Version avancée avec bloc DO (PostgreSQL)

**Avantages :**
- Versions commentées pour suppression par ID et par SLUG
- Requêtes de vérification incluses
- Plus de documentation

**Comment l'utiliser :**
- Similaire aux versions ci-dessus
- Choisir entre suppression par ID ou par SLUG (décommenter la section appropriée)

---

## 🚀 Guide d'Utilisation dans DBeaver

### Étape 1 : Ouvrir le script

1. Ouvrir DBeaver
2. Connexion à la base de données PostgreSQL
3. Fichier → Ouvrir le script SQL (`delete-organization-by-slug.sql` recommandé)

### Étape 2 : Modifier le slug/ID

```sql
-- Pour delete-organization-by-slug.sql :
org_slug TEXT := 'ma-boutique'; -- ⚠️ MODIFIER ICI

-- Pour delete-organization-simple.sql :
-- Remplacer tous les 'YOUR-ORG-ID-HERE' par l'ID réel
```

### Étape 3 : Exécuter

- Sélectionner tout le script (Ctrl+A)
- Exécuter (Ctrl+Enter ou F9)
- Vérifier les logs de résultat

### Étape 4 : Vérifier

```sql
SELECT id, name, slug FROM "Organization" WHERE slug = 'ma-boutique';
-- Doit retourner 0 ligne
```

---

## 🔍 Requêtes Utiles

### Lister toutes les organisations
```sql
SELECT id, name, slug, email, created_at
FROM "Organization"
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

### Compter les données d'une organisation AVANT suppression
```sql
SELECT
    'User' as table_name,
    COUNT(*) as count
FROM "User"
WHERE organization_id = 'YOUR-ORG-ID'

UNION ALL

SELECT 'Dress', COUNT(*)
FROM "Dress"
WHERE organization_id = 'YOUR-ORG-ID'

UNION ALL

SELECT 'Customer', COUNT(*)
FROM "Customer"
WHERE organization_id = 'YOUR-ORG-ID'

UNION ALL

SELECT 'Contract', COUNT(*)
FROM "Contract"
WHERE organization_id = 'YOUR-ORG-ID'

UNION ALL

SELECT 'Prospect', COUNT(*)
FROM "Prospect"
WHERE organization_id = 'YOUR-ORG-ID';
```

### Vérifier qu'une organisation est bien supprimée
```sql
SELECT
    'Organization' as table_name,
    COUNT(*) as remaining
FROM "Organization"
WHERE id = 'YOUR-ORG-ID'

UNION ALL

SELECT 'User', COUNT(*)
FROM "User"
WHERE organization_id = 'YOUR-ORG-ID'

UNION ALL

SELECT 'Dress', COUNT(*)
FROM "Dress"
WHERE organization_id = 'YOUR-ORG-ID'

UNION ALL

SELECT 'Customer', COUNT(*)
FROM "Customer"
WHERE organization_id = 'YOUR-ORG-ID';

-- Toutes les valeurs doivent être 0
```

---

## 🛡️ Sauvegardes

### AVANT de supprimer, faire une sauvegarde !

```bash
# Backup complet de la base de données
pg_dump -h localhost -U velvena_user -d velvena_db > backup_before_delete_$(date +%Y%m%d_%H%M%S).sql

# Backup d'une seule organisation (données uniquement)
pg_dump -h localhost -U velvena_user -d velvena_db \
  --data-only \
  --table='"User"' \
  --table='"Customer"' \
  --table='"Dress"' \
  > backup_org_data.sql
```

---

## ❓ FAQ

**Q : Peut-on annuler la suppression ?**
**R :** Non, la suppression est définitive. Faites une sauvegarde avant !

**Q : Que se passe-t-il avec les données Stripe ?**
**R :** Les données Stripe ne sont PAS supprimées automatiquement. Il faut annuler manuellement l'abonnement Stripe si nécessaire.

**Q : Peut-on supprimer plusieurs organisations à la fois ?**
**R :** Non, ces scripts suppriment une organisation à la fois. Pour supprimer plusieurs organisations, exécutez le script plusieurs fois.

**Q : Le script fonctionne-t-il sur une base de données de production ?**
**R :** Oui, mais **ATTENTION** : faites TOUJOURS une sauvegarde avant d'exécuter ce script en production !

**Q : Combien de temps prend la suppression ?**
**R :** Dépend de la quantité de données :
- Petite organisation (< 100 clients) : ~1 seconde
- Moyenne organisation (< 1000 clients) : ~5 secondes
- Grande organisation (> 5000 clients) : ~30 secondes

**Q : Y a-t-il un soft delete au lieu d'une suppression définitive ?**
**R :** Le modèle Organization a un champ `deleted_at`. Pour un soft delete :
```sql
UPDATE "Organization"
SET deleted_at = NOW()
WHERE id = 'YOUR-ORG-ID';
```

---

## ⚠️ Checklist Avant Suppression

- [ ] Confirmer avec le client que la suppression est définitive
- [ ] Faire une sauvegarde complète de la base de données
- [ ] Vérifier qu'il n'y a pas de contrats actifs importants
- [ ] Annuler l'abonnement Stripe si nécessaire
- [ ] Noter le slug/ID de l'organisation
- [ ] Tester le script sur une base de données de développement d'abord
- [ ] Vérifier les logs après suppression
- [ ] Confirmer que toutes les données sont bien supprimées

---

## 📞 Support

En cas de problème, contacter l'équipe de développement avant d'exécuter ces scripts en production.
