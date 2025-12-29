# Plan d'Action - Audit API Rate Limiting

## 📊 Résumé des Problèmes Identifiés

### Problème Principal
- **503 errors** causés par rate limiting trop agressif (10 req/s)
- **Frontend fait 40+ requêtes** au lieu de 6 nécessaires
- **N+1 queries** sur les endpoints (200+ requêtes DB)

### Impact Business
- ❌ Utilisateurs bloqués lors du chargement de la page
- ❌ Expérience utilisateur dégradée
- ❌ Performance API médiocre

---

## 🔴 ACTIONS CRITIQUES (À faire aujourd'hui)

### ✅ 1. Ajuster Rate Limiting Nginx (FAIT)

**Fichiers modifiés** :
- `nginx/nginx.conf` : Rate limit passé de 10r/s à 30r/s
- `nginx/conf.d/api.conf` :
  - Zone spéciale `read_limit` (50r/s) pour endpoints de lecture
  - OPTIONS requests exclus du rate limiting
  - Burst augmenté (20 → 50 pour API générale, 100 pour dresses)

**Déployer** :
```bash
# Sur le serveur de production
docker-compose exec nginx nginx -t          # Tester la config
docker-compose restart nginx                # Redémarrer Nginx
```

**Impact attendu** : -90% d'erreurs 503

---

### ✅ 2. Optimiser N+1 Queries (FAIT)

**Fichiers modifiés** :
- `src/controllers/dressController/dressController.ts`
  - Optimisé `rental_count` : 200 requêtes → 1 requête groupée
  - Ajouté métadonnées de filtres dans la réponse

**Déployer** :
```bash
npm run build                               # Build le backend
docker-compose restart api                  # Redémarrer l'API
```

**Impact attendu** : -80% du temps de réponse

---

### ✅ 3. Ajouter Métadonnées de Filtres (FAIT)

**Nouveau format de réponse** `/dresses/details-view` :
```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "limit": 20,
  "data": [...],
  "filters": {
    "types": [{"id": "...", "name": "Robe de soirée", "count": 15}],
    "sizes": [{"id": "...", "name": "M", "count": 18}],
    "colors": [{"id": "...", "name": "Rouge", "hex_code": "#FF0000", "count": 7}],
    "conditions": [{"id": "...", "name": "Neuf", "count": 5}],
    "priceRange": {"min_ttc": 150, "max_ttc": 1200, ...},
    "stockInfo": {"total_in_stock": 35, "total_sold_out": 7, ...}
  }
}
```

**Bénéfice** : Élimine 5 appels API séparés (/dress-types, /dress-sizes, etc.)

---

## 🟠 ACTIONS IMPORTANTES (Cette semaine)

### 4. Mettre à Jour le Frontend

**Problème** : Le frontend fait des appels dupliqués et ne cache rien

**À faire** :

#### A. Installer React Query
```bash
npm install @tanstack/react-query
```

#### B. Créer un Query Client
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // Cache 5 minutes
      retry: 2,                   // Max 2 retries (au lieu de 5)
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000), // Backoff exponentiel
    },
  },
});
```

#### C. Wrapper l'App
```typescript
// src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Vos routes */}
    </QueryClientProvider>
  );
}
```

#### D. Créer un Hook Réutilisable
```typescript
// src/hooks/useDresses.ts
import { useQuery } from '@tanstack/react-query';

