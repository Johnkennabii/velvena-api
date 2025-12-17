# Documentation Backend - Système de Templates Unifié

## 🎯 Vue d'ensemble

Le système de templates unifié permet de gérer les templates de contrats via des **structures JSON** au lieu de HTML/Handlebars brut.

**Statut actuel** : ✅ **COMPLÈTEMENT OPÉRATIONNEL**

---

## 📁 Architecture

```
Backend
├── src/services/
│   ├── unifiedTemplateRenderer.ts      ⭐ Moteur de rendu unifié
│   └── templateDataService.ts          📊 Préparation des données
│
├── src/controllers/
│   ├── contractTemplateController.ts   🎛️ CRUD templates
│   └── pocTemplateController.ts        🧪 Endpoints de test/démo
│
├── src/lib/
│   └── generateContractPDF.ts          📄 Génération PDF (intégré)
│
└── prisma/
    └── schema.prisma                   🗄️ Modèle de données

Scripts
├── scripts/
│   ├── insert-json-template.ts         📝 Insérer template JSON
│   └── convert-all-templates-to-json.ts 🔄 Conversion automatique
```

---

## 🗄️ Modèle de données

### Table `ContractTemplate`

```prisma
model ContractTemplate {
  id               String   @id @default(uuid())
  name             String
  description      String?
  contract_type_id String
  organization_id  String?

  // ✨ NOUVEAU SYSTÈME
  structure        Json?            // Structure JSON du template
  html_cache       String?  @db.Text // Cache HTML généré (performance)

  // 📜 LEGACY (optionnel)
  content          String?  @db.Text // HTML Handlebars (rétro-compatibilité)

  is_active        Boolean  @default(true)
  is_default       Boolean  @default(false)
  version          Int      @default(1)

  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
  deleted_at       DateTime?

  // Relations
  contract_type    ContractType  @relation(...)
  organization     Organization? @relation(...)
  contracts        Contract[]    @relation("ContractToTemplate")

  @@unique([contract_type_id, organization_id, is_default])
}
```

---

## 🚀 Fonctionnalités implémentées

### 1. ✅ Rendu unifié (UnifiedTemplateRenderer)

**Fichier** : `src/services/unifiedTemplateRenderer.ts`

**Fonction principale** :
```typescript
templateRenderer.render(structure: TemplateStructure, data: any): string
```

**Types de sections supportés** :
- `header` - En-tête du contrat
- `info_block` - Bloc d'informations (grille 2 colonnes)
- `table` - Tableaux (robes, options, etc.)
- `price_summary` - Récapitulatif financier
- `rich_text` - Texte HTML libre
- `divider` - Séparateur horizontal

**Exemple d'utilisation** :
```typescript
import { templateRenderer } from "../services/unifiedTemplateRenderer.js";

const html = templateRenderer.render(template.structure, contractData);
```

---

### 2. ✅ Cache HTML automatique

**Comment ça fonctionne** :
1. Lors de la génération PDF, le HTML est rendu depuis `structure`
2. Le HTML est sauvegardé dans `html_cache` (en arrière-plan)
3. Le cache est **invalidé automatiquement** lors de la mise à jour du template

**Code** (`src/lib/generateContractPDF.ts:476-481`) :
```typescript
prisma.contractTemplate.update({
  where: { id: template.id },
  data: { html_cache: html }
}).catch(err => {
  logger.warn({ err }, "Failed to update template HTML cache");
});
```

**Invalidation du cache** (`src/controllers/contractTemplateController.ts:261`) :
```typescript
...((content || structure) && { html_cache: null }),
```

---

### 3. ✅ Compatibilité backward (Legacy)

Le système supporte **deux modes** :

#### Mode JSON (nouveau)
Si `template.structure` existe :
```typescript
if (template.structure) {
  html = templateRenderer.render(template.structure, contractData);
}
```

#### Mode HTML/Handlebars (legacy)
Si seulement `template.content` existe :
```typescript
else {
  html = renderContractTemplate(template.content, contract);
}
```

**Avantage** : Pas de breaking change, migration progressive possible.

---

### 4. ✅ API REST complète

#### Créer un template (JSON OU HTML)

