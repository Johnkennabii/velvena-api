# Guide d'Intégration Frontend - Export de Données

## Vue d'ensemble

Ce guide vous aide à intégrer la fonctionnalité d'export de données dans votre interface utilisateur Velvena.

**Contrôle d'accès :**
- Disponible pour tous les plans d'abonnement
- Requiert un rôle de gestion : MANAGER, ADMIN ou SUPER_ADMIN
- Les utilisateurs avec le rôle USER ne peuvent pas exporter les données

## Interface Utilisateur Recommandée

### Emplacement

L'export de données devrait être accessible depuis :
1. **Paramètres du compte** (`/settings/data`)
2. **Section Facturation** (`/billing`)
3. **Dashboard principal** (bouton dans le menu)

### Design Pattern

```
┌─────────────────────────────────────────────┐
│ 📊 Export de données                        │
├─────────────────────────────────────────────┤
│                                             │
│ Exportez toutes vos données dans un         │
│ fichier ZIP pour sauvegarder ou migrer      │
│ vos informations.                           │
│                                             │
│ ✅ Contrats signés (PDF)                    │
│ ✅ Factures Stripe (PDF + métadonnées)      │
│ ✅ Clients (JSON + CSV)                     │
│ ✅ Prospects (JSON + CSV)                   │
│                                             │
│ ⚠️  Le fichier expire après 24 heures       │
│                                             │
│ [📥 Exporter mes données]                   │
│                                             │
│ Dernière mise à jour : il y a 2 semaines    │
└─────────────────────────────────────────────┘
```

## Implémentation React + TypeScript

### 1. Hook personnalisé pour l'export

```typescript
// hooks/useDataExport.ts
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ExportStats {
  contracts: number;
  invoices: number;
  clients: number;
  prospects: number;
  totalSize: number;
}

interface ExportResult {
  success: boolean;
  fileName?: string;
  stats?: ExportStats;
  downloadUrl?: string;
  expiresAt?: string;
  error?: string;
  upgrade_required?: string;
}

export function useDataExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createExport = async (): Promise<ExportResult | null> => {
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

      const data: ExportResult = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // Permissions insuffisantes
          const requiredRoles = data.required_roles?.join(', ') || 'MANAGER, ADMIN, SUPER_ADMIN';
          toast({
            title: "Permissions insuffisantes",
            description: `Cette action nécessite un des rôles suivants : ${requiredRoles}`,
            variant: "destructive",
          });
          setError(data.error || "Permissions insuffisantes");
          return null;
        }

        throw new Error(data.error || 'Export failed');
      }

      toast({
        title: "Export créé avec succès",
        description: `${data.stats?.contracts || 0} contrats, ${data.stats?.clients || 0} clients exportés`,
      });

      return data;

    } catch (err: any) {
      const message = err.message || 'Erreur lors de l\'export';
      setError(message);
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      return null;

    } finally {
      setLoading(false);
    }
  };

  const downloadExport = (fileName: string) => {
    // Simple redirect pour télécharger
    window.location.href = `/data-export/download/${fileName}`;
  };

  return {
    loading,
    error,
    createExport,
    downloadExport,
  };
}
```

### 2. Composant DataExportCard

```typescript
// components/DataExportCard.tsx
import React from 'react';
import { Download, Package, FileText, Users, UserPlus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataExport } from '@/hooks/useDataExport';
import { useAuth } from '@/hooks/useAuth'; // Hook pour récupérer l'utilisateur connecté

export function DataExportCard() {
  const { loading, error, createExport, downloadExport } = useDataExport();
  const { user } = useAuth();

  // Vérifier si l'utilisateur a un rôle de gestion
  const canExport = user?.role && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);

  const handleExport = async () => {
    const result = await createExport();
    if (result?.downloadUrl && result.fileName) {
      downloadExport(result.fileName);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <CardTitle>Export de données</CardTitle>
        </div>
        <CardDescription>
          Exportez toutes vos données dans un fichier ZIP pour sauvegarde ou migration
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contenu de l'export */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Contenu de l'export :</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Contrats signés (PDF)</span>
            </div>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span>Factures (PDF)</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Clients (JSON + CSV)</span>
            </div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Prospects (JSON + CSV)</span>
            </div>
          </div>
        </div>

        {/* Avertissement expiration */}
        <Alert>
          <AlertDescription>
            ⚠️ Le fichier d'export expire automatiquement après 24 heures pour des raisons de sécurité.
          </AlertDescription>
        </Alert>

        {/* Erreur */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Bouton d'export */}
        {canExport ? (
          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {loading ? 'Export en cours...' : 'Exporter mes données'}
          </Button>
        ) : (
          <div className="space-y-2">
            <Alert variant="destructive">
              <AlertDescription>
                Cette fonctionnalité nécessite un rôle de gestion (MANAGER, ADMIN ou SUPER_ADMIN)
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Votre rôle actuel : <strong>{user?.role || 'Non défini'}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Contactez un administrateur pour obtenir les permissions nécessaires.
            </p>
          </div>
        )}

        {/* Recommandation */}
        <p className="text-xs text-muted-foreground">
          💡 Nous vous recommandons d'exporter régulièrement vos données pour assurer leur sauvegarde.
        </p>
      </CardContent>
    </Card>
  );
}
```

