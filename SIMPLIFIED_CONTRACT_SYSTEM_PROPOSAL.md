# Proposition : Système de Contrats Simplifié et Unifié

## 🎯 Objectif

Créer un système **simple, maintenable et cohérent** pour gérer :
- Templates de contrats
- Génération PDF
- Signature électronique
- Prévisualisation frontend

**Principe clé** : **Une seule source de vérité** pour le template.

---

## ❌ Problèmes du système actuel

### 1. Multiples sources de vérité
- ✗ Template HTML stocké en DB (pour PDF)
- ✗ Template React/JSX en frontend (pour prévisualisation)
- ✗ Template pour signature électronique (Publiseal)
- ✗ Syntaxe Handlebars complexe à maintenir
- ✗ Données formatées différemment (snake_case backend, camelCase frontend)

### 2. Problèmes de maintenance
- ✗ Modification d'un template = modifier 3 endroits différents
- ✗ Risque d'incohérence entre PDF et prévisualisation
- ✗ Difficile de déboguer quand les données ne s'affichent pas
- ✗ L'utilisateur doit connaître la syntaxe Handlebars

### 3. Complexité pour l'utilisateur
- ✗ Doit gérer la syntaxe `{{variable}}`
- ✗ Doit connaître les noms exacts des variables (snake_case)
- ✗ Aucune validation en temps réel
- ✗ Erreurs cryptiques si syntaxe incorrecte

---

## ✅ Solution proposée : Système unifié avec éditeur visuel

### Architecture simplifiée

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Éditeur de Template Visuel (WYSIWYG)              │    │
│  │  - Blocs drag & drop (texte, tableau, conditions)  │    │
│  │  - Sélection variables via dropdown (pas syntaxe)  │    │
│  │  - Prévisualisation en temps réel                  │    │
│  │  - Validation automatique                          │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│         Sauvegarde en JSON structuré (pas HTML)             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES                          │
│                                                              │
│  contract_templates:                                        │
│  - id                                                       │
│  - name                                                     │
│  - structure: JSONB (blocs structurés)                     │
│  - html_cache: TEXT (généré automatiquement)              │
│  - version                                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│                                                              │
│  Template Engine unifié :                                   │
│  1. Lit structure JSON                                      │
│  2. Injecte données du contrat                             │
│  3. Génère HTML cohérent                                    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PDF         │  │  Signature   │  │  Email       │     │
│  │  (Puppeteer) │  │  (Publiseal) │  │  (HTML)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│       ▲                  ▲                  ▲               │
│       └──────────────────┴──────────────────┘               │
│              Même HTML généré                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Structure JSON du template (au lieu de HTML/Handlebars)

### Exemple de structure

```json
{
  "version": "2.0",
  "metadata": {
    "name": "Contrat de Location Standard",
    "description": "Template pour location de robes",
    "category": "location"
  },
  "sections": [
    {
      "id": "header",
      "type": "header",
      "content": {
        "title": "Contrat de Location",
        "subtitle": "Numéro {{contract_number}} - {{created_at}}"
      },
      "style": {
        "textAlign": "center",
        "fontSize": "24px"
      }
    },
    {
      "id": "client_info",
      "type": "info_block",
      "title": "Informations Client",
      "fields": [
        {
          "label": "Nom complet",
          "variable": "customer_firstname + customer_lastname",
          "display": "inline"
        },
        {
          "label": "Email",
          "variable": "customer_email"
        },
        {
          "label": "Téléphone",
          "variable": "customer_phone"
        }
      ]
    },
    {
      "id": "dresses_table",
      "type": "table",
      "title": "Robes incluses",
      "dataSource": "dresses",
      "columns": [
        { "header": "Nom", "field": "name" },
        { "header": "Type", "field": "type_name" },
        { "header": "Taille", "field": "size_name" },
        { "header": "Prix TTC", "field": "price_ttc", "format": "currency" }
      ],
      "showIf": "dresses.length > 0"
    },
    {
      "id": "terms",
      "type": "rich_text",
      "title": "Conditions Générales",
      "content": "<h3>Article 1 - Objet</h3><p>Le présent contrat...</p>"
    }
  ]
}
```

---

## 🎨 Interface Utilisateur Frontend

### Éditeur de Template Visuel