```http
POST /contract-templates
Content-Type: application/json

{
  "name": "Mon Template",
  "description": "Description",
  "contract_type_id": "uuid",
  "structure": {
    "version": "2.0",
    "metadata": { ... },
    "sections": [ ... ]
  },
  "is_default": true
}
```

**Ou avec HTML legacy** :
```json
{
  "name": "Mon Template Legacy",
  "content": "<html>...</html>",
  ...
}
```

#### Mettre à jour un template

```http
PATCH /contract-templates/:id
Content-Type: application/json

{
  "name": "Nouveau nom",
  "structure": { ... }  // Le cache sera invalidé automatiquement
}
```

#### Obtenir tous les templates

```http
GET /contract-templates
```

**Filtres disponibles** :
- `?contract_type_id=uuid` - Filtrer par type de contrat
- `?is_active=true` - Uniquement les templates actifs

---

### 5. ✅ Scripts de gestion

#### Insérer/Mettre à jour un template JSON

```bash
npx tsx scripts/insert-json-template.ts
```

**Ce que fait le script** :
- Charge `examples/template-location-simple.json`
- Trouve ou crée le template pour le type "Location"
- Met à jour avec la structure JSON
- Définit comme template par défaut

#### Convertir tous les templates HTML → JSON

```bash
npx tsx scripts/convert-all-templates-to-json.ts
```

**Ce que fait le script** :
- Trouve tous les templates avec `content` mais sans `structure`
- Convertit en structure JSON basique (section `rich_text`)
- Met à jour la version
- Affiche un rapport de conversion

**Résultat actuel** :
```
✅ Convertis: 1 (Contrat Forfait)
📋 Total: 2 templates dans le système
```

---

## 📊 Structure JSON d'un template

### Format complet

```json
{
  "version": "2.0",
  "metadata": {
    "name": "Contrat de Location Simple",
    "description": "Template pour location de robes",
    "category": "location"
  },
  "sections": [
    {
      "id": "header",
      "type": "header",
      "title": "Contrat de Location",
      "subtitle": "Contrat n° {{contract_number}} — {{created_at}}",
      "style": {
        "textAlign": "center"
      }
    },
    {
      "id": "client_info",
      "type": "info_block",
      "title": "Informations Client",
      "fields": [
        {
          "label": "Nom complet",
          "variable": "customer_firstname + customer_lastname"
        },
        {
          "label": "Email",
          "variable": "customer_email"
        }
      ]
    },
    {
      "id": "dresses_table",
      "type": "table",
      "title": "Robes incluses",
      "dataSource": "dresses",
      "showIf": "dresses.length > 0",
      "columns": [
        { "header": "Nom", "field": "name" },
        { "header": "Prix TTC", "field": "price_ttc", "format": "currency" }
      ]
    },
    {
      "id": "price_summary",
      "type": "price_summary",
      "title": "Récapitulatif financier"
    }
  ]
}
```

### Variables disponibles

**Contrat** :
- `contract_number`, `created_at`, `start_datetime`, `end_datetime`
- `contract_type_name`, `deposit_payment_method`, `status`

**Client** :
- `customer_firstname`, `customer_lastname`, `customer_email`, `customer_phone`
- `customer_address`, `customer_postal_code`, `customer_city`, `customer_country`

**Prix** :
- `total_price_ht`, `total_price_ttc`
- `account_ht`, `account_ttc`, `account_paid_ht`, `account_paid_ttc`
- `caution_ht`, `caution_ttc`, `caution_paid_ht`, `caution_paid_ttc`

**Organisation** (imbriqué) :
- `org.name`, `org.address`, `org.city`, `org.phone`, `org.email`
- `org.siret`, `org.managerFullName`

**Listes** :
- `dresses[]` - Robes du contrat
- `addons[]` - Options/compléments

---

## 🧪 Tests et validation

### Endpoints de test (POC)

#### Démo avec données fictives
```http
GET http://localhost:3000/poc/template/demo
```

#### Avec un vrai contrat
```http
GET http://localhost:3000/poc/template/contract/:contractId
```

#### Obtenir la structure JSON
```http
GET http://localhost:3000/poc/template/structure
```

### Vérifier les templates dans la DB