### 3. Hook useAuth pour vérifier le rôle

```typescript
// hooks/useAuth.ts
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

export function useAuth() {
  const { data, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) throw new Error('Failed to fetch user');

      return await response.json() as User;
    }
  });

  const hasRole = (role: string): boolean => {
    return data?.role === role;
  };

  const hasAnyRole = (...roles: string[]): boolean => {
    return roles.includes(data?.role || '');
  };

  return {
    user: data,
    isLoading,
    hasRole,
    hasAnyRole,
  };
}
```

### 4. Page Paramètres avec Export

```typescript
// pages/SettingsDataPage.tsx
import React from 'react';
import { DataExportCard } from '@/components/DataExportCard';
import { AccountDeletionCard } from '@/components/AccountDeletionCard';

export function SettingsDataPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des données</h1>
          <p className="text-muted-foreground">
            Exportez ou supprimez vos données
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <DataExportCard />
          <AccountDeletionCard />
        </div>
      </div>
    </div>
  );
}
```

## Notifications et UX

### Notifications de succès

```typescript
toast({
  title: "Export créé avec succès",
  description: "Votre téléchargement va commencer automatiquement",
  variant: "default",
});
```

### Notifications d'erreur

```typescript
toast({
  title: "Erreur lors de l'export",
  description: "Veuillez réessayer ou contacter le support",
  variant: "destructive",
});
```

### Loading State

```tsx
{loading && (
  <div className="flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Préparation de l'export...</span>
  </div>
)}
```

## Responsive Design

```tsx
// Mobile-first design
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <DataExportCard />
</div>
```

## Tests

### Test du hook useDataExport

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useDataExport } from '@/hooks/useDataExport';

describe('useDataExport', () => {
  it('should create export successfully', async () => {
    const { result } = renderHook(() => useDataExport());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const exportResult = await result.current.createExport();

    expect(exportResult?.success).toBe(true);
    expect(exportResult?.fileName).toBeDefined();
  });

  it('should handle 403 error for non-enterprise plan', async () => {
    // Mock API to return 403
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: 'Data export feature not available in your plan',
        upgrade_required: 'enterprise'
      })
    });

    const { result } = renderHook(() => useDataExport());
    const exportResult = await result.current.createExport();

    expect(exportResult).toBeNull();
    expect(result.current.error).toContain('Enterprise');
  });
});
```

## Bonnes Pratiques

1. **Feedback utilisateur :** Toujours afficher un loader pendant l'export
2. **Gestion d'erreurs :** Messages clairs et solutions proposées
3. **Contrôle d'accès :** Vérifier le rôle utilisateur avant d'afficher le bouton
4. **Sécurité :** Ne jamais exposer les tokens dans les URLs
5. **Accessibilité :** Labels clairs et support clavier
6. **Performance :** Utiliser React Query pour le cache du profil utilisateur
7. **UX :** Afficher clairement le rôle requis et le rôle actuel de l'utilisateur

## Exemples de Messages Utilisateur

### Message de confirmation
```
✅ Export créé avec succès !

Votre export contient :
- 45 contrats signés
- 12 factures
- 230 clients
- 67 prospects

Le téléchargement va commencer automatiquement.
⚠️ Ce fichier expire dans 24 heures.
```

### Message pour permissions insuffisantes
```
🔒 Permissions insuffisantes

Cette fonctionnalité nécessite un rôle de gestion.

Rôles autorisés :
✅ MANAGER
✅ ADMIN
✅ SUPER_ADMIN

Votre rôle actuel : USER

Contactez un administrateur pour obtenir les permissions nécessaires.
```

## Support et Débogage

- Vérifier les logs navigateur (console)
- Inspecter la réponse réseau dans DevTools
- Confirmer que le token JWT est valide
- Vérifier le rôle de l'utilisateur connecté
- S'assurer que l'utilisateur a un des rôles requis : MANAGER, ADMIN ou SUPER_ADMIN
