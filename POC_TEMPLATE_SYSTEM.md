# POC - Système de Templates Unifié

## 🎯 Objectif du POC

Démontrer un système simplifié de gestion de templates basé sur JSON au lieu de HTML/Handlebars.

**Avantages** :
- ✅ Structure JSON facile à éditer (futur éditeur visuel)
- ✅ Une seule source de vérité
- ✅ Validation automatique
- ✅ Cohérence PDF / Signature / Prévisualisation

---

## 🚀 Endpoints disponibles

### 1. Démo avec données fictives

```bash
GET http://localhost:3000/poc/template/demo
```

**Description** : Affiche un contrat de location avec des données de démonstration.

**Test rapide** :
```bash
curl http://localhost:3000/poc/template/demo > demo.html
open demo.html  # macOS
# ou
xdg-open demo.html  # Linux
# ou ouvrir demo.html dans navigateur
```

**Ou directement dans le navigateur** :
```
http://localhost:3000/poc/template/demo
```

---

### 2. Avec un vrai contrat

```bash
GET http://localhost:3000/poc/template/contract/:contractId
```

**Description** : Affiche un contrat avec les vraies données d'un contrat existant.

**Exemple** :
```bash
# Remplacer CONTRACT_ID par un ID réel
curl http://localhost:3000/poc/template/contract/CONTRACT_ID > contract.html
open contract.html
```

**Ou dans le navigateur** :
```
http://localhost:3000/poc/template/contract/VOTRE_CONTRACT_ID
```

---

### 3. Obtenir la structure JSON du template

```bash
GET http://localhost:3000/poc/template/structure
```

**Description** : Retourne la structure JSON du template (pour édition future).

**Exemple** :
```bash
curl http://localhost:3000/poc/template/structure | jq
```

**Résultat** :
```json
{
  "success": true,
  "data": {
    "version": "2.0",
    "metadata": {
      "name": "Contrat de Location Simple",
      "description": "Template simplifié pour location de robes"
    },
    "sections": [
      {
        "id": "header",
        "type": "header",
        "title": "Contrat de Location",
        "subtitle": "Contrat n° {{contract_number}} — {{created_at}}"
      },
      ...
    ]
  }
}
```

---

### 4. Valider/Sauvegarder une structure de template

```bash
POST http://localhost:3000/poc/template/structure
Content-Type: application/json

{
  "structure": {
    "version": "2.0",
    "metadata": { ... },
    "sections": [ ... ]
  }
}
```

**Description** : Valide une structure de template (simulation de sauvegarde).

**Exemple avec curl** :
```bash
curl -X POST http://localhost:3000/poc/template/structure \
  -H "Content-Type: application/json" \
  -d @examples/template-location-simple.json
```

---

## 📋 Structure d'un template JSON

Un template est composé de **sections** de différents types.

### Types de sections disponibles

#### 1. **header** - En-tête du contrat
```json
{
  "id": "header",
  "type": "header",
  "title": "Contrat de Location",
  "subtitle": "Contrat n° {{contract_number}} — {{created_at}}",
  "style": {
    "textAlign": "center",
    "marginBottom": "2rem"
  }
}
```

#### 2. **info_block** - Bloc d'informations (grille 2 colonnes)
```json
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
}
```

**Variables supportées** :
- `customer_firstname`, `customer_lastname`, `customer_email`, `customer_phone`
- `customer_address`, `customer_postal_code`, `customer_city`
- `contract_number`, `created_at`, `start_datetime`, `end_datetime`
- `contract_type_name`, `deposit_payment_method`
- `org.name`, `org.address`, `org.city`, `org.siret`, `org.managerFullName`

**Concaténation** : `"customer_firstname + customer_lastname"` → "Marie Dupont"

#### 3. **table** - Tableau (robes, options, etc.)
```json
{
  "id": "dresses_table",
  "type": "table",
  "title": "Robes incluses",
  "dataSource": "dresses",
  "showIf": "dresses.length > 0",
  "columns": [
    { "header": "Nom", "field": "name", "align": "left" },
    { "header": "Type", "field": "type_name", "align": "left" },
    { "header": "Prix TTC", "field": "price_ttc", "format": "currency", "align": "right" }
  ]
}
```

**Data sources disponibles** :
- `dresses` - Liste des robes
- `addons` - Liste des options/addons

**Formats** :
- `text` (par défaut)
- `currency` (ajoute " €" après la valeur)
- `date`
- `datetime`

#### 4. **price_summary** - Récapitulatif financier
```json
{
  "id": "price_summary",
  "type": "price_summary",
  "title": "Récapitulatif financier"
}
```

Affiche automatiquement :
- Total HT / TTC
- Acompte demandé / payé
- Caution demandée / payée

#### 5. **rich_text** - Texte libre (HTML)
```json
{
  "id": "terms",
  "type": "rich_text",
  "title": "Conditions Générales",
  "content": "<p>Le présent contrat...</p><p>Article 1...</p>"
}
```

Supporte :
- Interpolation de variables : `{{customer_firstname}}`
- HTML : `<p>`, `<h3>`, `<strong>`, `<ul>`, `<li>`, etc.