```
┌─────────────────────────────────────────────────────────────┐
│  📄 Contrat de Location Standard                  [Sauver] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐           ┌──────────────────────────────┐ │
│  │  Blocs     │           │  Prévisualisation            │ │
│  │            │           │                              │ │
│  │ ➕ En-tête │           │  CONTRAT DE LOCATION        │ │
│  │ ➕ Texte   │           │  N° CT-2025-001             │ │
│  │ ➕ Tableau │           │                              │ │
│  │ ➕ Info    │           │  Client: Marie Dupont       │ │
│  │ ➕ Prix    │           │  Email: marie@...           │ │
│  │ ➕ Liste   │           │                              │ │
│  │ ➕ Condition│          │  [...]                       │ │
│  │            │           │                              │ │
│  └────────────┘           └──────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Section sélectionnée: Informations Client          │  │
│  │                                                       │  │
│  │  Titre: [Informations Client        ]               │  │
│  │                                                       │  │
│  │  Champs:                                             │  │
│  │  • Nom complet                                       │  │
│  │    Variable: [▼ Prénom + Nom client]                │  │
│  │                                                       │  │
│  │  • Email                                             │  │
│  │    Variable: [▼ Email client]                       │  │
│  │                                                       │  │
│  │  [+ Ajouter un champ]                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Sélection de variables via Dropdown (pas de syntaxe manuelle)

```
┌────────────────────────────────────┐
│ Sélectionner une variable          │
├────────────────────────────────────┤
│ 📋 Contrat                         │
│   • Numéro de contrat              │
│   • Date de création               │
│   • Date de début                  │
│   • Date de fin                    │
│   • Type de contrat                │
│                                    │
│ 👤 Client                          │
│   • Prénom                         │
│   • Nom                            │
│   • Email                          │
│   • Téléphone                      │
│   • Adresse complète               │
│                                    │
│ 💰 Prix                            │
│   • Total HT                       │
│   • Total TTC                      │
│   • Acompte TTC                    │
│   • Caution TTC                    │
│                                    │
│ 👗 Robes (liste)                   │
│   • Nom de la robe                 │
│   • Type                           │
│   • Taille                         │
│   • Prix                           │
└────────────────────────────────────┘
```

---

## 🔧 Implémentation technique

### 1. Schéma de base de données mis à jour

```prisma
model ContractTemplate {
  id                String   @id @default(uuid())
  name              String
  description       String?
  contract_type_id  String
  organization_id   String

  // ✅ NOUVEAU : Structure JSON au lieu de HTML brut
  structure         Json     // Structure des blocs (éditable visuellement)
  html_cache        String?  @db.Text // HTML généré automatiquement (pour perf)

  is_default        Boolean  @default(false)
  is_active         Boolean  @default(true)
  version           Int      @default(1)

  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  created_by        String?
  updated_by        String?
  deleted_at        DateTime?
  deleted_by        String?

  contract_type     ContractType @relation(fields: [contract_type_id], references: [id])
  organization      Organization @relation(fields: [organization_id], references: [id])
  contracts         Contract[]   @relation("ContractToTemplate")

  @@unique([contract_type_id, organization_id, is_default])
}
```

### 2. Service de rendu unifié

```typescript
// src/services/templateRenderService.ts

interface TemplateStructure {
  version: string;
  metadata: {
    name: string;
    description?: string;
  };
  sections: Section[];
}

interface Section {
  id: string;
  type: 'header' | 'info_block' | 'table' | 'rich_text' | 'price_summary';
  title?: string;
  content?: any;
  fields?: Field[];
  columns?: Column[];
  dataSource?: string;
  showIf?: string; // Condition simple
  style?: Record<string, string>;
}

class UnifiedTemplateRenderer {
  /**
   * Rendre le template en HTML pour PDF, Email ou Signature
   */
  render(structure: TemplateStructure, contractData: any): string {
    let html = this.generateHTMLHeader();

    for (const section of structure.sections) {
      // Vérifier condition d'affichage
      if (section.showIf && !this.evaluateCondition(section.showIf, contractData)) {
        continue;
      }

      html += this.renderSection(section, contractData);
    }

    html += this.generateHTMLFooter();
    return html;
  }

  /**
   * Rendre une section selon son type
   */
  private renderSection(section: Section, data: any): string {
    switch (section.type) {
      case 'header':
        return this.renderHeader(section, data);
      case 'info_block':
        return this.renderInfoBlock(section, data);
      case 'table':
        return this.renderTable(section, data);
      case 'price_summary':
        return this.renderPriceSummary(section, data);
      case 'rich_text':
        return this.renderRichText(section, data);
      default:
        return '';
    }
  }

