# Migration vers le système de templates dynamiques

## 🎯 Objectif

Rendre les templates de contrat **dynamiques et personnalisables** tout en gardant le système actuel fonctionnel.

## ✅ Modifications apportées

### 1. Base de données

#### Nouveaux champs dans `Organization`
```prisma
model Organization {
  // ... champs existants

  // Legal & Manager Information
  siret                String? // SIRET (ex: "98528788000014")
  manager_gender       String? // "Madame", "Monsieur", "Mx"
  manager_first_name   String? // Prénom du gérant
  manager_last_name    String? // Nom du gérant
  manager_title        String? // "gérante", "gérant", "directeur", etc.
}
```

### 2. Variables disponibles

Nouvelles variables ajoutées dans les templates :

```handlebars
<!-- Organisation -->
{{org.city}}                <!-- "Asnières-sur-Seine" -->
{{org.siret}}               <!-- "985 287 880 0014" -->
{{org.managerGender}}       <!-- "Madame" -->
{{org.managerFirstName}}    <!-- "Hassna" -->
{{org.managerLastName}}     <!-- "NAFILI" -->
{{org.managerFullName}}     <!-- "Hassna NAFILI" -->
{{org.managerTitle}}        <!-- "gérante" -->
{{org.managerInitials}}     <!-- "H. N." -->
```

### 3. Bloc de signature dynamique

**Avant (hardcodé) :**
```html
<p>Fait à Asnières-sur-Seine le {{today}}</p>
<p>H. N.</p>
```

**Après (dynamique) :**
```html
<p>Fait à <strong>{{org.city}}</strong> le <strong>{{today}}</strong></p>
<p><strong>{{org.managerInitials}}</strong></p>
```

## 📦 Étapes d'installation

### Étape 1 : Appliquer la migration de base de données

```bash
# Appliquer la migration SQL
npx prisma migrate dev --name add_organization_manager_fields

# Ou si vous utilisez déjà la migration créée
npx prisma migrate deploy
```

### Étape 2 : Générer le client Prisma

```bash
npx prisma generate
```

### Étape 3 : Migrer les données existantes

```bash
# Remplir les données pour ALLURE CRÉATION
npx tsx scripts/migrate-organization-manager-data.ts
```

Ce script va mettre à jour l'organisation avec :
- SIRET : `98528788000014`
- Gérant : `Madame Hassna NAFILI`
- Titre : `gérante`
- Ville : `Asnières-sur-Seine`

### Étape 4 : Tester le système

```bash
# Vérifier que les données ont été migrées
npx prisma studio
# → Ouvrir la table Organization et vérifier les nouveaux champs
```

## 🔧 Utilisation

### Pour l'organisation ALLURE CRÉATION

Les templates utiliseront automatiquement les données de l'organisation :

```typescript
// Dans generateContractPDF.ts
const templateData = prepareContractTemplateData(contract);

// templateData.org contiendra :
{
  name: "ALLURE CRÉATION",
  siret: "985 287 880 0014",
  city: "Asnières-sur-Seine",
  managerGender: "Madame",
  managerFullName: "Hassna NAFILI",
  managerInitials: "H. N.",
  // ...
}
```

### Pour d'autres organisations (multi-tenant)

Chaque organisation peut personnaliser ses propres informations via l'interface d'administration :

1. Aller dans **Paramètres > Organisation**
2. Remplir les champs :
   - SIRET
   - Genre du gérant
   - Prénom du gérant
   - Nom du gérant
   - Titre du gérant

### Fallbacks automatiques

Si une organisation n'a pas rempli ces champs, le système utilise des valeurs par défaut :

```typescript
org.city: orgCity || "Asnières-sur-Seine"
org.siret: organization.siret || "985 287 880 0014"
org.managerGender: managerGender || "Madame"
org.managerFirstName: managerFirstName || "Hassna"
org.managerLastName: managerLastName || "NAFILI"
org.managerTitle: organization.manager_title || "gérante"
org.managerInitials: managerInitials || "H. N."
```

## 📄 Exemple de template

Voir le fichier `examples/contract-template-negafa-dynamic.html` pour un exemple complet.

### Signature électronique

```handlebars
{{#if signature}}
  <!-- Affiche les métadonnées de signature -->
  <div class="signature-metadata">
    <p><strong>Signataire :</strong> {{client.fullName}}</p>
    <p><strong>Date/Heure :</strong> {{signature.date}}</p>
    <p><strong>IP :</strong> {{signature.ip}}</p>
    <p><strong>Localisation :</strong> {{signature.location}}</p>
  </div>
{{else}}
  <!-- Affiche le bloc de signature manuelle -->
  <p>Fait à <strong>{{org.city}}</strong> le <strong>{{today}}</strong></p>
  <div class="signature-grid">
    <div>
      <p>Signature client</p>
      <p>« Lu & approuvé »</p>
    </div>
    <div>
      <p>Signature prestataire</p>
      <p>« Lu & approuvé »</p>
      <p><strong>{{org.managerInitials}}</strong></p>
    </div>
  </div>
{{/if}}
```

## 🚀 Prochaines étapes

1. ✅ Migration de la base de données
2. ✅ Ajout des variables dynamiques
3. ✅ Service de préparation des données
4. ⏳ Interface d'administration pour modifier les infos de l'organisation
5. ⏳ Système de templates personnalisables par type de contrat
6. ⏳ Éditeur de templates (TipTap/Quill)

## 📚 Références

- **Service de données** : `src/services/templateDataService.ts`
- **Variables disponibles** : `src/types/templateVariables.ts`
- **Exemple de template** : `examples/contract-template-negafa-dynamic.html`
- **Migration SQL** : `prisma/migrations/.../migration.sql`
- **Script de migration** : `scripts/migrate-organization-manager-data.ts`

## ❓ Questions fréquentes

### Comment modifier les infos du gérant ?

Pour ALLURE CRÉATION, modifier directement en base :

```sql
UPDATE "Organization"
SET
  siret = '98528788000014',
  manager_gender = 'Madame',
  manager_first_name = 'Hassna',
  manager_last_name = 'NAFILI',
  manager_title = 'gérante'
WHERE slug = 'allure-creation';
```

Ou via Prisma Studio :
```bash
npx prisma studio
```

### Que se passe-t-il si les champs sont vides ?

Le système utilise des **fallbacks automatiques** vers les valeurs historiques d'ALLURE CRÉATION.

### Comment tester un template sans affecter la production ?

Utiliser l'endpoint de preview (à implémenter) :

```
GET /api/contract-templates/preview?contractId={id}&templateId={templateId}
```

## 🐛 Problèmes connus

Aucun pour l'instant. Signaler tout bug sur GitHub Issues.

---

**Auteur** : Système de templates dynamiques v1.0
**Date** : Janvier 2025
