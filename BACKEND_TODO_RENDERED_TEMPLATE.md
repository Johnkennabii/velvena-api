# TODO Backend - Génération du rendered_template pour les contrats

**Date:** 20 Décembre 2025
**Priorité:** HAUTE
**Impact:** Pages publiques de signature de contrat

---

## 🎯 Objectif

Le frontend est **100% prêt** à afficher les templates créés par les utilisateurs dans l'interface de gestion. Cependant, le backend doit générer le champ `rendered_template` pour que cela fonctionne.

### État actuel

✅ **Frontend**
- Interface de création de templates fonctionnelle (`/gestion/contract-templates`)
- API client prête (`src/api/endpoints/contractTemplates.ts`)
- Page publique prête (`ContractSignPage.tsx`)
- Affichage du `rendered_template` en priorité (ligne 653)
- Boutons signature, téléchargement, impression fonctionnels
- Gestion de l'expiration du lien
- Fallback sur composants React si pas de template

❌ **Backend**
- Le champ `rendered_template` n'est pas généré lors de la création du contrat
- Les templates ne sont pas utilisés pour générer le HTML

---

## 📋 Ce que le backend doit faire

### 1. Lors de la CRÉATION d'un contrat

**Endpoint:** `POST /contracts`

**Étapes à ajouter après la création du contrat en base :**

```typescript
// 1. Récupérer le template associé
let template = null;

if (contract.template_id) {
  // Template spécifique choisi par l'utilisateur
  template = await db.contractTemplates.findById(contract.template_id);
} else if (contract.contract_type_id) {
  // Template par défaut pour ce type de contrat
  template = await db.contractTemplates.findFirst({
    where: {
      contract_type_id: contract.contract_type_id,
      is_default: true,
      is_active: true,
      deleted_at: null,
      OR: [
        { organization_id: contract.organization_id },
        { organization_id: null }, // Templates globaux
      ],
    },
    orderBy: {
      organization_id: 'desc', // Priorité aux templates de l'organisation
    },
  });
}

// 2. Si un template existe, générer le HTML
if (template && template.structure) {
  const templateData = prepareContractTemplateData(contract);
  const renderer = new TemplateRenderer();
  const html = renderer.render(template.structure, templateData);

  // 3. Stocker le HTML dans rendered_template
  await db.contracts.update({
    where: { id: contract.id },
    data: { rendered_template: html },
  });
}
```

### 2. Lors de la MISE À JOUR d'un contrat

**Endpoint:** `PUT /contracts/:id`

**Important :** Régénérer le `rendered_template` à chaque modification pour que les changements de prix, dates, robes, etc. soient reflétés.

```typescript
// Après la mise à jour du contrat
const updatedContract = await db.contracts.findById(id, {
  include: ['template', 'customer', 'dresses', 'addons', 'organization', 'contract_type'],
});

if (updatedContract.template_id || updatedContract.contract_type_id) {
  // Même logique que lors de la création
  const template = await findTemplate(updatedContract);

  if (template && template.structure) {
    const templateData = prepareContractTemplateData(updatedContract);
    const renderer = new TemplateRenderer();
    const html = renderer.render(template.structure, templateData);

    await db.contracts.update({
      where: { id: updatedContract.id },
      data: { rendered_template: html },
    });
  }
}
```

### 3. Fonction de préparation des données

**Référence :** `CONSIGNES_BACKEND_TEMPLATE_RENDERER.md` lignes 166-234

```typescript
function prepareContractTemplateData(contract: Contract): ContractTemplateData {
  return {
    // Contrat
    contract_number: contract.contract_number,
    created_at: formatDate(contract.created_at), // Format: DD/MM/YYYY
    start_datetime: formatDateTime(contract.start_datetime), // Format: DD/MM/YYYY HH:mm
    end_datetime: formatDateTime(contract.end_datetime),
    contract_type_name: contract.contract_type?.name || '',
    status: contract.status,
    deposit_payment_method: contract.deposit_payment_method || '',

    // Prix (TOUS EN STRING)
    total_price_ht: String(contract.total_price_ht || '0.00'),
    total_price_ttc: String(contract.total_price_ttc || '0.00'),
    account_ht: String(contract.account_ht || '0.00'),
    account_ttc: String(contract.account_ttc || '0.00'),
    account_paid_ht: String(contract.account_paid_ht || '0.00'),
    account_paid_ttc: String(contract.account_paid_ttc || '0.00'),
    caution_ht: String(contract.caution_ht || '0.00'),
    caution_ttc: String(contract.caution_ttc || '0.00'),
    caution_paid_ht: String(contract.caution_paid_ht || '0.00'),
    caution_paid_ttc: String(contract.caution_paid_ttc || '0.00'),

    // Client (snake_case)
    customer_firstname: contract.customer?.firstname || '',
    customer_lastname: contract.customer?.lastname || '',
    customer_email: contract.customer?.email || '',
    customer_phone: contract.customer?.phone || '',
    customer_address: contract.customer?.address || '',
    customer_postal_code: contract.customer?.postal_code || '',
    customer_city: contract.customer?.city || '',
    customer_country: contract.customer?.country || 'France',

    // Organisation (objet imbriqué)
    org: {
      name: contract.organization?.name || '',
      address: contract.organization?.address || '',
      city: contract.organization?.city || '',
      phone: contract.organization?.phone || '',
      email: contract.organization?.email || '',
      siret: contract.organization?.siret || '',
      managerFullName: contract.organization?.manager_full_name || '',
    },

    // Robes (array)
    dresses: contract.dresses?.map(d => ({
      name: d.name,
      reference: d.reference || '',
      type_name: d.type?.name || d.type_name || '',
      size_name: d.size?.name || d.size_name || '',
      color_name: d.color?.name || d.color_name || '',
      condition_name: d.condition?.name || d.condition_name || '',
      price_ht: String(d.price_ht || '0.00'),
      price_ttc: String(d.price_ttc || '0.00'),
    })) || [],

    // Addons (array)
    addons: contract.addons?.map(a => ({
      name: a.name,
      description: a.description || '',
      price_ttc: String(a.price_ttc || '0.00'),
      included: a.included || false,
    })) || [],
  };
}
```

