# Instructions Backend - Génération PDF des contrats

## 1. Utiliser le template_id du contrat

Actuellement, le frontend envoie correctement `template_id` lors de la création du contrat, mais le backend ne l'utilise pas pour la génération PDF.

**Action requise** :
- Lors de la génération PDF (endpoint `/contracts/{id}/generate-pdf`), récupérer le `template_id` du contrat
- Charger le template HTML depuis la base de données (table `contract_templates`)
- Compiler le template avec les données du contrat
- Générer le PDF à partir du HTML compilé

## 2. Structure des données à envoyer au template Handlebars

Le template utilise les variables suivantes. Toutes doivent être au format **snake_case** :

### Informations du contrat
```javascript
{
  contract_number: "CT-2025-001",           // String
  created_at: "15/01/2025",                 // String formaté DD/MM/YYYY
  start_datetime: "20/02/2025 14:00",       // String formaté DD/MM/YYYY HH:mm
  end_datetime: "22/02/2025 18:00",         // String formaté DD/MM/YYYY HH:mm
  contract_type_name: "Location",           // String
  status: "draft",                          // String
  deposit_payment_method: "Carte bancaire", // String

  // Prix (tous en String avec 2 décimales, sans le symbole €)
  total_price_ht: "1200.00",
  total_price_ttc: "1440.00",
  account_ht: "600.00",
  account_ttc: "720.00",
  account_paid_ht: "600.00",
  account_paid_ttc: "720.00",
  caution_ht: "500.00",
  caution_ttc: "600.00",
  caution_paid_ht: "0.00",
  caution_paid_ttc: "0.00"
}
```

### Informations client
**IMPORTANT** : Toutes les variables client doivent avoir le préfixe `customer_` (pas `client.`)

```javascript
{
  customer_firstname: "Marie",
  customer_lastname: "Dupont",
  customer_email: "marie.dupont@example.com",
  customer_phone: "06 12 34 56 78",
  customer_address: "123 rue de la Paix",
  customer_postal_code: "75001",
  customer_city: "Paris",
  customer_country: "France",
  customer_birthday: "01/01/1990"  // String formaté DD/MM/YYYY ou null
}
```

### Informations organisation
Structure imbriquée `org.*` :

```javascript
{
  org: {
    name: "Velvena",
    address: "456 avenue des Champs",
    city: "Paris 75008",
    phone: "01 23 45 67 89",
    email: "contact@velvena.com",
    siret: "123 456 789 00012",
    managerFullName: "Jean Martin"
  }
}
```

### Robes (array)
**IMPORTANT** : Les noms de champs dans `dresses[]` doivent être en snake_case

```javascript
{
  dresses: [
    {
      name: "Robe Mariée Princesse",
      reference: "RM-001",
      type_name: "Mariée",        // snake_case !
      size_name: "38",            // snake_case !
      color_name: "Blanc ivoire", // snake_case !
      condition_name: "Neuf",     // snake_case !
      price_ht: "800.00",
      price_ttc: "960.00"
    }
  ]
}
```

### Options/Addons (array)
```javascript
{
  addons: [
    {
      name: "Voile cathédrale",
      price_ttc: "150.00",  // String avec 2 décimales
      included: false       // Boolean
    },
    {
      name: "Retouches",
      price_ttc: "0.00",
      included: true
    }
  ]
}
```

## 3. Formatage des dates

**CRITIQUE** : Les dates doivent être formatées côté backend AVANT d'être envoyées au template.

- `created_at` : format `DD/MM/YYYY`
- `start_datetime` et `end_datetime` : format `DD/MM/YYYY HH:mm`
- `customer_birthday` : format `DD/MM/YYYY` ou `null`

**Ne pas envoyer** de dates ISO (ex: `2025-01-15T10:30:00Z`) car Handlebars n'a pas de helper de formatage par défaut.

## 4. Formatage des prix

Tous les prix doivent être des **String** avec exactement 2 décimales :
- ✅ `"1200.00"`
- ❌ `1200` (number)
- ❌ `"1200"` (pas de décimales)
- ❌ `"1200.00 €"` (pas de symbole)

Le symbole `€` est ajouté directement dans le template HTML.

## 5. Gestion des champs optionnels

Certains champs peuvent être `null` ou absents :
- `customer_birthday`
- `deposit_payment_method`
- Tous les champs de robes (`type_name`, `size_name`, `color_name`, `condition_name`)

Le template utilise `{{#if}}` pour gérer ces cas.

## 6. Structure complète de l'objet data pour Handlebars