#### 6. **divider** - Séparateur horizontal
```json
{
  "id": "divider_1",
  "type": "divider"
}
```

---

## 🧪 Tests

### Test 1 : Afficher le template de démo

```bash
# Dans votre navigateur
http://localhost:3000/poc/template/demo
```

**Résultat attendu** : Page HTML avec :
- En-tête du contrat
- Informations client (Marie Dupont)
- Détails du contrat
- Tableau des robes (2 robes)
- Tableau des options (voile + retouches)
- Récapitulatif financier
- Conditions générales

---

### Test 2 : Afficher avec un vrai contrat

1. Récupérer un ID de contrat dans votre base de données :
```bash
# Dans psql ou via API
SELECT id, contract_number FROM "Contract" LIMIT 1;
```

2. Tester avec cet ID :
```bash
http://localhost:3000/poc/template/contract/VOTRE_ID
```

**Résultat attendu** : Les vraies données du contrat s'affichent.

---

### Test 3 : Récupérer la structure JSON

```bash
curl http://localhost:3000/poc/template/structure | jq
```

**Résultat attendu** : Structure JSON complète du template.

---

### Test 4 : Comparer avec l'ancien système

**Ancien système (Handlebars)** :
```html
<!-- Compliqué, fragile -->
<p>Client: {{client.firstname}} {{client.lastname}}</p>
{{#if contract.dresses}}
  {{#each contract.dresses}}
    <tr>
      <td>{{this.name}}</td>
      <td>{{this.typeName}}</td>  <!-- ❌ Erreur si snake_case -->
    </tr>
  {{/each}}
{{/if}}
```

**Nouveau système (JSON)** :
```json
{
  "type": "info_block",
  "fields": [
    {
      "label": "Client",
      "variable": "customer_firstname + customer_lastname"
    }
  ]
}
```
✅ Plus simple, validé automatiquement

---

## 🎨 Prochaines étapes (si on continue)

1. **Éditeur visuel frontend** :
   - Drag & drop des sections
   - Sélection variables via dropdown
   - Prévisualisation temps réel

2. **Migration de la DB** :
   - Ajouter colonne `structure: Json` à `ContractTemplate`
   - Convertir templates existants HTML → JSON

3. **Intégration avec Puppeteer** :
   - Utiliser le même renderer pour générer PDF

4. **Intégration avec Publiseal** :
   - Envoyer le même HTML généré pour signature

---

## 💡 Avantages démontrés par ce POC

### ✅ Simplicité
- Pas besoin de connaître Handlebars
- Structure claire et lisible
- Facile à modifier

### ✅ Validation
- Erreurs détectées avant l'affichage
- Structure typée (TypeScript)
- Impossible de casser le template

### ✅ Cohérence
- 1 seule source de vérité (JSON)
- Même rendu partout (PDF = Signature = Preview)
- Pas de divergence frontend/backend

### ✅ Maintenabilité
- Code centralisé (`UnifiedTemplateRenderer`)
- Facile d'ajouter nouveaux types de sections
- Tests unitaires simples

---

## 📁 Fichiers créés pour le POC

```
src/
├── services/
│   └── unifiedTemplateRenderer.ts   # ⭐ Moteur de rendu unifié
├── controllers/
│   └── pocTemplateController.ts     # Endpoints POC
└── routes/
    └── pocTemplateRoutes.ts         # Routes POC

examples/
└── template-location-simple.json    # ⭐ Template JSON d'exemple

docs/
├── SIMPLIFIED_CONTRACT_SYSTEM_PROPOSAL.md  # Proposition complète
└── POC_TEMPLATE_SYSTEM.md                  # Ce fichier
```

---

## 🤔 Questions / Feedback

### Comment modifier le template ?

**Option 1** : Éditer le JSON directement
```bash
# Éditer examples/template-location-simple.json
# Puis recharger http://localhost:3000/poc/template/demo
```

**Option 2** : Via API (future)
```bash
POST /poc/template/structure
{
  "structure": { ... }
}
```

### Comment ajouter un nouveau type de section ?

1. Ajouter le type dans `src/services/unifiedTemplateRenderer.ts`
2. Implémenter la méthode `renderXXX()`
3. Utiliser dans le JSON

Exemple pour ajouter un type "signature" :
```typescript
// Dans unifiedTemplateRenderer.ts
private renderSignature(section: Section, data: any): string {
  return `
    <div class="signature-block">
      <p>Signature du client : _______________</p>
      <p>Date : ${data.created_at}</p>
    </div>
  `;
}

// Ajouter dans renderSection()
case 'signature':
  return this.renderSignature(section, data);
```

---

## 🎯 Conclusion

Ce POC démontre qu'un système basé sur **JSON + éditeur visuel** est :
- **Plus simple** pour les utilisateurs (pas de syntaxe à apprendre)
- **Plus fiable** (validation automatique)
- **Plus maintenable** (code centralisé)
- **Plus cohérent** (même rendu partout)

**Prêt à implémenter le système complet ?** 🚀