### 4. Classe TemplateRenderer

**Référence complète :** `src/services/templateRenderer.ts` (frontend)

Le backend doit avoir une copie EXACTE de cette logique :

```typescript
class TemplateRenderer {
  render(structure: TemplateStructure, data: ContractTemplateData): string {
    let html = this.generateHTMLHeader(structure.metadata.name);

    for (const section of structure.sections) {
      // Vérifier condition d'affichage
      if (section.showIf && !this.evaluateCondition(section.showIf, data)) {
        continue;
      }

      // Rendre selon le type
      switch (section.type) {
        case 'header':
          html += this.renderHeader(section, data);
          break;
        case 'info_block':
          html += this.renderInfoBlock(section, data);
          break;
        case 'table':
          html += this.renderTable(section, data);
          break;
        case 'price_summary':
          html += this.renderPriceSummary(section, data);
          break;
        case 'rich_text':
          html += this.renderRichText(section, data);
          break;
        case 'list':
          html += this.renderList(section, data);
          break;
        case 'spacer':
          html += this.renderSpacer(section);
          break;
      }
    }

    html += this.generateHTMLFooter();
    return html;
  }

  // ... toutes les autres méthodes (voir CONSIGNES_BACKEND_TEMPLATE_RENDERER.md)
}
```

**⚠️ IMPORTANT :** Le CSS dans `generateHTMLHeader()` doit être **EXACTEMENT** le même que dans `src/services/templateRenderer.ts:38-210`.

---

## 🔍 Points de vérification

### API `GET /sign-links/:token`

**Vérifier que la réponse inclut `rendered_template` :**

```json
{
  "success": true,
  "data": {
    "id": "sign-link-id",
    "token": "xxx",
    "expires_at": "2025-12-25T10:00:00Z",
    "contract": {
      "id": "contract-id",
      "contract_number": "CT-2025-001",
      "rendered_template": "<html>...</html>", // ✅ DOIT ÊTRE LÀ
      "customer_firstname": "Marie",
      "customer_lastname": "Dupont",
      // ... autres champs
    }
  }
}
```

### API `POST /sign-links/:token/sign`

**Après signature, la réponse doit aussi inclure `rendered_template` :**

```json
{
  "success": true,
  "contract": {
    "id": "contract-id",
    "status": "SIGNED",
    "signed_at": "2025-12-20T14:30:00Z",
    "rendered_template": "<html>...</html>", // ✅ DOIT ÊTRE LÀ
    // ... autres champs
  }
}
```

---

## 🧪 Test du flux complet

### 1. Créer un template

```bash
# Via l'interface frontend
# Se connecter en tant qu'ADMIN/SUPER_ADMIN
# Aller dans Gestion > Templates de contrat
# Créer un nouveau template avec des sections
```

### 2. Créer un contrat avec ce template

```bash
# Via l'interface frontend
# Aller dans Contrats > Nouveau contrat
# Sélectionner le template créé
# Remplir les informations
# Créer le contrat
```

### 3. Vérifier que `rendered_template` est généré

```bash
# Dans la console backend, vérifier :
SELECT id, contract_number, template_id,
       LENGTH(rendered_template) as template_length
FROM contracts
WHERE id = 'contract-id';

# template_length devrait être > 0
```

### 4. Générer un lien de signature

```bash
# Via l'interface frontend
# Cliquer sur "Générer lien de signature"
```

### 5. Ouvrir le lien public

```bash
# Ouvrir le lien dans un navigateur
# Le template personnalisé devrait s'afficher
# Les informations client, robes, prix devraient être visibles
```

### 6. Signer le contrat