```javascript
const templateData = {
  // Contrat
  contract_number: "CT-2025-001",
  created_at: "15/01/2025",
  start_datetime: "20/02/2025 14:00",
  end_datetime: "22/02/2025 18:00",
  contract_type_name: "Location",
  status: "draft",
  deposit_payment_method: "Carte bancaire",

  // Prix
  total_price_ht: "1200.00",
  total_price_ttc: "1440.00",
  account_ht: "600.00",
  account_ttc: "720.00",
  account_paid_ht: "600.00",
  account_paid_ttc: "720.00",
  caution_ht: "500.00",
  caution_ttc: "600.00",
  caution_paid_ht: "0.00",
  caution_paid_ttc: "0.00",

  // Client (préfixe customer_)
  customer_firstname: "Marie",
  customer_lastname: "Dupont",
  customer_email: "marie.dupont@example.com",
  customer_phone: "06 12 34 56 78",
  customer_address: "123 rue de la Paix",
  customer_postal_code: "75001",
  customer_city: "Paris",
  customer_country: "France",
  customer_birthday: null,

  // Organisation (objet imbriqué)
  org: {
    name: "Velvena",
    address: "456 avenue des Champs",
    city: "Paris 75008",
    phone: "01 23 45 67 89",
    email: "contact@velvena.com",
    siret: "123 456 789 00012",
    managerFullName: "Jean Martin"
  },

  // Robes (array)
  dresses: [
    {
      name: "Robe Mariée Princesse",
      reference: "RM-001",
      type_name: "Mariée",
      size_name: "38",
      color_name: "Blanc ivoire",
      condition_name: "Neuf",
      price_ht: "800.00",
      price_ttc: "960.00"
    }
  ],

  // Options (array)
  addons: [
    {
      name: "Voile cathédrale",
      price_ttc: "150.00",
      included: false
    }
  ]
};

// Compiler avec Handlebars
const compiledHtml = Handlebars.compile(templateHtml)(templateData);
```

## 7. Points d'attention

1. **Tous les champs doivent être en snake_case** (sauf l'objet `org` qui est imbriqué)
2. **Les dates doivent être pré-formatées** côté backend
3. **Les prix doivent être des strings** avec 2 décimales
4. **Les champs de robes** : `type_name`, `size_name`, `color_name`, `condition_name` (pas camelCase)
5. **Le frontend envoie déjà `template_id`** - il suffit de l'utiliser

## 8. Exemple de code backend (pseudo-code)

```javascript
async function generateContractPDF(contractId) {
  // 1. Récupérer le contrat avec toutes ses relations
  const contract = await db.query(`
    SELECT c.*,
           ct.name as contract_type_name,
           cu.firstname as customer_firstname,
           cu.lastname as customer_lastname,
           cu.email as customer_email,
           /* ... autres champs */
    FROM contracts c
    LEFT JOIN contract_types ct ON c.contract_type_id = ct.id
    LEFT JOIN customers cu ON c.customer_id = cu.id
    WHERE c.id = ?
  `, [contractId]);

  // 2. Récupérer le template
  const template = await db.query(`
    SELECT html_content
    FROM contract_templates
    WHERE id = ?
  `, [contract.template_id]);

  // 3. Formater les données
  const templateData = {
    contract_number: contract.contract_number,
    created_at: formatDate(contract.created_at, 'DD/MM/YYYY'),
    start_datetime: formatDate(contract.start_datetime, 'DD/MM/YYYY HH:mm'),
    end_datetime: formatDate(contract.end_datetime, 'DD/MM/YYYY HH:mm'),

    total_price_ht: parseFloat(contract.total_price_ht).toFixed(2),
    total_price_ttc: parseFloat(contract.total_price_ttc).toFixed(2),
    // ... autres prix

    customer_firstname: contract.customer_firstname,
    customer_lastname: contract.customer_lastname,
    // ... autres champs client

    org: await getOrganizationData(),
    dresses: await getContractDresses(contractId),
    addons: await getContractAddons(contractId)
  };

  // 4. Compiler le template
  const html = Handlebars.compile(template.html_content)(templateData);

  // 5. Générer le PDF
  const pdfBuffer = await generatePDFFromHtml(html);

  return pdfBuffer;
}
```

## 9. Checklist de vérification

- [ ] Le backend récupère `template_id` du contrat
- [ ] Le backend charge le HTML depuis la table `contract_templates`
- [ ] Toutes les dates sont formatées (DD/MM/YYYY ou DD/MM/YYYY HH:mm)
- [ ] Tous les prix sont des strings avec 2 décimales
- [ ] Les champs client utilisent le préfixe `customer_`
- [ ] Les champs de robes sont en snake_case (`type_name`, `size_name`, etc.)
- [ ] L'objet `org` est correctement structuré
- [ ] Les arrays `dresses` et `addons` sont inclus
- [ ] Le PDF généré affiche toutes les données correctement