```sql
-- Voir tous les templates avec leur type
SELECT
  id,
  name,
  version,
  CASE
    WHEN structure IS NOT NULL THEN 'JSON'
    WHEN content IS NOT NULL THEN 'HTML'
    ELSE 'EMPTY'
  END as type,
  is_default,
  is_active
FROM "ContractTemplate"
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

**Résultat actuel** :
```
id                                   | name                          | version | type | is_default
-------------------------------------|-------------------------------|---------|------|------------
2f63b5a2-ef1a-4183-a2e3-66df8a5700cd | Contrat de Location Simple    | 5       | JSON | true
0733a902-39a5-4c24-a6f2-eef409967300 | Contrat Forfait               | 3       | JSON | true
```

---

## 📝 Logs et debugging

### Logs de génération PDF

Lors de la génération PDF, vérifier les logs pour savoir quel système est utilisé :

```
✨ Utilisation du template dynamique pour générer le PDF
🚀 Utilisation du système de template JSON unifié  ← NOUVEAU
```

Ou

```
✨ Utilisation du template dynamique pour générer le PDF
📝 Utilisation du système Handlebars (legacy)      ← ANCIEN
```

### Activer les logs détaillés

Dans `src/lib/logger.js`, définir le niveau :
```javascript
level: process.env.LOG_LEVEL || 'debug'
```

---

## ⚠️ Points d'attention

### 1. Contrainte unique

La contrainte `@@unique([contract_type_id, organization_id, is_default])` impose :
- **1 seul** template par défaut par (type de contrat + organisation)

**Solution** : Utiliser des transactions (déjà implémenté)

### 2. Migration progressive

**Ne pas supprimer** le champ `content` immédiatement :
- Certains templates peuvent encore l'utiliser
- La compatibilité backward est assurée
- Migration progressive = 0 downtime

### 3. Cache HTML

Le cache `html_cache` est **optionnel et opportuniste** :
- Il n'est pas obligatoire pour le rendu
- Il est régénéré automatiquement
- Il est invalidé lors des mises à jour

---

## 🚀 Prochaines étapes possibles

### Court terme (Backend - optionnel)
- [ ] **Pré-génération du cache** lors de la création de template
- [ ] **Endpoint de validation** de structure JSON
- [ ] **Versioning avancé** des templates (historique des versions)
- [ ] **Templates globaux** (partagés entre organisations)

### Long terme (Frontend)
- [ ] **Éditeur visuel** drag & drop (voir `SIMPLIFIED_CONTRACT_SYSTEM_PROPOSAL.md`)
- [ ] **Prévisualisation temps réel** des templates
- [ ] **Bibliothèque de sections** réutilisables
- [ ] **Import/Export** de templates JSON

---

## 📚 Fichiers de référence

| Fichier | Description |
|---------|-------------|
| `SIMPLIFIED_CONTRACT_SYSTEM_PROPOSAL.md` | 📖 Proposition système complet (23 pages) |
| `POC_TEMPLATE_SYSTEM.md` | 🧪 Guide d'utilisation du POC |
| `POC_README.md` | 📋 Guide de démarrage rapide |
| `BACKEND_PDF_INSTRUCTIONS.md` | 📄 Spécifications frontend pour PDF |
| `examples/template-location-simple.json` | 📝 Exemple de template JSON complet |

---

## ✅ Checklist de déploiement

### Avant déploiement

- [x] Migration DB appliquée (`structure`, `html_cache`)
- [x] Templates existants convertis en JSON
- [x] Tests de génération PDF OK
- [x] Cache HTML fonctionnel
- [x] Compatibilité backward vérifiée

### Après déploiement

- [ ] Surveiller les logs (nouveau vs legacy)
- [ ] Vérifier génération PDF des contrats
- [ ] Tester signature électronique
- [ ] Valider avec vrais contrats en production

---

## 🎉 Conclusion

Le système de templates unifié est **complètement opérationnel** côté backend :

✅ **Structure JSON** - Système moderne et maintenable
✅ **Cache HTML** - Performance optimisée
✅ **Compatibilité** - Migration sans breaking change
✅ **Scripts** - Gestion et conversion automatiques
✅ **Documentation** - Complète et à jour

**Prêt pour la production !** 🚀

---

**Créé le** : 15 décembre 2024
**Version** : 1.0
**Auteur** : Claude Code (Anthropic)