```bash
# Cliquer sur "Signer électroniquement"
# Accepter les conditions
# Confirmer
```

### 7. Télécharger le PDF

```bash
# Cliquer sur "Télécharger en PDF"
# Le PDF devrait avoir le même rendu que la page web
```

---

## 📊 Schéma de flux

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTILISATEUR CRÉE UN TEMPLATE                             │
│    Frontend: /gestion/contract-templates                    │
│    Backend: POST /contract-templates                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. UTILISATEUR CRÉE UN CONTRAT                              │
│    Frontend: /contrats/nouveau                              │
│    Backend: POST /contracts                                 │
│            ├─ Créer le contrat en BDD                       │
│            ├─ Charger le template (si template_id fourni)   │
│            ├─ Générer le HTML (TemplateRenderer.render())   │
│            └─ UPDATE contract SET rendered_template = html  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GÉNÉRATION DU LIEN DE SIGNATURE                          │
│    Backend: POST /contracts/:id/generate-signature          │
│            └─ Créer le sign_link avec token et expires_at   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CLIENT OUVRE LE LIEN PUBLIC                              │
│    Frontend: /verify-signature?token=xxx                    │
│    Backend: GET /sign-links/:token                          │
│            └─ Retourner le contrat avec rendered_template   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. AFFICHAGE DU TEMPLATE                                    │
│    Frontend: ContractSignPage.tsx                           │
│             ├─ Si rendered_template existe: l'afficher      │
│             ├─ Sinon: fallback sur composants React         │
│             ├─ Bouton "Signer électroniquement"             │
│             ├─ Gestion expiration du lien                   │
│             └─ Badge "Déjà signé" si signed_at existe       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SIGNATURE ÉLECTRONIQUE                                   │
│    Backend: POST /sign-links/:token/sign                    │
│            ├─ Marquer le contrat comme signé                │
│            ├─ Générer le PDF (avec rendered_template)       │
│            └─ Retourner le contrat avec rendered_template   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. TÉLÉCHARGEMENT DU PDF                                    │
│    Backend: GET /contracts/download/:id/:signature          │
│            └─ Retourner le PDF généré lors de la signature  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Points critiques

### 1. Tous les prix sont des STRINGS

```typescript
// ✅ BON
total_price_ttc: "1440.00"

// ❌ MAUVAIS
total_price_ttc: 1440.00
```

### 2. Format des dates

```typescript
created_at: "15/01/2025"           // DD/MM/YYYY
start_datetime: "20/02/2025 14:00" // DD/MM/YYYY HH:mm
```

### 3. Structure org imbriquée

```typescript
// ✅ BON
org: {
  name: "Velvena",
  address: "123 rue..."
}

// ❌ MAUVAIS
org_name: "Velvena"
```

### 4. CSS identique au frontend

Le CSS dans `generateHTMLHeader()` doit être **EXACTEMENT** le même que dans `src/services/templateRenderer.ts:38-210`.

**Toute modification dans le frontend doit être synchronisée avec le backend.**

---

## 📚 Documents de référence

1. **`CONTRACT_TEMPLATES_IMPLEMENTATION.md`** - Architecture du système de templates
2. **`CONTRACT_TEMPLATES_FRONTEND.md`** - Guide d'utilisation de l'interface
3. **`CONSIGNES_BACKEND_TEMPLATE_RENDERER.md`** - Spécifications détaillées du rendu (969 lignes)
4. **`src/services/templateRenderer.ts`** - Code source du renderer frontend (527 lignes)

---

## 🚀 Résumé des actions

### Backend doit implémenter :

- [ ] Copier la logique de `src/services/templateRenderer.ts`
- [ ] Créer la fonction `prepareContractTemplateData()`
- [ ] Modifier `POST /contracts` pour générer `rendered_template`
- [ ] Modifier `PUT /contracts/:id` pour régénérer `rendered_template`
- [ ] Vérifier que `GET /sign-links/:token` retourne `rendered_template`
- [ ] Vérifier que `POST /sign-links/:token/sign` retourne `rendered_template`
- [ ] Utiliser `rendered_template` pour générer le PDF lors de la signature

### Frontend est déjà prêt :

- [✅] Interface de création de templates
- [✅] API client pour les templates
- [✅] Page publique avec affichage du `rendered_template`
- [✅] Boutons signature, print, download
- [✅] Gestion expiration du lien
- [✅] Badge "Déjà signé"
- [✅] Fallback sur composants React si pas de template

---

## 📞 Contact

Si vous avez des questions ou besoin de clarifications, référez-vous aux documents mentionnés ci-dessus ou contactez l'équipe frontend.

**Fichiers à consulter :**
- `src/services/templateRenderer.ts` (527 lignes) - Logique complète de rendu
- `CONSIGNES_BACKEND_TEMPLATE_RENDERER.md` (969 lignes) - Spécifications détaillées
- `src/pages/Public/ContractSignPage.tsx` - Page publique de signature