export function useDresses(filters = {}) {
  return useQuery({
    queryKey: ['dresses', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',  // ⚠️ Max 20-50, pas 200 !
        in_stock: 'true',
        ...filters
      });
      const res = await fetch(`/api/dresses/details-view?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });
}
```

#### E. Utiliser dans les Composants
```typescript
// Remplacer TOUS vos fetch() par ce hook
function DressListPage() {
  const { data, isLoading, error } = useDresses({ in_stock: true });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <>
      {/* Utiliser data.filters pour les filtres */}
      <FilterPanel filters={data.filters} />

      {/* Utiliser data.data pour la liste */}
      <DressList dresses={data.data} />
    </>
  );
}
```

#### F. Supprimer les Anciens Appels
```typescript
// ❌ SUPPRIMER ces appels dupliqués :
// fetch('/dress-types')
// fetch('/dress-sizes')
// fetch('/dress-colors')
// fetch('/dress-conditions')
// fetch('/contract-packages')  (si non lié aux robes)
// fetch('/contract-addons')    (si non lié aux robes)

// ✅ GARDER seulement :
// useDresses() qui contient déjà tout
```

**Impact attendu** : -85% de requêtes HTTP

---

### 5. Limiter le `limit` Maximum

**Problème** : `limit=200` surcharge l'API

**À faire** :

```typescript
// src/controllers/dressController/dressController.ts (ligne 754)
const pageNum = parseInt(page as string, 10);
const limitNum = Math.min(parseInt(limit as string, 10), 50); // ⚠️ Max 50
const skip = (pageNum - 1) * limitNum;
```

**Déployer** : Rebuild + restart API

**Frontend** : Implémenter pagination ou infinite scroll pour charger progressivement

---

### 6. Ajouter Circuit Breaker Frontend

**Problème** : Retries infinis aggravent le rate limiting

**À faire** :

```typescript
// src/lib/apiClient.ts
class APIClient {
  private failureCount = 0;
  private circuitBreakerThreshold = 5;
  private circuitBreakerOpenUntil: number | null = null;

  async fetch(url: string, options: RequestInit = {}) {
    // Circuit breaker check
    if (this.circuitBreakerOpenUntil && Date.now() < this.circuitBreakerOpenUntil) {
      throw new Error('Too many failures - please wait before retrying');
    }

    try {
      const res = await fetch(url, options);
      if (res.ok) {
        this.failureCount = 0; // Reset on success
      } else if (res.status === 503) {
        this.failureCount++;
        if (this.failureCount >= this.circuitBreakerThreshold) {
          this.circuitBreakerOpenUntil = Date.now() + 30000; // 30s timeout
          console.error('Circuit breaker opened');
        }
      }
      return res;
    } catch (error) {
      this.failureCount++;
      throw error;
    }
  }
}

export const apiClient = new APIClient();
```

---

## 🟢 AMÉLIORATIONS (Prochaines sprints)

### 7. Ajouter Redis Cache (Backend)

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export const getDressesWithDetails = async (req, res) => {
  const cacheKey = `dresses:${organizationId}:${JSON.stringify(req.query)}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  // ... query DB ...

  // Store in cache (5 minutes)
  await redis.setex(cacheKey, 300, JSON.stringify(response));
  res.json(response);
};
```

---

### 8. Créer Vue SQL Matérialisée pour rental_count

```sql
-- migrations/add_rental_count_view.sql
CREATE MATERIALIZED VIEW dress_rental_counts AS
SELECT
  d.id as dress_id,
  d.organization_id,
  COUNT(DISTINCT cd.contract_id) as rental_count
FROM dresses d
LEFT JOIN contract_dresses cd ON cd.dress_id = d.id
LEFT JOIN contracts c ON c.id = cd.contract_id AND c.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.organization_id;

CREATE INDEX idx_dress_rental_counts_org ON dress_rental_counts(organization_id);
CREATE UNIQUE INDEX idx_dress_rental_counts_dress ON dress_rental_counts(dress_id);

-- Rafraîchir toutes les heures via cron
REFRESH MATERIALIZED VIEW CONCURRENTLY dress_rental_counts;
```

---

### 9. Implémenter Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function DressList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['dresses'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/dresses/details-view?page=${pageParam}&limit=20`
      );
      return res.json();
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.data.length === 20 ? pages.length + 1 : undefined;
    },
  });

  const allDresses = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <>
      {allDresses.map(dress => <DressCard key={dress.id} dress={dress} />)}
      {hasNextPage && <button onClick={() => fetchNextPage()}>Charger plus</button>}
    </>
  );
}
```

---

## 📋 Checklist de Déploiement

### Backend
- [x] Optimiser N+1 queries (rental_count)
- [x] Ajouter métadonnées de filtres
- [x] Build TypeScript
- [ ] Tester localement
- [ ] Push sur Git
- [ ] Déployer sur production

### Nginx
- [x] Ajuster rate limiting
- [x] Gérer OPTIONS hors rate limit
- [ ] Tester config (`nginx -t`)
- [ ] Redémarrer Nginx sur prod

### Frontend
- [ ] Installer React Query
- [ ] Créer queryClient
- [ ] Migrer vers useDresses hook
- [ ] Supprimer appels dupliqués
- [ ] Tester localement
- [ ] Déployer sur production

---

## 📈 Métriques de Succès

| Métrique | Avant | Cible | Comment Mesurer |
|----------|-------|-------|-----------------|
| Erreurs 503 | 80%+ | <5% | Logs Nginx |
| Requêtes HTTP (page load) | 40+ | 6 | Network tab Chrome |
| Temps réponse /dresses | ~3s | <500ms | Network tab |
| DB queries (/dresses) | 200+ | 15 | Logs Prisma |

---

## 🚨 Points d'Attention

1. **Déployer Nginx AVANT l'API** : Sinon les 503 continuent
2. **Tester en staging d'abord** : Rate limiting peut affecter d'autres endpoints
3. **Monitorer après déploiement** : Vérifier les logs pendant 1h
4. **Frontend nécessite refactoring** : Prévoir 2-3 jours de dev

---

## 💡 Questions Ouvertes

1. **Avez-vous un environnement de staging ?**
   - Si oui : déployer là d'abord
   - Si non : déployer en heures creuses

2. **Combien d'utilisateurs simultanés max ?**
   - Permet d'ajuster finement le rate limiting

3. **Quel framework frontend utilisez-vous ?**
   - React ? Vue ? Svelte ?
   - Les exemples React Query sont adaptables

---

**Créé le** : 2025-12-29
**Par** : Audit API Claude Code
