# Guide d'Export de Données

## Vue d'ensemble

La fonctionnalité d'export de données permet aux organisations de télécharger l'intégralité de leurs données dans un fichier ZIP, conformément aux exigences RGPD de portabilité des données.

## Disponibilité

- **Plan requis :** Enterprise
- **Feature gate :** `export_data`

## Ce qui est exporté

Le fichier ZIP généré contient :

### 1. Contrats signés (PDFs)
- Tous les contrats avec statut `SIGNED`
- Fichiers PDF originaux signés
- Dossier : `contracts/`

### 2. Factures Stripe (PDFs + JSON)
- Toutes les factures Stripe de l'organisation
- PDFs individuels des factures
- Fichier de métadonnées JSON
- Dossier : `invoices/`

### 3. Clients (JSON + CSV)
- Liste complète des clients
- Format JSON pour import programmatique
- Format CSV pour tableurs
- Dossier : `clients/`

### 4. Prospects (JSON + CSV)
- Liste complète des prospects
- Formats JSON et CSV
- Dossier : `prospects/`

### 5. Manifest
- Fichier `MANIFEST.json` à la racine
- Contient les métadonnées de l'export
- Statistiques de l'export

## API Endpoints

### POST /data-export/create

Créer un nouvel export de données.

**Authentification :** Requise (JWT)

**Permissions :** Feature `export_data` requise (plan Enterprise)

**Response (200 OK) :**
```json
{
  "success": true,
  "message": "Data export created successfully",
  "fileName": "organization_<id>_<timestamp>.zip",
  "stats": {
    "contracts": 45,
    "invoices": 12,
    "clients": 230,
    "prospects": 67,
    "totalSize": 15728640
  },
  "downloadUrl": "/api/data-export/download/<filename>",
  "expiresAt": "2025-12-24T10:00:00.000Z"
}
```

**Response (403 Forbidden) :**
```json
{
  "success": false,
  "error": "Data export feature not available in your plan",
  "upgrade_required": "enterprise",
  "message": "Please upgrade to enterprise plan to export your data"
}
```

### GET /data-export/download/:filename

Télécharger un fichier d'export existant.

**Authentification :** Requise (JWT)

**Permissions :** Feature `export_data` requise

**Sécurité :**
- Le nom de fichier doit contenir l'ID de l'organisation
- Validation du chemin pour éviter les attaques directory traversal
- Fichiers expirés (>24h) sont automatiquement supprimés

**Response (200 OK) :**
- Type : `application/zip`
- Téléchargement direct du fichier ZIP

**Response (404 Not Found) :**
```json
{
  "success": false,
  "error": "Export file not found or has expired"
}
```

## Utilisation Frontend

### Exemple React/TypeScript

```typescript
import axios from 'axios';

// 1. Créer l'export
async function createDataExport() {
  try {
    const response = await axios.post('/data-export/create', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const { fileName, stats, downloadUrl, expiresAt } = response.data;

      console.log(`Export créé : ${stats.totalSize} bytes`);
      console.log(`Contrats : ${stats.contracts}`);
      console.log(`Clients : ${stats.clients}`);
      console.log(`Expire le : ${expiresAt}`);

      // Télécharger immédiatement
      window.location.href = downloadUrl;
    }
  } catch (error) {
    if (error.response?.status === 403) {
      alert('Mise à niveau vers Enterprise requise pour exporter vos données');
    } else {
      console.error('Erreur lors de l\'export:', error);
    }
  }
}

// 2. Télécharger un export existant
async function downloadExport(fileName: string) {
  try {
    const response = await axios.get(`/data-export/download/${fileName}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      responseType: 'blob' // Important pour les fichiers binaires
    });

    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
  }
}
```

### Composant d'export complet

```tsx
import React, { useState } from 'react';
import { Button, Alert, Progress } from '@/components/ui';

export function DataExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/data-export/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      // Télécharger automatiquement
      window.location.href = data.downloadUrl;

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleExport}
        disabled={loading}
        variant="outline"
      >
        {loading ? 'Export en cours...' : 'Exporter mes données'}
      </Button>

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">
        L'export inclut tous vos contrats, factures, clients et prospects.
        Le fichier ZIP expire après 24 heures.
      </p>
    </div>
  );
}
```

## Nettoyage Automatique

Les fichiers d'export sont automatiquement supprimés après **24 heures** par le scheduler quotidien (2h du matin).

### Nettoyage manuel (Admin)

```bash
POST /data-export/cleanup
```

## Sécurité

- ✅ Authentification JWT requise
- ✅ Vérification du plan d'abonnement (Enterprise)
- ✅ Validation du propriétaire du fichier
- ✅ Protection contre directory traversal
- ✅ Expiration automatique (24h)
- ✅ Nettoyage automatique quotidien

## Limites et Considérations

- **Taille maximale :** Dépend des données de l'organisation
- **Expiration :** 24 heures après création
- **Concurrence :** Un export à la fois recommandé
- **Stockage :** Fichiers temporaires dans `temp/exports/`

## Monitoring

Les métriques Prometheus suivantes sont disponibles :

- `data_exports_total{status="success|failure"}` - Nombre total d'exports
- `export_file_size_bytes` - Taille des fichiers d'export
- `export_duration_seconds` - Durée de création d'un export

## Recommandations

1. **Fréquence :** Exporter les données régulièrement (hebdomadaire/mensuel)
2. **Stockage :** Sauvegarder les exports dans un système de backup externe
3. **Vérification :** Tester la restauration des données exportées
4. **Documentation :** Consulter le fichier MANIFEST.json pour comprendre le contenu

## Support

Pour toute question ou problème :
- Consulter les logs du serveur
- Vérifier le statut du plan d'abonnement
- Contacter le support technique

## Conformité RGPD

Cette fonctionnalité respecte les exigences RGPD :
- ✅ Article 20 : Droit à la portabilité des données
- ✅ Format structuré et couramment utilisé (JSON, CSV, PDF)
- ✅ Lisible par machine
- ✅ Données complètes et exactes