  private renderInfoBlock(section: Section, data: any): string {
    let html = `<div class="mb-6">`;
    html += `<h2 class="text-base font-semibold mb-3">${section.title}</h2>`;
    html += `<div class="grid gap-3 md:grid-cols-2">`;

    for (const field of section.fields || []) {
      const value = this.resolveVariable(field.variable, data);
      html += `
        <div>
          <p class="text-xs font-semibold uppercase text-gray-500">${field.label}</p>
          <p class="mt-1 text-sm text-gray-800">${value}</p>
        </div>
      `;
    }

    html += `</div></div>`;
    return html;
  }

  private renderTable(section: Section, data: any): string {
    const items = this.resolveVariable(section.dataSource!, data) || [];

    if (items.length === 0) return '';

    let html = `<div class="mb-6">`;
    html += `<h2 class="text-base font-semibold mb-3">${section.title}</h2>`;
    html += `<table class="w-full border-collapse">`;

    // Header
    html += `<thead><tr>`;
    for (const col of section.columns || []) {
      html += `<th class="border p-2 text-left">${col.header}</th>`;
    }
    html += `</tr></thead>`;

    // Rows
    html += `<tbody>`;
    for (const item of items) {
      html += `<tr>`;
      for (const col of section.columns || []) {
        let value = item[col.field];
        if (col.format === 'currency') {
          value = `${value} €`;
        }
        html += `<td class="border p-2">${value}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;

    return html;
  }

  /**
   * Résoudre une variable (ex: "customer_firstname + customer_lastname")
   */
  private resolveVariable(variablePath: string, data: any): any {
    // Simple concatenation
    if (variablePath.includes('+')) {
      const parts = variablePath.split('+').map(p => p.trim());
      return parts.map(p => this.getNestedValue(data, p) || '').join(' ');
    }

    // Nested path (ex: "org.name")
    return this.getNestedValue(data, variablePath);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  private evaluateCondition(condition: string, data: any): boolean {
    // Simple evaluation (ex: "dresses.length > 0")
    try {
      // Pour la sécurité, utiliser une whitelist de conditions
      if (condition.match(/^[\w.]+\.length\s*[><=]+\s*\d+$/)) {
        const [left, operator, right] = condition.match(/([\w.]+\.length)\s*([><=]+)\s*(\d+)/)!.slice(1);
        const value = this.resolveVariable(left, data);
        const target = parseInt(right);

        switch (operator) {
          case '>': return value > target;
          case '<': return value < target;
          case '>=': return value >= target;
          case '<=': return value <= target;
          case '==': return value == target;
          default: return false;
        }
      }
      return true;
    } catch {
      return true; // En cas d'erreur, afficher la section
    }
  }
}

export const templateRenderer = new UnifiedTemplateRenderer();
```

### 3. Génération PDF simplifiée

```typescript
// src/lib/generateContractPDF.ts

import { templateRenderer } from '../services/templateRenderService.js';
import { prepareContractTemplateData } from '../services/templateDataService.js';

export async function generateContractPDF(contract: any): Promise<Buffer> {
  // 1. Récupérer le template
  const template = await prisma.contractTemplate.findUnique({
    where: { id: contract.template_id }
  });

  // 2. Préparer les données
  const data = prepareContractTemplateData(contract);

  // 3. Rendre le HTML (MÊME MOTEUR que pour prévisualisation)
  const html = templateRenderer.render(template.structure, data);

  // 4. Générer le PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4' });
  await browser.close();

  return pdf;
}
```

### 4. Composant React Frontend

```typescript
// frontend/src/components/TemplateEditor/TemplateEditor.tsx

import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface TemplateEditorProps {
  initialStructure?: TemplateStructure;
  onSave: (structure: TemplateStructure) => void;
}

export function TemplateEditor({ initialStructure, onSave }: TemplateEditorProps) {
  const [structure, setStructure] = useState(initialStructure || defaultStructure);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [previewData, setPreviewData] = useState(mockContractData);

  const addSection = (type: Section['type']) => {
    const newSection = createSection(type);
    setStructure({
      ...structure,
      sections: [...structure.sections, newSection]
    });
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-screen">
      {/* Barre d'outils */}
      <div className="col-span-2 bg-gray-50 p-4">
        <h3 className="font-semibold mb-4">Ajouter un bloc</h3>
        <div className="space-y-2">
          <button onClick={() => addSection('header')} className="w-full btn">
            ➕ En-tête
          </button>
          <button onClick={() => addSection('info_block')} className="w-full btn">
            ➕ Informations
          </button>
          <button onClick={() => addSection('table')} className="w-full btn">
            ➕ Tableau
          </button>
          <button onClick={() => addSection('price_summary')} className="w-full btn">
            ➕ Prix
          </button>
          <button onClick={() => addSection('rich_text')} className="w-full btn">
            ➕ Texte libre
          </button>
        </div>
      </div>

      {/* Liste des sections (drag & drop) */}
      <div className="col-span-3 bg-white p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Sections du template</h3>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={structure.sections} strategy={verticalListSortingStrategy}>
            {structure.sections.map((section) => (
              <SectionItem
                key={section.id}
                section={section}
                isSelected={selectedSection?.id === section.id}
                onClick={() => setSelectedSection(section)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Éditeur de section */}
      <div className="col-span-3 bg-gray-50 p-4 overflow-y-auto">
        {selectedSection ? (
          <SectionEditor
            section={selectedSection}
            onChange={(updated) => updateSection(updated)}
            onDelete={() => deleteSection(selectedSection.id)}
          />
        ) : (
          <div className="text-gray-500 text-center mt-8">
            Sélectionnez une section pour l'éditer
          </div>
        )}
      </div>

      {/* Prévisualisation */}
      <div className="col-span-4 bg-white p-6 overflow-y-auto">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-semibold">Prévisualisation</h3>
          <button onClick={() => onSave(structure)} className="btn-primary">
            💾 Sauvegarder
          </button>
        </div>
        <div className="border rounded-lg p-6">
          <TemplatePreview structure={structure} data={previewData} />
        </div>
      </div>
    </div>
  );
}
```

### 5. Éditeur de champs avec dropdown

```typescript
// frontend/src/components/TemplateEditor/VariablePicker.tsx

const AVAILABLE_VARIABLES = {
  contract: [
    { label: 'Numéro de contrat', value: 'contract_number' },
    { label: 'Date de création', value: 'created_at' },
    { label: 'Date de début', value: 'start_datetime' },
    { label: 'Date de fin', value: 'end_datetime' },
    { label: 'Type de contrat', value: 'contract_type_name' },
  ],
  customer: [
    { label: 'Prénom', value: 'customer_firstname' },
    { label: 'Nom', value: 'customer_lastname' },
    { label: 'Prénom + Nom', value: 'customer_firstname + customer_lastname' },
    { label: 'Email', value: 'customer_email' },
    { label: 'Téléphone', value: 'customer_phone' },
    { label: 'Adresse', value: 'customer_address' },
    { label: 'Code postal', value: 'customer_postal_code' },
    { label: 'Ville', value: 'customer_city' },
  ],
  prices: [
    { label: 'Total HT', value: 'total_price_ht' },
    { label: 'Total TTC', value: 'total_price_ttc' },
    { label: 'Acompte TTC', value: 'account_ttc' },
    { label: 'Acompte payé', value: 'account_paid_ttc' },
    { label: 'Caution TTC', value: 'caution_ttc' },
    { label: 'Caution payée', value: 'caution_paid_ttc' },
  ],
  organization: [
    { label: 'Nom', value: 'org.name' },
    { label: 'Adresse', value: 'org.address' },
    { label: 'Ville', value: 'org.city' },
    { label: 'SIRET', value: 'org.siret' },
    { label: 'Manager', value: 'org.managerFullName' },
  ],
  arrays: [
    { label: 'Liste des robes', value: 'dresses', type: 'array' },
    { label: 'Options/Addons', value: 'addons', type: 'array' },
  ]
};

export function VariablePicker({ value, onChange }: VariablePickerProps) {
  return (
    <Select value={value} onChange={onChange}>
      <optgroup label="📋 Contrat">
        {AVAILABLE_VARIABLES.contract.map(v => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </optgroup>
      <optgroup label="👤 Client">
        {AVAILABLE_VARIABLES.customer.map(v => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </optgroup>
      <optgroup label="💰 Prix">
        {AVAILABLE_VARIABLES.prices.map(v => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </optgroup>
      <optgroup label="🏢 Organisation">
        {AVAILABLE_VARIABLES.organization.map(v => (
          <option key={v.value} value={v.value}>{v.label}</option>
        ))}
      </optgroup>
    </Select>
  );
}
```

---

## 📋 Plan de migration

### Phase 1 : Préparation (1-2 jours)
1. ✅ Créer la migration DB pour ajouter `structure: Json` et `html_cache`
2. ✅ Implémenter `UnifiedTemplateRenderer` backend
3. ✅ Créer des templates JSON par défaut (convertir les templates HTML actuels)

### Phase 2 : Backend (2-3 jours)
1. ✅ Modifier endpoints templates pour accepter structure JSON
2. ✅ Mettre à jour génération PDF pour utiliser `templateRenderer`
3. ✅ Mettre à jour signature électronique pour utiliser `templateRenderer`
4. ✅ Tester avec templates existants

### Phase 3 : Frontend - Éditeur visuel (3-4 jours)
1. ✅ Créer composant `TemplateEditor` avec drag & drop
2. ✅ Créer composant `SectionEditor` pour chaque type de bloc
3. ✅ Implémenter `VariablePicker` avec dropdown
4. ✅ Implémenter prévisualisation en temps réel
5. ✅ Intégrer avec API backend

### Phase 4 : Migration des templates existants (1 jour)
1. ✅ Script de conversion HTML → JSON
2. ✅ Tester tous les templates migrés
3. ✅ Valider cohérence PDF / Signature / Prévisualisation

### Phase 5 : Documentation et formation (1 jour)
1. ✅ Guide utilisateur éditeur de templates
2. ✅ Documentation technique pour développeurs
3. ✅ Vidéos de démonstration

---

## 🎁 Avantages du nouveau système

### Pour l'utilisateur final
✅ **Interface visuelle** - Pas besoin de connaître Handlebars
✅ **Drag & drop** - Réorganiser sections facilement
✅ **Prévisualisation temps réel** - Voir le résultat immédiatement
✅ **Validation automatique** - Erreurs détectées avant sauvegarde
✅ **Sélection variables** - Dropdown au lieu de syntaxe manuelle
✅ **Cohérence garantie** - PDF = Signature = Prévisualisation

### Pour les développeurs
✅ **Une seule source de vérité** - Structure JSON
✅ **Maintenabilité** - Code centralisé, pas dupliqué
✅ **Testabilité** - Facile de tester le rendu
✅ **Extensibilité** - Ajouter nouveaux types de blocs facilement
✅ **Type-safe** - Interfaces TypeScript
✅ **Debugging** - Erreurs claires et traçables

### Pour le business
✅ **Moins de bugs** - Système plus simple = moins d'erreurs
✅ **Formation rapide** - Interface intuitive
✅ **Autonomie** - Utilisateurs peuvent créer templates sans dev
✅ **Évolutivité** - Facile d'ajouter nouvelles fonctionnalités

---

## 🛠️ Bibliothèques recommandées

### Frontend
- **@dnd-kit/core** - Drag & drop moderne et accessible
- **react-hook-form** - Gestion formulaires éditeur
- **@tiptap/react** - Éditeur WYSIWYG pour texte riche
- **tailwindcss** - Styles (déjà utilisé)

### Backend
- **Aucune nouvelle lib** - Utilisation de ce qui existe déjà

---

## 📊 Comparaison avant/après

| Aspect | Avant (Handlebars) | Après (JSON + Éditeur) |
|--------|-------------------|------------------------|
| **Création template** | Écrire HTML + syntaxe Handlebars | Drag & drop visuel |
| **Modification** | Éditer code HTML | Interface visuelle |
| **Validation** | Au runtime (erreurs cryptiques) | Temps réel (clair) |
| **Cohérence** | 3 versions différentes | 1 seule source |
| **Formation** | 2-3 heures (syntaxe) | 15 minutes (WYSIWYG) |
| **Bugs** | Fréquents (syntaxe) | Rares (validé) |
| **Maintenance** | Complexe | Simple |

---

## 🚀 Recommandation

Je recommande **fortement** cette migration pour les raisons suivantes :

1. **ROI rapide** - 2 semaines de dev vs économie de dizaines d'heures de debug
2. **Scalabilité** - Système évolutif, facile d'ajouter nouveaux types de contrats
3. **User experience** - Utilisateurs autonomes, pas besoin de support technique
4. **Qualité** - Moins de bugs, cohérence garantie
5. **Modernité** - Stack technique actuelle et maintenable

---

## ❓ Questions ?

**Q: Peut-on garder les templates Handlebars existants ?**
R: Oui, on peut supporter les deux systèmes en parallèle le temps de la migration.

**Q: Est-ce que ça marche avec Publiseal (signature électronique) ?**
R: Oui, le même HTML généré sera envoyé à Publiseal, garantissant la cohérence.

**Q: Combien de temps pour implémenter ?**
R: 2 semaines full-time, ou 3-4 semaines en parallèle d'autres tâches.

**Q: C'est compatible avec le système actuel ?**
R: Oui, migration progressive possible, pas de big-bang.

---

## 📝 Conclusion

Le système actuel avec templates HTML/Handlebars est **trop complexe et difficile à maintenir**.

Le nouveau système proposé avec **éditeur visuel + structure JSON** est :
- ✅ Plus simple pour les utilisateurs
- ✅ Plus maintenable pour les développeurs
- ✅ Plus fiable (moins de bugs)
- ✅ Plus évolutif

**Recommandation finale : Migrer vers ce nouveau système** 🎯
